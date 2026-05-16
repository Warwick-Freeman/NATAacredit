using Microsoft.EntityFrameworkCore;
using NexusApi.Data;
using NexusApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NexusDbContext>(opt =>
    opt.UseSqlite("Data Source=nexus.db"));

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(
        "http://localhost:5173",
        "http://localhost:4173",
        "http://18.221.101.26")
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

var dataDir = Path.Combine(app.Environment.ContentRootPath, "data");
Directory.CreateDirectory(dataDir);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NexusDbContext>();
    db.Database.EnsureCreated();

    // Create Documents table if it doesn't exist yet (safe on existing databases)
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Documents (
            Id              INTEGER PRIMARY KEY AUTOINCREMENT,
            DocId           TEXT NOT NULL DEFAULT '',
            Title           TEXT NOT NULL DEFAULT '',
            Version         TEXT NOT NULL DEFAULT '1.0',
            Status          TEXT NOT NULL DEFAULT 'Draft',
            Folder          TEXT NOT NULL DEFAULT 'sops',
            Owner           TEXT NOT NULL DEFAULT '',
            Clauses         TEXT NOT NULL DEFAULT '',
            ReviewDue       TEXT NOT NULL DEFAULT '—',
            Updated         TEXT NOT NULL DEFAULT '',
            FileType        TEXT,
            FileName        TEXT,
            StoredFileName  TEXT,
            Workflow        TEXT NOT NULL DEFAULT '[]'
        )
        """);

    SeedData.Seed(db);
    SeedData.SeedDocuments(db);

    // Import HTML files from the sop/ directory at the repo root
    var sopDir = Path.Combine(app.Environment.ContentRootPath, "..", "sop");
    SeedData.ImportSopDirectory(db, sopDir, dataDir);
}

app.UseCors();

// ── Existing endpoints ───────────────────────────────────────────────────────

app.MapGet("/api/studies", async (NexusDbContext db) =>
    await db.Studies.ToListAsync());

app.MapGet("/api/studies/{id}", async (string id, NexusDbContext db) =>
    await db.Studies.FirstOrDefaultAsync(s => s.StudyId == id)
        is { } study ? Results.Ok(study) : Results.NotFound());

app.MapGet("/api/equipment", async (NexusDbContext db) =>
    await db.Equipment.ToListAsync());

app.MapGet("/api/indicators", async (NexusDbContext db) =>
    await db.Indicators.ToListAsync());

app.MapGet("/api/clauses", async (NexusDbContext db) =>
    await db.Clauses.ToListAsync());

app.MapGet("/api/clauses/{id}", async (string id, NexusDbContext db) =>
    await db.Clauses.FirstOrDefaultAsync(c => c.ClauseId == id)
        is { } clause ? Results.Ok(clause) : Results.NotFound());

app.MapGet("/api/compliance", async (NexusDbContext db) =>
    await db.ComplianceSections.ToListAsync());

app.MapGet("/api/tasks", async (NexusDbContext db) =>
    await db.Tasks.ToListAsync());

app.MapGet("/api/activity", async (NexusDbContext db) =>
    await db.Activity.ToListAsync());

// ── Documents ────────────────────────────────────────────────────────────────

DocumentDto ToDto(Document d) => new(
    d.DocId, d.Title, d.Version, d.Status, d.Folder,
    d.Owner, d.Clauses, d.ReviewDue, d.Updated,
    d.FileType, d.FileName, d.StoredFileName != null, d.Workflow);

// GET  /api/documents
app.MapGet("/api/documents", async (NexusDbContext db) =>
    (await db.Documents.ToListAsync()).Select(ToDto));

// GET  /api/documents/{id}
app.MapGet("/api/documents/{id}", async (string id, NexusDbContext db) =>
    await db.Documents.FirstOrDefaultAsync(d => d.DocId == id) is { } doc
        ? Results.Ok(ToDto(doc)) : Results.NotFound());

// POST /api/documents  (multipart: metadata fields + optional "file")
app.MapPost("/api/documents", async (HttpRequest req, NexusDbContext db) =>
{
    var form = await req.ReadFormAsync();
    var doc = new Document
    {
        DocId     = form["docId"].ToString(),
        Title     = form["title"].ToString(),
        Version   = form["version"].ToString() is { Length: > 0 } v ? v : "1.0",
        Status    = form["status"].ToString()  is { Length: > 0 } s ? s : "Draft",
        Folder    = form["folder"].ToString()  is { Length: > 0 } f ? f : "sops",
        Owner     = form["owner"].ToString(),
        Clauses   = form["clauses"].ToString(),
        ReviewDue = form["reviewDue"].ToString() is { Length: > 0 } r ? r : "—",
        Updated   = DateTime.Now.ToString("dd MMM yyyy"),
        Workflow  = form["workflow"].ToString() is { Length: > 0 } w ? w : "[]",
    };

    var file = form.Files.GetFile("file");
    if (file != null)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        var storedName = doc.DocId.Replace("/", "_").Replace(" ", "_") + ext;
        await using var stream = File.Create(Path.Combine(dataDir, storedName));
        await file.CopyToAsync(stream);
        doc.FileType       = ext == ".pdf" ? "pdf" : "html";
        doc.FileName       = file.FileName;
        doc.StoredFileName = storedName;
    }

    db.Documents.Add(doc);
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
});

// PUT  /api/documents/{id}  (JSON body — update metadata & workflow)
app.MapPut("/api/documents/{id}", async (string id, DocumentUpdateDto dto, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    doc.Title     = dto.Title;
    doc.Version   = dto.Version;
    doc.Status    = dto.Status;
    doc.Folder    = dto.Folder;
    doc.Owner     = dto.Owner;
    doc.Clauses   = dto.Clauses;
    doc.ReviewDue = dto.ReviewDue;
    doc.Updated   = dto.Updated;
    doc.Workflow  = dto.Workflow;
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
});

// POST /api/documents/{id}/file  (multipart: "file" field — attach or replace)
app.MapPost("/api/documents/{id}/file", async (string id, HttpRequest req, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();

    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null) return Results.BadRequest("No file provided");

    // Delete old file if present
    if (doc.StoredFileName != null)
    {
        var old = Path.Combine(dataDir, doc.StoredFileName);
        if (File.Exists(old)) File.Delete(old);
    }

    var ext = Path.GetExtension(file.FileName).ToLower();
    var storedName = doc.DocId.Replace("/", "_").Replace(" ", "_") + ext;
    await using var stream = File.Create(Path.Combine(dataDir, storedName));
    await file.CopyToAsync(stream);
    doc.FileType       = ext == ".pdf" ? "pdf" : "html";
    doc.FileName       = file.FileName;
    doc.StoredFileName = storedName;
    doc.Updated        = DateTime.Now.ToString("dd MMM yyyy");
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
});

// GET  /api/documents/{id}/file  (stream file inline)
app.MapGet("/api/documents/{id}/file", async (string id, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc?.StoredFileName == null) return Results.NotFound();
    var path = Path.Combine(dataDir, doc.StoredFileName);
    if (!File.Exists(path)) return Results.NotFound();
    var contentType = doc.FileType == "pdf" ? "application/pdf" : "text/html; charset=utf-8";
    return Results.File(path, contentType);
});

app.Run();

record DocumentDto(
    string DocId, string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string? FileType, string? FileName, bool HasFile, string Workflow);

record DocumentUpdateDto(
    string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string Workflow);
