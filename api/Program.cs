using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NexusApi.Data;
using NexusApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Load or generate JWT signing key ────────────────────────────────────────

var keyPath = Path.Combine(builder.Environment.ContentRootPath, "jwt.key");
byte[] jwtKeyBytes;
if (File.Exists(keyPath))
{
    jwtKeyBytes = Convert.FromBase64String(File.ReadAllText(keyPath).Trim());
}
else
{
    jwtKeyBytes = RandomNumberGenerator.GetBytes(32);
    File.WriteAllText(keyPath, Convert.ToBase64String(jwtKeyBytes));
}
var jwtKey = new SymmetricSecurityKey(jwtKeyBytes);

// ── Services ─────────────────────────────────────────────────────────────────

builder.Services.AddDbContext<NexusDbContext>(opt =>
    opt.UseSqlite("Data Source=nexus.db"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = jwtKey,
            ValidateIssuer           = true,
            ValidIssuer              = "nexus360",
            ValidateAudience         = true,
            ValidAudience            = "nexus360",
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(
        "http://localhost:5173",
        "http://localhost:4173",
        "http://18.221.101.26",
        "https://18.221.101.26")
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

var dataDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "data"));
Directory.CreateDirectory(dataDir);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NexusDbContext>();
    db.Database.EnsureCreated();

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

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Users (
            Id           INTEGER PRIMARY KEY AUTOINCREMENT,
            Email        TEXT NOT NULL,
            PasswordHash TEXT NOT NULL DEFAULT '',
            Name         TEXT NOT NULL DEFAULT '',
            Role         TEXT NOT NULL DEFAULT '',
            Mfa          INTEGER NOT NULL DEFAULT 0,
            Auth         TEXT NOT NULL DEFAULT 'Local',
            LastSeen     TEXT NOT NULL DEFAULT '—'
        )
        """);

    SeedData.Seed(db);
    SeedData.SeedDocuments(db);
    SeedData.SeedUsers(db);

    var sopDir = Path.Combine(app.Environment.ContentRootPath, "..", "sop");
    SeedData.ImportSopDirectory(db, sopDir, dataDir);
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Auth ─────────────────────────────────────────────────────────────────────

app.MapPost("/api/auth/login", async (LoginDto dto, NexusDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
    if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        return Results.Unauthorized();

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim("name",                         user.Name),
        new Claim("role",                         user.Role),
    };

    var token = new JwtSecurityToken(
        issuer:             "nexus360",
        audience:           "nexus360",
        claims:             claims,
        expires:            DateTime.UtcNow.AddDays(7),
        signingCredentials: new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256));

    return Results.Ok(new
    {
        token = new JwtSecurityTokenHandler().WriteToken(token),
        user  = new
        {
            id       = user.Id,
            name     = user.Name,
            role     = user.Role,
            email    = user.Email,
            initials = Initials(user.Name),
        },
    });
});

app.MapGet("/api/users", async (NexusDbContext db) =>
    (await db.Users.ToListAsync()).Select(u => new
    {
        id       = u.Id,
        email    = u.Email,
        name     = u.Name,
        role     = u.Role,
        mfa      = u.Mfa,
        auth     = u.Auth,
        lastSeen = u.LastSeen,
    })
).RequireAuthorization();

// ── Studies ───────────────────────────────────────────────────────────────────

var validStudyStatuses = new HashSet<string>(StringComparer.Ordinal)
    { "Scoring", "Preliminary", "Awaiting sign-off", "Final" };

app.MapGet("/api/studies", async (NexusDbContext db) =>
    await db.Studies.ToListAsync()).RequireAuthorization();

app.MapGet("/api/studies/{id}", async (string id, NexusDbContext db) =>
    await db.Studies.FirstOrDefaultAsync(s => s.StudyId == id)
        is { } study ? Results.Ok(study) : Results.NotFound()).RequireAuthorization();

app.MapPatch("/api/studies/{id}/status", async (string id, StudyStatusDto dto, NexusDbContext db) =>
{
    if (!validStudyStatuses.Contains(dto.Status))
        return Results.BadRequest("Invalid status value.");
    var study = await db.Studies.FirstOrDefaultAsync(s => s.StudyId == id);
    if (study == null) return Results.NotFound();
    study.Status = dto.Status;
    if (dto.SignedDays.HasValue) study.SignedDays = dto.SignedDays;
    await db.SaveChangesAsync();
    return Results.Ok(study);
}).RequireAuthorization();

app.MapGet("/api/equipment",   async (NexusDbContext db) => await db.Equipment.ToListAsync()).RequireAuthorization();
app.MapGet("/api/indicators",  async (NexusDbContext db) => await db.Indicators.ToListAsync()).RequireAuthorization();
app.MapGet("/api/clauses",     async (NexusDbContext db) => await db.Clauses.ToListAsync()).RequireAuthorization();
app.MapGet("/api/clauses/{id}", async (string id, NexusDbContext db) =>
    await db.Clauses.FirstOrDefaultAsync(c => c.ClauseId == id)
        is { } clause ? Results.Ok(clause) : Results.NotFound()).RequireAuthorization();
app.MapGet("/api/compliance",  async (NexusDbContext db) => await db.ComplianceSections.ToListAsync()).RequireAuthorization();
app.MapGet("/api/tasks",       async (NexusDbContext db) => await db.Tasks.ToListAsync()).RequireAuthorization();
app.MapGet("/api/activity",    async (NexusDbContext db) => await db.Activity.ToListAsync()).RequireAuthorization();

// ── Documents ─────────────────────────────────────────────────────────────────

DocumentDto ToDto(Document d) => new(
    d.DocId, d.Title, d.Version, d.Status, d.Folder,
    d.Owner, d.Clauses, d.ReviewDue, d.Updated,
    d.FileType, d.FileName, d.StoredFileName != null, d.Workflow);

app.MapGet("/api/documents", async (NexusDbContext db) =>
    (await db.Documents.ToListAsync()).Select(ToDto)).RequireAuthorization();

app.MapGet("/api/documents/{id}", async (string id, NexusDbContext db) =>
    await db.Documents.FirstOrDefaultAsync(d => d.DocId == id) is { } doc
        ? Results.Ok(ToDto(doc)) : Results.NotFound()).RequireAuthorization();

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
        var stored = SaveFile(doc.DocId, file, dataDir);
        if (stored == null) return Results.BadRequest("Disallowed file type.");
        var ext = Path.GetExtension(file.FileName).ToLower();
        doc.FileType       = ext == ".pdf" ? "pdf" : "html";
        doc.FileName       = Path.GetFileName(file.FileName);
        doc.StoredFileName = stored;
    }

    db.Documents.Add(doc);
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

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
}).RequireAuthorization();

app.MapPost("/api/documents/{id}/file", async (string id, HttpRequest req, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();

    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null) return Results.BadRequest("No file provided.");

    if (doc.StoredFileName != null)
    {
        var old = Path.Combine(dataDir, doc.StoredFileName);
        if (File.Exists(old)) File.Delete(old);
    }

    var stored = SaveFile(doc.DocId, file, dataDir);
    if (stored == null) return Results.BadRequest("Disallowed file type.");
    var ext = Path.GetExtension(file.FileName).ToLower();
    doc.FileType       = ext == ".pdf" ? "pdf" : "html";
    doc.FileName       = Path.GetFileName(file.FileName);
    doc.StoredFileName = stored;
    doc.Updated        = DateTime.Now.ToString("dd MMM yyyy");
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

app.MapGet("/api/documents/{id}/file", async (string id, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc?.StoredFileName == null) return Results.NotFound();
    var path = Path.Combine(dataDir, doc.StoredFileName);
    if (!File.Exists(path)) return Results.NotFound();
    var contentType = doc.FileType == "pdf" ? "application/pdf" : "text/html; charset=utf-8";
    return Results.File(path, contentType);
}).RequireAuthorization();

app.Run();

// ── Helpers ───────────────────────────────────────────────────────────────────

string? SaveFile(string docId, IFormFile file, string dataDir)
{
    var allowed = new HashSet<string> { ".pdf", ".html" };
    var ext = Path.GetExtension(file.FileName).ToLower();
    if (!allowed.Contains(ext)) return null;

    var safeName = Regex.Replace(docId, @"[^a-zA-Z0-9\-]", "_") + ext;
    var fullPath = Path.GetFullPath(Path.Combine(dataDir, safeName));
    if (!fullPath.StartsWith(dataDir + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        return null;

    using var stream = File.Create(fullPath);
    file.CopyTo(stream);
    return safeName;
}

bool VerifyPassword(string password, string stored)
{
    var parts = stored.Split('.');
    if (parts.Length != 2) return false;
    try
    {
        var salt         = Convert.FromBase64String(parts[0]);
        var expectedHash = Convert.FromBase64String(parts[1]);
        var actualHash   = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
    catch { return false; }
}

string Initials(string name)
{
    var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    return string.Concat(parts.Take(2).Select(w => char.ToUpper(w[0])));
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

record LoginDto(string Email, string Password);
record StudyStatusDto(string Status, int? SignedDays);

record DocumentDto(
    string DocId, string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string? FileType, string? FileName, bool HasFile, string Workflow);

record DocumentUpdateDto(
    string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string Workflow);
