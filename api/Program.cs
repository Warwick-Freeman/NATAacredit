using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.Data.Sqlite;
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

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SiteConfig (
            Key   TEXT PRIMARY KEY,
            Value TEXT NOT NULL DEFAULT ''
        )
        """);

    // Add columns introduced after initial schema creation (idempotent)
    foreach (var col in new[] {
        "ALTER TABLE Activity ADD COLUMN Ts        TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE Activity ADD COLUMN Module    TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE Activity ADD COLUMN Detail    TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE Appointments ADD COLUMN PatientId TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE Clauses ADD COLUMN Standard TEXT NOT NULL DEFAULT 'asa'",
        "ALTER TABLE Clauses ADD COLUMN Category TEXT",
        "ALTER TABLE ComplianceSections ADD COLUMN Standard TEXT NOT NULL DEFAULT 'asa'",
        "ALTER TABLE Documents ADD COLUMN ContentText TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE Documents ADD COLUMN RevisionOf TEXT",
        "ALTER TABLE Tasks ADD COLUMN AssignedTo TEXT NOT NULL DEFAULT ''",
    })
    {
        try { db.Database.ExecuteSqlRaw(col); } catch { /* column already exists */ }
    }

    // Flush all cached SQLite connections so subsequent queries see the updated schema
    SqliteConnection.ClearAllPools();

    // Seed default config if not present
    if (!db.SiteConfig.Any(c => c.Key == "standard"))
    {
        db.SiteConfig.Add(new NexusApi.Models.SiteConfig { Key = "standard", Value = "asa" });
        db.SaveChanges();
    }

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Appointments (
            Id          INTEGER PRIMARY KEY AUTOINCREMENT,
            SiteId      TEXT NOT NULL DEFAULT '',
            Type        TEXT NOT NULL DEFAULT 'psg',
            PatientName TEXT NOT NULL DEFAULT '',
            Start       TEXT NOT NULL DEFAULT '',
            End         TEXT NOT NULL DEFAULT '',
            RoomId      TEXT NOT NULL DEFAULT '',
            EquipmentId TEXT NOT NULL DEFAULT '',
            Physician   TEXT NOT NULL DEFAULT '',
            Technician  TEXT NOT NULL DEFAULT '',
            Notes       TEXT NOT NULL DEFAULT '',
            Status      TEXT NOT NULL DEFAULT 'scheduled',
            CreatedBy   TEXT NOT NULL DEFAULT '',
            CreatedAt   TEXT NOT NULL DEFAULT ''
        )
        """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS IsrAssessments (
            Id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            AssessmentRef      TEXT NOT NULL DEFAULT '',
            Quarter            TEXT NOT NULL DEFAULT '',
            Scorer             TEXT NOT NULL DEFAULT '',
            Reviewer           TEXT NOT NULL DEFAULT '',
            ReviewerRole       TEXT NOT NULL DEFAULT '',
            AttestationBy      TEXT NOT NULL DEFAULT '',
            AttestationDate    TEXT NOT NULL DEFAULT '',
            StudyIds           TEXT NOT NULL DEFAULT '[]',
            Results            TEXT NOT NULL DEFAULT '{{}}',
            Thresholds         TEXT NOT NULL DEFAULT '{{}}',
            ProdigiSessionData TEXT NOT NULL DEFAULT '{{}}',
            Status             TEXT NOT NULL DEFAULT 'pending',
            SignedBy           TEXT NOT NULL DEFAULT '',
            SignedAt           TEXT NOT NULL DEFAULT '',
            Notes              TEXT NOT NULL DEFAULT '',
            CreatedAt          TEXT NOT NULL DEFAULT ''
        )
        """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS FormRecords (
            Id           INTEGER PRIMARY KEY AUTOINCREMENT,
            FormId       TEXT NOT NULL DEFAULT '',
            RecordRef    TEXT NOT NULL DEFAULT '',
            FormTitle    TEXT NOT NULL DEFAULT '',
            CompletedBy  TEXT NOT NULL DEFAULT '',
            CompletedAt  TEXT NOT NULL DEFAULT '',
            Period       TEXT NOT NULL DEFAULT '',
            Notes        TEXT NOT NULL DEFAULT '',
            FormData     TEXT NOT NULL DEFAULT '{{}}',
            SnapshotHtml TEXT NOT NULL DEFAULT ''
        )
        """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS WorkbookCompletions (
            Id          INTEGER PRIMARY KEY AUTOINCREMENT,
            WorkbookId  TEXT NOT NULL DEFAULT '',
            Period      TEXT NOT NULL DEFAULT '',
            StartedAt   TEXT NOT NULL DEFAULT '',
            CompletedAt TEXT NOT NULL DEFAULT '',
            CompletedBy TEXT NOT NULL DEFAULT '',
            FormData    TEXT NOT NULL DEFAULT '{{}}',
            Status      TEXT NOT NULL DEFAULT 'in-progress'
        )
        """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS WorkbookSchedules (
            Id            INTEGER PRIMARY KEY AUTOINCREMENT,
            WorkbookId    TEXT NOT NULL DEFAULT '',
            Title         TEXT NOT NULL DEFAULT '',
            Condition     TEXT NOT NULL DEFAULT '',
            FileName      TEXT NOT NULL DEFAULT '',
            Frequency     TEXT NOT NULL DEFAULT 'quarterly',
            LastCompleted TEXT NOT NULL DEFAULT '',
            NextDue       TEXT NOT NULL DEFAULT '',
            AssignedTo    TEXT NOT NULL DEFAULT '',
            Notes         TEXT NOT NULL DEFAULT ''
        )
        """);

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Rooms (
            Id        INTEGER PRIMARY KEY AUTOINCREMENT,
            SiteId    TEXT NOT NULL DEFAULT '',
            RoomId    TEXT NOT NULL DEFAULT '',
            Name      TEXT NOT NULL DEFAULT '',
            Type      TEXT NOT NULL DEFAULT 'general',
            SortOrder INTEGER NOT NULL DEFAULT 0
        )
        """);

    SeedData.Seed(db);
    SeedData.SeedDocuments(db);
    SeedData.SeedUsers(db);
    SeedData.SeedRooms(db);
    SeedData.SeedAppointments(db);

    var sopDir = Path.Combine(app.Environment.ContentRootPath, "..", "sop");
    SeedData.ImportSopDirectory(db, sopDir, dataDir);

    // Backfill ContentText for any HTML documents that haven't been indexed yet
    var unindexed = await db.Documents
        .Where(d => d.ContentText == "" && d.StoredFileName != null && d.FileType == "html")
        .ToListAsync();
    if (unindexed.Count > 0)
    {
        foreach (var doc in unindexed)
        {
            var htmlPath = Path.Combine(dataDir, doc.StoredFileName!);
            if (File.Exists(htmlPath))
                doc.ContentText = ExtractTextFromHtml(await File.ReadAllTextAsync(htmlPath));
        }
        await db.SaveChangesAsync();
    }

    // Copy standard reference PDFs into data/standards/
    var standardsDataDir = Path.Combine(dataDir, "standards");
    Directory.CreateDirectory(standardsDataDir);
    var repoRoot = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, ".."));
    foreach (var pdf in Directory.GetFiles(repoRoot, "*.pdf"))
    {
        var dest = Path.Combine(standardsDataDir, Path.GetFileName(pdf));
        if (!File.Exists(dest)) File.Copy(pdf, dest, overwrite: false);
    }

    // Copy AASM workbook PDFs into the data/workbooks directory
    var workbooksDir = Path.Combine(dataDir, "workbooks");
    Directory.CreateDirectory(workbooksDir);
    var sourceWorkbooksDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "AASM workbooks"));
    if (Directory.Exists(sourceWorkbooksDir))
    {
        foreach (var pdf in Directory.GetFiles(sourceWorkbooksDir, "*.pdf"))
            File.Copy(pdf, Path.Combine(workbooksDir, Path.GetFileName(pdf)), overwrite: true);
    }

    // Seed workbook schedules if not present
    if (!db.WorkbookSchedules.Any())
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var workbooks = new[]
        {
            ("adult-osa",      "Adult OSA Measure Reporting",                "Adult OSA",                "Adult-OSA-Measure-Reporting-Workbook.pdf"),
            ("insomnia",       "Insomnia Measure Reporting",                 "Insomnia",                 "Insomnia-Measure-Reporting-Workbook.pdf"),
            ("narcolepsy",     "Narcolepsy Measure Reporting",               "Narcolepsy",               "Narcolepsy-Measure-Reporting-Workbook.pdf"),
            ("pediatric-osa",  "Pediatric OSA Measure Reporting",            "Pediatric OSA",            "Pediatric-OSA-Measure-Reporting-Workbook.pdf"),
            ("restless-legs",  "Restless Legs Syndrome Measure Reporting",   "Restless Legs Syndrome",   "Restless-Legs-Syndrome-Measure-Reporting-Workbook.pdf"),
        };
        foreach (var (id, title, condition, fileName) in workbooks)
        {
            var nextDue = today.AddMonths(3).ToString("yyyy-MM-dd");
            db.WorkbookSchedules.Add(new NexusApi.Models.WorkbookSchedule
            {
                WorkbookId = id, Title = title, Condition = condition,
                FileName = fileName, Frequency = "quarterly",
                LastCompleted = "", NextDue = nextDue, AssignedTo = "", Notes = "",
            });
        }
        db.SaveChanges();
    }
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

    user.LastSeen = DateTime.Now.ToString("dd MMM yyyy, HH:mm");
    db.Activity.Add(MakeActivity(user.Name, "signed in", "Nexus 360", "login", "login", $"Role: {user.Role}"));
    await db.SaveChangesAsync();

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
var physicianRoles = new HashSet<string>(StringComparer.Ordinal)
    { "Medical Director", "Paediatric Sleep Physician", "Reporting Physician" };
var createDocRoles = new HashSet<string>(StringComparer.Ordinal)
    { "Medical Director", "Quality Manager", "Paediatric Sleep Physician", "Reporting Physician", "Senior Technologist" };
var issueDocRoles  = new HashSet<string>(StringComparer.Ordinal)
    { "Medical Director", "Quality Manager" };

app.MapGet("/api/studies", async (NexusDbContext db) =>
    await db.Studies.ToListAsync()).RequireAuthorization();

app.MapGet("/api/studies/{id}", async (string id, NexusDbContext db) =>
    await db.Studies.FirstOrDefaultAsync(s => s.StudyId == id)
        is { } study ? Results.Ok(study) : Results.NotFound()).RequireAuthorization();

app.MapPatch("/api/studies/{id}/status", async (string id, StudyStatusDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    if (!validStudyStatuses.Contains(dto.Status))
        return Results.BadRequest("Invalid status value.");
    if (dto.Status == "Final" && !physicianRoles.Contains(ActorRole(principal)))
        return Results.Forbid();
    var study = await db.Studies.FirstOrDefaultAsync(s => s.StudyId == id);
    if (study == null) return Results.NotFound();
    study.Status = dto.Status;
    if (dto.SignedDays.HasValue) study.SignedDays = dto.SignedDays;
    db.Activity.Add(MakeActivity(
        ActorName(principal),
        dto.Status == "Final" ? "signed final report" : "updated study status",
        $"{id} — {study.Patient} → {dto.Status}",
        dto.Status == "Final" ? "sign" : "edit",
        "studies",
        dto.Status == "Final" ? $"Report finalised. Turnaround: {dto.SignedDays ?? 0} business days." : ""
    ));
    await db.SaveChangesAsync();
    return Results.Ok(study);
}).RequireAuthorization();

app.MapGet("/api/equipment",   async (NexusDbContext db) => await db.Equipment.ToListAsync()).RequireAuthorization();
app.MapGet("/api/indicators",  async (NexusDbContext db) => await db.Indicators.ToListAsync()).RequireAuthorization();
app.MapGet("/api/config", async (NexusDbContext db) =>
{
    var entries = await db.SiteConfig.ToListAsync();
    return Results.Ok(entries.ToDictionary(e => e.Key, e => e.Value));
}).RequireAuthorization();

app.MapPost("/api/config/standard", async (StandardSwitchDto dto, NexusDbContext db, IWebHostEnvironment env) =>
{
    if (dto.Value != "asa" && dto.Value != "aasm") return Results.BadRequest("Unknown standard");

    var cfg = await db.SiteConfig.FindAsync("standard");
    if (cfg == null) db.SiteConfig.Add(new NexusApi.Models.SiteConfig { Key = "standard", Value = dto.Value });
    else cfg.Value = dto.Value;

    var standardsDir = Path.Combine(env.ContentRootPath, "Standards");
    var jsonPath      = Path.Combine(standardsDir, $"{dto.Value}.json");
    SeedData.SeedStandardIfNeeded(db, dto.Value, jsonPath);

    await db.SaveChangesAsync();
    return Results.Ok(new { standard = dto.Value });
}).RequireAuthorization();

app.MapGet("/api/clauses", async (NexusDbContext db) =>
{
    var std = (await db.SiteConfig.FindAsync("standard"))?.Value ?? "asa";
    return await db.Clauses.Where(c => c.Standard == std).ToListAsync();
}).RequireAuthorization();
app.MapGet("/api/clauses/{id}", async (string id, NexusDbContext db) =>
    await db.Clauses.FirstOrDefaultAsync(c => c.ClauseId == id)
        is { } clause ? Results.Ok(clause) : Results.NotFound()).RequireAuthorization();

app.MapPut("/api/clauses/{id}", async (string id, ClauseUpdateDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var clause = await db.Clauses.FirstOrDefaultAsync(c => c.ClauseId == id);
    if (clause == null) return Results.NotFound();
    var prevStatus = clause.Status;
    if (dto.Status != null)
    {
        clause.Status = dto.Status switch {
            "nc"      => "nonconformant",
            "partial" => "review",
            _         => dto.Status,
        };
    }
    if (dto.Evidence.HasValue) clause.Evidence     = dto.Evidence.Value;
    if (dto.Owner != null)     clause.Owner        = dto.Owner;
    if (dto.LastReviewed != null) clause.LastReviewed = dto.LastReviewed;
    var displayStatus = clause.Status switch {
        "nonconformant" => "non-conformant",
        "review"        => "under review",
        _               => clause.Status,
    };
    db.Activity.Add(MakeActivity(
        ActorName(principal),
        "updated self-assessment",
        $"cl. {id} → '{displayStatus}'",
        "edit",
        "accreditation",
        prevStatus != clause.Status
            ? $"Previous status: {prevStatus}. Clause: {clause.Title}."
            : $"Evidence updated. Clause: {clause.Title}."
    ));
    await db.SaveChangesAsync();
    return Results.Ok(clause);
}).RequireAuthorization();

app.MapGet("/api/compliance", async (NexusDbContext db) =>
{
    var std      = (await db.SiteConfig.FindAsync("standard"))?.Value ?? "asa";
    var sections = await db.ComplianceSections.Where(s => s.Standard == std).OrderBy(s => s.Section).ToListAsync();
    var clauses  = await db.Clauses.Where(c => c.Standard == std).ToListAsync();
    return sections.Select(s => {
        var sc      = clauses.Where(c => c.Section == s.Section).ToList();
        var total   = sc.Count > 0 ? sc.Count : s.Total;
        var ok      = sc.Count(c => c.Status == "compliant");
        var nc      = sc.Count(c => c.Status == "nonconformant" || c.Status == "nc");
        var na      = sc.Count(c => c.Status == "na");
        var partial = Math.Max(0, total - ok - nc - na);
        var status  = nc > 0 ? "nc" : partial > 0 ? "partial" : "ok";
        return new { section = s.Section, title = s.Title, total, ok, nc, na, status };
    });
}).RequireAuthorization();
app.MapGet("/api/tasks", async (NexusDbContext db) => await db.Tasks.ToListAsync()).RequireAuthorization();
app.MapPost("/api/tasks", async (NexusDbContext db, HttpRequest req) =>
{
    using var reader = new System.IO.StreamReader(req.Body);
    var body = await reader.ReadToEndAsync();
    var data = JsonSerializer.Deserialize<JsonElement>(body);
    string Get(string k, string def = "") => data.TryGetProperty(k, out var v) ? (v.GetString() ?? def) : def;
    var count = await db.Tasks.CountAsync();
    var task  = new NexusTask
    {
        TaskId     = $"T-{count + 1:D3}",
        Title      = Get("title"),
        Clause     = Get("clause", "4.3.1"),
        Due        = Get("due", "in 5 days"),
        Priority   = Get("priority", "high"),
        AssignedTo = Get("assignedTo"),
    };
    db.Tasks.Add(task);
    await db.SaveChangesAsync();
    return Results.Ok(task);
}).RequireAuthorization();
app.MapGet("/api/activity", async (NexusDbContext db) =>
{
    var entries = await db.Activity.OrderByDescending(a => a.Ts).ThenByDescending(a => a.Id).ToListAsync();
    return entries.Select(a => new {
        id     = a.Id,
        who    = a.Who,
        action = a.Action,
        target = a.Target,
        time   = a.Time,
        kind   = a.Kind,
        ts     = a.Ts,
        module = a.Module,
        detail = a.Detail,
        hash   = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes($"{a.Id}|{a.Who}|{a.Action}|{a.Target}|{a.Ts}"))
        )[..16].ToLower(),
    });
}).RequireAuthorization();

// ── Documents ─────────────────────────────────────────────────────────────────

DocumentDto ToDto(Document d) => new(
    d.DocId, d.Title, d.Version, d.Status, d.Folder,
    d.Owner, d.Clauses, d.ReviewDue, d.Updated,
    d.FileType, d.FileName, d.StoredFileName != null, d.Workflow, d.RevisionOf);

app.MapGet("/api/documents/search", async (string q, NexusDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(q) || q.Length < 2) return Results.Ok(Array.Empty<object>());
    var lower = q.ToLower();
    var matches = await db.Documents
        .Where(d => d.ContentText != "" && d.ContentText.ToLower().Contains(lower))
        .Select(d => new { d.DocId, d.Title, d.Status, d.Folder, d.Owner, d.Version, d.ContentText })
        .ToListAsync();
    var results = matches.Select(d => new {
        d.DocId, d.Title, d.Status, d.Folder, d.Owner, d.Version,
        Snippet = GetSnippet(d.ContentText, q),
    });
    return Results.Ok(results);
}).RequireAuthorization();

app.MapGet("/api/documents", async (NexusDbContext db) =>
    (await db.Documents.ToListAsync()).Select(ToDto)).RequireAuthorization();

app.MapGet("/api/documents/{id}", async (string id, NexusDbContext db) =>
    await db.Documents.FirstOrDefaultAsync(d => d.DocId == id) is { } doc
        ? Results.Ok(ToDto(doc)) : Results.NotFound()).RequireAuthorization();

app.MapPost("/api/documents", async (HttpRequest req, NexusDbContext db, ClaimsPrincipal principal) =>
{
    if (!createDocRoles.Contains(ActorRole(principal))) return Results.Forbid();

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
    db.Activity.Add(MakeActivity(ActorName(principal), "created document", $"{doc.DocId} — {doc.Title}", "create", "documents",
        $"Status: {doc.Status}. Owner: {doc.Owner}."));
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

app.MapPut("/api/documents/{id}", async (string id, DocumentUpdateDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    if (!createDocRoles.Contains(ActorRole(principal))) return Results.Forbid();
    if (dto.Status == "Issued" && !issueDocRoles.Contains(ActorRole(principal))) return Results.Forbid();
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
    db.Activity.Add(MakeActivity(
        ActorName(principal),
        dto.Status == "Issued" ? "issued document" : "updated document",
        $"{id} — {dto.Title}",
        dto.Status == "Issued" ? "sign" : "edit",
        "documents",
        dto.Status == "Issued" ? $"Document issued. Review due: {dto.ReviewDue}." : $"Status: {dto.Status}."
    ));
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

app.MapPost("/api/documents/{id}/file", async (string id, HttpRequest req, NexusDbContext db, ClaimsPrincipal principal) =>
{
    if (!createDocRoles.Contains(ActorRole(principal))) return Results.Forbid();

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
    db.Activity.Add(MakeActivity(ActorName(principal), "uploaded file to", $"{id} — {Path.GetFileName(file.FileName)}", "upload", "documents",
        $"File: {Path.GetFileName(file.FileName)} · {file.Length / 1024} KB."));
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

app.MapGet("/api/documents/{id}/file", async (string id, NexusDbContext db, HttpContext ctx) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc?.StoredFileName == null) return Results.NotFound();
    var path = Path.Combine(dataDir, doc.StoredFileName);
    if (!File.Exists(path)) return Results.NotFound();
    if (doc.FileType == "pdf")
    {
        ctx.Response.Headers["Content-Disposition"] = $"inline; filename=\"{doc.StoredFileName}\"";
        return Results.File(path, "application/pdf");
    }
    var html = await File.ReadAllTextAsync(path);
    var raw = ctx.Request.Query.ContainsKey("raw");
    if (!raw)
    {
        var script = BuildDocScript(doc);
        if (!string.IsNullOrEmpty(script))
            html = html.Contains("</body>", StringComparison.OrdinalIgnoreCase)
                ? html.Replace("</body>", script + "\n</body>", StringComparison.OrdinalIgnoreCase)
                : html + script;
    }
    return Results.Content(html, "text/html; charset=utf-8");
}).RequireAuthorization();

app.MapPut("/api/documents/{id}/html", async (string id, HttpRequest req, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    if (doc.Status != "Draft") return Results.BadRequest("Only Draft documents can be edited.");
    if (doc.FileType != "html") return Results.BadRequest("Only HTML documents can be edited.");
    if (doc.StoredFileName == null) return Results.BadRequest("No file attached.");

    using var reader = new StreamReader(req.Body, System.Text.Encoding.UTF8);
    var html = await reader.ReadToEndAsync();
    if (string.IsNullOrWhiteSpace(html)) return Results.BadRequest("Empty content.");

    var path = Path.Combine(dataDir, doc.StoredFileName);
    await File.WriteAllTextAsync(path, html, System.Text.Encoding.UTF8);
    try { doc.ContentText = ExtractTextFromHtml(html); } catch { }
    doc.Updated = DateTime.Now.ToString("dd MMM yyyy");
    db.Activity.Add(MakeActivity(ActorName(principal), "edited HTML draft", doc.DocId, "edit", "documents", $"Draft {doc.DocId} updated in editor."));
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(doc));
}).RequireAuthorization();

app.MapDelete("/api/documents/{id}", async (string id, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    if (doc.Status != "Draft") return Results.BadRequest("Only Draft documents can be deleted.");
    if (doc.RevisionOf != null) return Results.BadRequest("Use the /revision endpoint to cancel a revision draft.");

    if (!string.IsNullOrEmpty(doc.StoredFileName))
    {
        var fp = Path.Combine(dataDir, doc.StoredFileName);
        if (File.Exists(fp)) File.Delete(fp);
    }

    db.Documents.Remove(doc);
    db.Activity.Add(MakeActivity(ActorName(principal), "deleted draft", doc.DocId, "delete", "documents", $"Draft {doc.DocId} deleted."));
    await db.SaveChangesAsync();
    return Results.Ok();
}).RequireAuthorization();

app.MapPost("/api/documents/{id}/revise", async (string id, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    if (doc.Status != "Issued" && doc.Status != "Live form") return Results.BadRequest("Only Issued or Live form documents can be revised.");
    if (doc.FileType != "html") return Results.BadRequest("Only HTML documents can be revised.");

    // Determine root DocId and next revision number
    var rootId = doc.RevisionOf ?? doc.DocId;
    var family = await db.Documents.Where(d => d.DocId == rootId || d.RevisionOf == rootId).ToListAsync();
    var revNums = family
        .Select(d => Regex.Match(d.DocId, @"-r(\d+)$"))
        .Where(m => m.Success)
        .Select(m => int.Parse(m.Groups[1].Value))
        .ToList();
    var nextRev = revNums.Count > 0 ? revNums.Max() + 1 : 2;
    var newDocId = $"{rootId}-r{nextRev}";

    // Increment version number
    var verParts = (doc.Version ?? "1.0").Split('.');
    var newVersion = verParts.Length == 2 && int.TryParse(verParts[0], out var major)
        ? $"{major + 1}.0"
        : "2.0";

    // Copy the HTML file
    string? newStoredFile = null;
    if (doc.StoredFileName != null)
    {
        var src = Path.Combine(dataDir, doc.StoredFileName);
        if (File.Exists(src))
        {
            var safeName = Regex.Replace(newDocId, @"[^a-zA-Z0-9\-]", "_") + ".html";
            var dst = Path.Combine(dataDir, safeName);
            File.Copy(src, dst, overwrite: true);
            newStoredFile = safeName;
        }
    }

    var now = DateTime.Now.ToString("dd MMM yyyy");
    var revisionOwner  = ActorName(principal); // person creating this revision becomes the new owner
    var originalFolder = doc.Folder;           // capture before mutating the parent

    // Mark original as Superseded and move to obsolete folder
    doc.Status = "Superseded";
    doc.Folder = "obsolete";
    doc.Updated = now;

    // Fresh Draft workflow — revision creator is owner and default issuer;
    // peer review / approval slots are cleared so the new owner routes them on submit.
    var freshWorkflow = JsonSerializer.Serialize(new object[]
    {
        new { step = "Draft",           who = revisionOwner, date = "—", done = false, active = true,  rejected = false, comment = "" },
        new { step = "Peer review",     who = "—",           date = "—", done = false, active = false, rejected = false, comment = "" },
        new { step = "Approval",        who = "—",           date = "—", done = false, active = false, rejected = false, comment = "" },
        new { step = "Issue",           who = revisionOwner, date = "—", done = false, active = false, rejected = false, comment = "" },
        new { step = "Periodic review", who = "+24 mo",      date = "—", done = false, active = false, rejected = false, comment = "" },
    });

    var newDoc = new Document
    {
        DocId          = newDocId,
        Title          = doc.Title,
        Version        = newVersion,
        Status         = "Draft",
        Folder         = originalFolder,
        Owner          = revisionOwner,
        Clauses        = doc.Clauses,
        ReviewDue      = doc.ReviewDue,
        Updated        = now,
        FileType       = "html",
        FileName       = newStoredFile != null ? newStoredFile : null,
        StoredFileName = newStoredFile,
        Workflow       = freshWorkflow,
        ContentText    = doc.ContentText,
        RevisionOf     = rootId,
    };
    db.Documents.Add(newDoc);
    db.Activity.Add(MakeActivity(ActorName(principal), "created revision", $"{newDocId} from {id}", "revision", "documents", $"New revision {newDocId} (v{newVersion}) created from {id}."));
    await db.SaveChangesAsync();
    return Results.Ok(ToDto(newDoc));
}).RequireAuthorization();

app.MapDelete("/api/documents/{id}/revision", async (string id, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    if (doc.Status != "Draft") return Results.BadRequest("Only Draft revisions can be cancelled.");
    if (doc.RevisionOf == null) return Results.BadRequest("This document is not a revision.");

    // Restore the parent: it was moved to Superseded/obsolete when the revision was created
    var parent = await db.Documents.FirstOrDefaultAsync(d => d.DocId == doc.RevisionOf);
    if (parent != null && parent.Status == "Superseded")
    {
        parent.Status   = "Issued";
        parent.Folder   = doc.Folder;  // revision inherited the original folder
        parent.Updated  = DateTime.Now.ToString("dd MMM yyyy");
    }

    // Delete the copied HTML file
    if (!string.IsNullOrEmpty(doc.StoredFileName))
    {
        var fp = Path.Combine(dataDir, doc.StoredFileName);
        if (File.Exists(fp)) File.Delete(fp);
    }

    var parentId = doc.RevisionOf;
    db.Documents.Remove(doc);
    db.Activity.Add(MakeActivity(ActorName(principal), "cancelled revision", doc.DocId, "delete", "documents",
        $"Draft revision {doc.DocId} cancelled. {parentId} restored to Issued."));
    await db.SaveChangesAsync();
    return Results.Ok(new { restoredId = parentId });
}).RequireAuthorization();

app.MapGet("/api/documents/{id}/revisions", async (string id, NexusDbContext db) =>
{
    var doc = await db.Documents.FirstOrDefaultAsync(d => d.DocId == id);
    if (doc == null) return Results.NotFound();
    var rootId = doc.RevisionOf ?? doc.DocId;
    var family = await db.Documents
        .Where(d => d.DocId == rootId || d.RevisionOf == rootId)
        .ToListAsync();
    return Results.Ok(family.Select(ToDto).OrderBy(d => d.Version));
}).RequireAuthorization();

// ── Rooms ─────────────────────────────────────────────────────────────────────

app.MapGet("/api/rooms", async (string? siteId, NexusDbContext db) =>
{
    var q = db.Rooms.AsQueryable();
    if (!string.IsNullOrEmpty(siteId)) q = q.Where(r => r.SiteId == siteId);
    return await q.OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToListAsync();
}).RequireAuthorization();

app.MapPost("/api/rooms", async (SiteRoomDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var maxOrder = await db.Rooms.Where(r => r.SiteId == dto.SiteId).MaxAsync(r => (int?)r.SortOrder) ?? 0;
    var room = new SiteRoom { SiteId = dto.SiteId, RoomId = Guid.NewGuid().ToString()[..8], Name = dto.Name, Type = dto.Type, SortOrder = maxOrder + 1 };
    db.Rooms.Add(room);
    await db.SaveChangesAsync();
    return Results.Ok(room);
}).RequireAuthorization();

app.MapPut("/api/rooms/{id:int}", async (int id, SiteRoomDto dto, NexusDbContext db) =>
{
    var room = await db.Rooms.FindAsync(id);
    if (room == null) return Results.NotFound();
    room.Name = dto.Name; room.Type = dto.Type;
    await db.SaveChangesAsync();
    return Results.Ok(room);
}).RequireAuthorization();

app.MapDelete("/api/rooms/{id:int}", async (int id, NexusDbContext db) =>
{
    var room = await db.Rooms.FindAsync(id);
    if (room == null) return Results.NotFound();
    db.Rooms.Remove(room);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// ── Inter-Scorer Reliability (ISR) ────────────────────────────────────────────

app.MapGet("/api/isr", async (string? quarter, NexusDbContext db) =>
{
    var q = db.IsrAssessments.AsQueryable();
    if (!string.IsNullOrEmpty(quarter)) q = q.Where(a => a.Quarter == quarter);
    return await q.OrderByDescending(a => a.CreatedAt).ToListAsync();
}).RequireAuthorization();

app.MapGet("/api/isr/{id:int}", async (int id, NexusDbContext db) =>
    await db.IsrAssessments.FindAsync(id) is { } a ? Results.Ok(a) : Results.NotFound()
).RequireAuthorization();

app.MapPost("/api/isr", async (IsrDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var now = DateTime.Now;
    var seq = await db.IsrAssessments.CountAsync(a => a.Quarter == dto.Quarter) + 1;
    var a = new NexusApi.Models.IsrAssessment
    {
        AssessmentRef      = $"ISR-{dto.Quarter.Replace(" ", "-")}-{seq:D3}",
        Quarter            = dto.Quarter,
        Scorer             = dto.Scorer ?? "",
        Reviewer           = dto.Reviewer ?? "",
        ReviewerRole       = dto.ReviewerRole ?? "Network Director",
        StudyIds           = dto.StudyIds ?? "[]",
        Results            = dto.Results ?? "{{}}",
        Thresholds         = dto.Thresholds ?? "{{}}",
        Status             = "pending",
        CreatedAt          = now.ToString("yyyy-MM-ddTHH:mm"),
    };
    db.IsrAssessments.Add(a);
    await db.SaveChangesAsync();
    return Results.Ok(a);
}).RequireAuthorization();

app.MapPut("/api/isr/{id:int}", async (int id, IsrDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var a = await db.IsrAssessments.FindAsync(id);
    if (a == null) return Results.NotFound();
    if (dto.Scorer      != null) a.Scorer      = dto.Scorer;
    if (dto.Reviewer    != null) a.Reviewer    = dto.Reviewer;
    if (dto.ReviewerRole!= null) a.ReviewerRole= dto.ReviewerRole;
    if (dto.StudyIds    != null) a.StudyIds    = dto.StudyIds;
    if (dto.Results     != null) a.Results     = dto.Results;
    if (dto.Thresholds  != null) a.Thresholds  = dto.Thresholds;
    if (dto.Notes       != null) a.Notes       = dto.Notes;
    if (dto.Status      != null) a.Status      = dto.Status;
    if (dto.AttestationBy   != null) a.AttestationBy   = dto.AttestationBy;
    if (dto.AttestationDate != null) a.AttestationDate = dto.AttestationDate;
    await db.SaveChangesAsync();
    return Results.Ok(a);
}).RequireAuthorization();

app.MapPost("/api/isr/{id:int}/sign", async (int id, IsrSignDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var a = await db.IsrAssessments.FindAsync(id);
    if (a == null) return Results.NotFound();
    var name = principal.FindFirstValue("name") ?? "Unknown";
    a.SignedBy = name;
    a.SignedAt = DateTime.Now.ToString("yyyy-MM-ddTHH:mm");
    a.Status   = "signed";
    if (!string.IsNullOrEmpty(dto.AttestationBy))   a.AttestationBy   = dto.AttestationBy;
    if (!string.IsNullOrEmpty(dto.AttestationDate)) a.AttestationDate = dto.AttestationDate;
    a.Notes = dto.Notes ?? a.Notes;
    db.Activity.Add(MakeActivity(
        name,
        "signed ISR assessment",
        $"{a.AssessmentRef} — {a.Quarter}",
        "sign",
        "isr"
    ));
    await db.SaveChangesAsync();
    return Results.Ok(a);
}).RequireAuthorization();

// ── Prodigi PSG integration (placeholder) ─────────────────────────────────────
// TODO: Replace placeholder responses with actual Prodigi API calls.
// Prodigi ISR integration would:
//   1. POST a study + scorer/reviewer credentials to launch an ISR scoring session
//   2. Prodigi returns a launch URL (iframe or redirect) and session token
//   3. After scoring, GET results using the session token

app.MapGet("/api/isr/prodigi/studies", async (string? q, IConfiguration config) =>
{
    // TODO: Call Prodigi API to list available PSG studies
    // var prodigiBase = config["Prodigi:BaseUrl"] ?? "https://prodigi.example.com";
    // var response = await httpClient.GetAsync($"{prodigiBase}/api/studies?search={q}");
    var sampleStudies = new[]
    {
        new { studyId = "PSG-2026-0440", patientInitials = "T.N.", date = "2026-05-01", type = "Adult PSG",    site = "RML", durationHours = 7.5 },
        new { studyId = "PSG-2026-0439", patientInitials = "L.W.", date = "2026-04-28", type = "Paed PSG",     site = "EPL", durationHours = 8.2 },
        new { studyId = "PSG-2026-0438", patientInitials = "D.M.", date = "2026-04-22", type = "Split-night",  site = "RML", durationHours = 7.0 },
        new { studyId = "PSG-2026-0437", patientInitials = "A.P.", date = "2026-04-15", type = "Adult PSG",    site = "EPL", durationHours = 7.8 },
        new { studyId = "PSG-2026-0436", patientInitials = "R.K.", date = "2026-04-10", type = "Adult PSG",    site = "RML", durationHours = 6.9 },
        new { studyId = "PSG-2026-0435", patientInitials = "P.B.", date = "2026-04-05", type = "Adult PSG",    site = "RML", durationHours = 7.3 },
    };
    var filtered = string.IsNullOrEmpty(q)
        ? sampleStudies
        : sampleStudies.Where(s => s.studyId.Contains(q, StringComparison.OrdinalIgnoreCase)
                                || s.patientInitials.Contains(q, StringComparison.OrdinalIgnoreCase));
    return Results.Ok(new { source = "placeholder", studies = filtered });
});

app.MapPost("/api/isr/prodigi/launch", async (ProdigiLaunchDto dto, IConfiguration config) =>
{
    // TODO: POST to Prodigi to launch ISR scoring session
    // var payload = new { studyId = dto.StudyId, scorerId = dto.ScorerId, reviewerId = dto.ReviewerId, mode = "isr" };
    // var response = await httpClient.PostAsJsonAsync($"{prodigiBase}/api/isr/launch", payload);
    return Results.Ok(new {
        source      = "placeholder",
        studyId     = dto.StudyId,
        launchUrl   = $"https://prodigi.compumedics.com/isr?study={dto.StudyId}&scorer={dto.ScorerId}&token=PLACEHOLDER_TOKEN",
        sessionToken= $"placeholder_token_{dto.StudyId}_{DateTime.Now.Ticks}",
        message     = "Replace with actual Prodigi ISR launch endpoint. Scorer will score 200 consecutive epochs in Prodigi; results will be available via /prodigi/results.",
        epochCount  = 200,
        epochLengthSec = 30,
    });
});

app.MapGet("/api/isr/prodigi/results/{studyId}", async (string studyId, string? scorerId, IConfiguration config) =>
{
    // TODO: GET results from Prodigi after scoring is complete
    // var response = await httpClient.GetAsync($"{prodigiBase}/api/isr/results?study={studyId}&scorer={scorerId}");
    var rng = new Random(studyId.GetHashCode() + (scorerId ?? "").GetHashCode());
    double Pct(double min, double max) => Math.Round(min + rng.NextDouble() * (max - min), 1);
    return Results.Ok(new {
        source        = "placeholder",
        studyId,
        scorerId,
        status        = "complete",
        totalEpochs   = 200,
        message       = "Replace with actual Prodigi results endpoint. These are simulated values.",
        concordance   = new {
            staging          = new { value = Pct(86, 98), label = "Sleep staging"          },
            obstructiveApnea = new { value = Pct(80, 97), label = "Obstructive apnea"      },
            centralApnea     = new { value = Pct(78, 96), label = "Central apnea"          },
            hypopnea         = new { value = Pct(75, 95), label = "Hypopnea"               },
            legMovements     = new { value = Pct(82, 97), label = "Leg movements"          },
            arousals         = new { value = Pct(80, 96), label = "Arousals"               },
            rera             = new { value = Pct(72, 92), label = "RERA"                   },
        },
    });
});

// ── Form records ──────────────────────────────────────────────────────────────

app.MapGet("/api/form-records", async (string? formId, NexusDbContext db) =>
{
    var q = db.FormRecords.AsQueryable();
    if (!string.IsNullOrEmpty(formId)) q = q.Where(r => r.FormId == formId);
    return await q.OrderByDescending(r => r.CompletedAt).Select(r => new {
        r.Id, r.FormId, r.RecordRef, r.FormTitle,
        r.CompletedBy, r.CompletedAt, r.Period, r.Notes,
    }).ToListAsync();
}).RequireAuthorization();

app.MapGet("/api/form-records/{id:int}", async (int id, NexusDbContext db) =>
    await db.FormRecords.FindAsync(id) is { } r ? Results.Ok(r) : Results.NotFound()
).RequireAuthorization();

app.MapPost("/api/form-records", async (FormRecordDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var name = principal.FindFirstValue("name") ?? "Unknown";
    var now  = DateTime.Now;
    var seq  = (await db.FormRecords.CountAsync(r => r.FormId == dto.FormId)) + 1;
    var rec  = new NexusApi.Models.FormRecord
    {
        FormId      = dto.FormId,
        RecordRef   = $"REC-{dto.FormId}-{now.Year}-{seq:D3}",
        FormTitle   = dto.FormTitle ?? "",
        CompletedBy = name,
        CompletedAt = now.ToString("yyyy-MM-ddTHH:mm"),
        Period      = dto.Period ?? now.ToString("MMM yyyy"),
        Notes       = dto.Notes ?? "",
        FormData    = dto.FormData ?? "{}",
        SnapshotHtml = dto.SnapshotHtml ?? "",
    };
    db.FormRecords.Add(rec);

    // Save snapshot as a viewable Document in the records folder
    bool docCreated = false;
    if (!string.IsNullOrWhiteSpace(rec.SnapshotHtml))
    {
        try
        {
            var recordFileName = rec.RecordRef + ".html";
            var recordFilePath = Path.Combine(dataDir, recordFileName);

            // Read-only style + value-restore script appended to snapshot
            var restore =
                "<style>input.fi,select.fi,textarea.fi{pointer-events:none!important;opacity:.9!important;" +
                "background:#f5f5f5!important;border-color:#ccc!important;cursor:default!important}</style>" +
                "<script>document.addEventListener('DOMContentLoaded',function(){" +
                "document.querySelectorAll('[data-snap-value]').forEach(function(el){el.value=el.getAttribute('data-snap-value');});" +
                "document.querySelectorAll('[data-snap-checked]').forEach(function(el){el.checked=el.getAttribute('data-snap-checked')==='1';});" +
                "});</script>";
            var fileHtml = rec.SnapshotHtml.Contains("</body>", StringComparison.OrdinalIgnoreCase)
                ? rec.SnapshotHtml.Replace("</body>", restore + "</body>", StringComparison.OrdinalIgnoreCase)
                : rec.SnapshotHtml + restore;
            await File.WriteAllTextAsync(recordFilePath, fileHtml);

            var sourceForm = await db.Documents.FirstOrDefaultAsync(d => d.DocId == dto.FormId);
            var contentText = "";
            try { contentText = ExtractTextFromHtml(fileHtml); } catch { }
            db.Documents.Add(new Document
            {
                DocId          = rec.RecordRef,
                Title          = $"{rec.FormTitle} — {rec.Period}",
                Version        = "1.0",
                Status         = "Issued",
                Folder         = "records",
                Owner          = name,
                Clauses        = sourceForm?.Clauses ?? "",
                ReviewDue      = "—",
                Updated        = now.ToString("dd MMM yyyy"),
                FileType       = "html",
                FileName       = recordFileName,
                StoredFileName = recordFileName,
                ContentText    = contentText,
                Workflow       = "[]",
            });
            docCreated = true;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[form-records] Failed to create record document: {ex.Message}");
        }
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { rec.Id, rec.RecordRef, rec.CompletedAt, DocCreated = docCreated });
}).RequireAuthorization();

app.MapGet("/api/form-records/{id:int}/html", async (int id, NexusDbContext db) =>
{
    var r = await db.FormRecords.FindAsync(id);
    if (r == null) return Results.NotFound();
    return Results.Content(r.SnapshotHtml, "text/html; charset=utf-8");
}).RequireAuthorization();

// ── Workbooks ─────────────────────────────────────────────────────────────────

app.MapGet("/api/workbooks", async (NexusDbContext db) =>
    await db.WorkbookSchedules.OrderBy(w => w.Id).ToListAsync()
).RequireAuthorization();

app.MapPut("/api/workbooks/{workbookId}", async (string workbookId, WorkbookUpdateDto dto, NexusDbContext db) =>
{
    var w = await db.WorkbookSchedules.FirstOrDefaultAsync(x => x.WorkbookId == workbookId);
    if (w == null) return Results.NotFound();
    if (dto.Frequency != null) w.Frequency = dto.Frequency;
    if (dto.AssignedTo != null) w.AssignedTo = dto.AssignedTo;
    // Recalculate next due based on new frequency if never completed
    if (string.IsNullOrEmpty(w.LastCompleted) && dto.Frequency != null)
    {
        var months = dto.Frequency switch { "semi-annual" => 6, "annual" => 12, _ => 3 };
        w.NextDue = DateOnly.FromDateTime(DateTime.Today).AddMonths(months).ToString("yyyy-MM-dd");
    }
    await db.SaveChangesAsync();
    return Results.Ok(w);
}).RequireAuthorization();

app.MapPost("/api/workbooks/{workbookId}/complete", async (string workbookId, WorkbookCompleteDto dto, NexusDbContext db) =>
{
    var w = await db.WorkbookSchedules.FirstOrDefaultAsync(x => x.WorkbookId == workbookId);
    if (w == null) return Results.NotFound();
    var completed = dto.CompletedDate ?? DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd");
    w.LastCompleted = completed;
    if (dto.Notes != null) w.Notes = dto.Notes;
    var months = w.Frequency switch { "semi-annual" => 6, "annual" => 12, _ => 3 };
    w.NextDue = DateOnly.Parse(completed).AddMonths(months).ToString("yyyy-MM-dd");
    await db.SaveChangesAsync();
    return Results.Ok(w);
}).RequireAuthorization();

app.MapGet("/api/workbooks/{workbookId}/completions", async (string workbookId, NexusDbContext db) =>
    await db.WorkbookCompletions
        .Where(c => c.WorkbookId == workbookId)
        .OrderByDescending(c => c.StartedAt)
        .ToListAsync()
).RequireAuthorization();

app.MapPost("/api/workbooks/{workbookId}/completions", async (string workbookId, WorkbookCompletionDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var name = principal.FindFirstValue("name") ?? "Unknown";
    var now  = DateTime.Now.ToString("yyyy-MM-ddTHH:mm");
    var c    = new NexusApi.Models.WorkbookCompletion
    {
        WorkbookId  = workbookId,
        Period      = dto.Period,
        StartedAt   = now,
        CompletedAt = "",
        CompletedBy = name,
        FormData    = dto.FormData ?? "{}",
        Status      = "in-progress",
    };
    db.WorkbookCompletions.Add(c);
    await db.SaveChangesAsync();
    return Results.Ok(c);
}).RequireAuthorization();

app.MapPut("/api/workbooks/{workbookId}/completions/{id:int}", async (string workbookId, int id, WorkbookCompletionDto dto, NexusDbContext db) =>
{
    var c = await db.WorkbookCompletions.FindAsync(id);
    if (c == null || c.WorkbookId != workbookId) return Results.NotFound();
    if (dto.FormData != null) c.FormData = dto.FormData;
    if (dto.Status != null)
    {
        c.Status = dto.Status;
        if (dto.Status == "complete") c.CompletedAt = DateTime.Now.ToString("yyyy-MM-ddTHH:mm");
    }
    await db.SaveChangesAsync();
    return Results.Ok(c);
}).RequireAuthorization();

app.MapGet("/api/workbooks/{workbookId}/file", async (string workbookId, NexusDbContext db, IWebHostEnvironment env, HttpContext ctx) =>
{
    var w = await db.WorkbookSchedules.FirstOrDefaultAsync(x => x.WorkbookId == workbookId);
    if (w == null) return Results.NotFound();
    var dataDir = Path.GetFullPath(Path.Combine(env.ContentRootPath, "data"));
    var path = Path.Combine(dataDir, "workbooks", w.FileName);
    if (!File.Exists(path)) return Results.NotFound();
    ctx.Response.Headers["Content-Disposition"] = $"inline; filename=\"{w.FileName}\"";
    var bytes = await File.ReadAllBytesAsync(path);
    return Results.File(bytes, "application/pdf");
}); // public — AASM published documents

// Standards reference PDFs (public — published accreditation standards)
app.MapGet("/api/standards/{standardId}", async (string standardId, IWebHostEnvironment env, HttpContext ctx) =>
{
    var dir = Path.Combine(env.ContentRootPath, "data", "standards");
    var candidates = Directory.Exists(dir) ? Directory.GetFiles(dir, "*.pdf") : Array.Empty<string>();
    var match = standardId.ToLower() switch {
        "aasm" => candidates.FirstOrDefault(f => Path.GetFileName(f).StartsWith("Standards-for-Accreditation", StringComparison.OrdinalIgnoreCase)),
        "asa"  => candidates.FirstOrDefault(f => Path.GetFileName(f).Contains("ASA", StringComparison.OrdinalIgnoreCase) || Path.GetFileName(f).Contains("Sleep-Disorders", StringComparison.OrdinalIgnoreCase)),
        _ => null
    };
    if (match == null) return Results.NotFound();
    ctx.Response.Headers["Content-Disposition"] = $"inline; filename=\"{Path.GetFileName(match)}\"";
    var bytes = await File.ReadAllBytesAsync(match);
    return Results.File(bytes, "application/pdf");
});

// ── Appointments ──────────────────────────────────────────────────────────────

app.MapGet("/api/appointments", async (string? siteId, string? from, string? to, NexusDbContext db) =>
{
    var q = db.Appointments.AsQueryable();
    if (!string.IsNullOrEmpty(siteId) && siteId != "all") q = q.Where(a => a.SiteId == siteId);
    if (!string.IsNullOrEmpty(from)) q = q.Where(a => string.Compare(a.Start, from, StringComparison.Ordinal) >= 0);
    if (!string.IsNullOrEmpty(to))   q = q.Where(a => string.Compare(a.Start, to,   StringComparison.Ordinal) <= 0);
    return await q.OrderBy(a => a.Start).ToListAsync();
}).RequireAuthorization();

app.MapPost("/api/appointments", async (AppointmentDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var appt = new Appointment {
        SiteId = dto.SiteId, Type = dto.Type, PatientName = dto.PatientName,
        PatientId = dto.PatientId ?? "",
        Start = dto.Start, End = dto.End, RoomId = dto.RoomId ?? "",
        EquipmentId = dto.EquipmentId ?? "", Physician = dto.Physician ?? "",
        Technician = dto.Technician ?? "", Notes = dto.Notes ?? "",
        Status = dto.Status ?? "scheduled",
        CreatedBy = ActorName(principal), CreatedAt = DateTime.Now.ToString("yyyy-MM-ddTHH:mm"),
    };
    db.Appointments.Add(appt);
    db.Activity.Add(MakeActivity(ActorName(principal), "scheduled appointment", $"{dto.Type.ToUpper()} — {dto.PatientName} at {dto.Start[..10]}", "create", "scheduler"));
    await db.SaveChangesAsync();
    return Results.Ok(appt);
}).RequireAuthorization();

app.MapPut("/api/appointments/{id:int}", async (int id, AppointmentDto dto, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var appt = await db.Appointments.FindAsync(id);
    if (appt == null) return Results.NotFound();
    appt.SiteId = dto.SiteId; appt.Type = dto.Type; appt.PatientName = dto.PatientName;
    appt.PatientId = dto.PatientId ?? "";
    appt.Start = dto.Start; appt.End = dto.End; appt.RoomId = dto.RoomId ?? "";
    appt.EquipmentId = dto.EquipmentId ?? ""; appt.Physician = dto.Physician ?? "";
    appt.Technician = dto.Technician ?? ""; appt.Notes = dto.Notes ?? "";
    appt.Status = dto.Status ?? appt.Status;
    db.Activity.Add(MakeActivity(ActorName(principal), "updated appointment", $"{dto.Type.ToUpper()} — {dto.PatientName} at {dto.Start[..10]}", "edit", "scheduler"));
    await db.SaveChangesAsync();
    return Results.Ok(appt);
}).RequireAuthorization();

app.MapDelete("/api/appointments/{id:int}", async (int id, NexusDbContext db, ClaimsPrincipal principal) =>
{
    var appt = await db.Appointments.FindAsync(id);
    if (appt == null) return Results.NotFound();
    db.Activity.Add(MakeActivity(ActorName(principal), "cancelled appointment", $"{appt.Type.ToUpper()} — {appt.PatientName} at {appt.Start[..10]}", "edit", "scheduler"));
    db.Appointments.Remove(appt);
    await db.SaveChangesAsync();
    return Results.NoContent();
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

string BuildDocScript(Document doc)
{
    JsonElement[]? steps = null;
    try { steps = JsonSerializer.Deserialize<JsonElement[]>(doc.Workflow ?? "[]"); } catch { }

    string Str(int i, string key) =>
        steps != null && i < steps.Length && steps[i].TryGetProperty(key, out var v) ? (v.GetString() ?? "—") : "—";
    bool Done(int i) =>
        steps != null && i < steps.Length && steps[i].TryGetProperty("done", out var v) && v.GetBoolean();

    var effectiveDate = Done(3) ? Str(3, "date") : Done(2) ? Str(2, "date") : doc.Updated ?? "—";
    var authorisedBy  = Done(2) ? Str(2, "who") : "—";
    var isForm = doc.DocId?.StartsWith("FRM") == true;

    var meta = new {
        idLabel      = isForm ? "Form ID" : "Document ID",
        docId        = doc.DocId        ?? "—",
        version      = doc.Version      ?? "—",
        effectiveDate,
        reviewDue    = doc.ReviewDue    ?? "—",
        authorisedBy,
        clauses      = doc.Clauses      ?? ""
    };

    var sfCells = steps?.Length > 0 ? new[]
    {
        new { label = "Prepared by",   who = Done(0) ? Str(0, "who") : "—", date = Done(0) ? Str(0, "date") : "—", comment = Done(0) ? Str(0, "comment") : "" },
        new { label = "Reviewed by",   who = Done(1) ? Str(1, "who") : "—", date = Done(1) ? Str(1, "date") : "—", comment = Done(1) ? Str(1, "comment") : "" },
        new { label = "Authorised by", who = Done(2) ? Str(2, "who") : "—", date = Done(2) ? Str(2, "date") : "—", comment = Done(2) ? Str(2, "comment") : "" },
    } : null;

    var metaJson = JsonSerializer.Serialize(meta);
    var sfJson   = sfCells != null ? JsonSerializer.Serialize(sfCells) : "null";

    // Script runs immediately (not at DOMContentLoaded) because it is injected at end of </body>
    // so the DOM is already fully built when this script executes.
    var sb = new System.Text.StringBuilder();
    sb.Append("<script>\n(function(){");
    sb.Append("var m=").Append(metaJson).Append(';');
    sb.Append("var sf=").Append(sfJson).Append(';');

    // Lock header against user editing before FILL_SCRIPT runs
    sb.Append("var _s=document.createElement('style');");
    sb.Append("_s.textContent='.doc-header{pointer-events:none!important;user-select:none!important}';");
    sb.Append("if(document.head)document.head.appendChild(_s);");

    // Header metadata — runs immediately
    sb.Append("var hdr=document.querySelector('.doc-header');");
    sb.Append("if(hdr){");
    sb.Append("hdr.querySelectorAll('.field').forEach(function(f){f.remove();});");
    sb.Append("var fi=[{l:m.idLabel,v:m.docId},{l:'Revision',v:m.version},{l:'Effective date',v:m.effectiveDate},{l:'Review date',v:m.reviewDue},{l:'Authorised by',v:m.authorisedBy}];");
    sb.Append("if(m.clauses&&m.clauses.length>0)fi.push({l:'Linked clauses',v:m.clauses});");
    sb.Append("fi.forEach(function(f){var d=document.createElement('div');d.className='field';d.innerHTML='<strong>'+f.l+':</strong> '+f.v;hdr.appendChild(d);});");
    sb.Append("}");

    // Signoff — runs immediately
    sb.Append("if(sf){var so=document.querySelector('.signoff');if(so){");
    sb.Append("so.innerHTML=sf.map(function(s){");
    sb.Append("var h='<div class=\"sign-cell\"><strong>'+s.label+'</strong><br>Name: '+s.who+'<br>Date: '+s.date;");
    sb.Append("if(s.comment&&s.comment.length>0)h+='<br><em style=\"font-size:9pt;color:var(--ink-3)\">\"'+s.comment+'\"</em>';");
    sb.Append("return h+'</div>';");
    sb.Append("}).join('');}}");

    sb.Append("})();\n</script>");
    return sb.ToString();
}

string ExtractTextFromHtml(string html) => SeedData.StripHtml(html);

string GetSnippet(string text, string query, int snippetLen = 220)
{
    var idx = text.IndexOf(query, StringComparison.OrdinalIgnoreCase);
    if (idx < 0) return text.Length > snippetLen ? text[..snippetLen] + "…" : text;
    var start = Math.Max(0, idx - 60);
    var end   = Math.Min(text.Length, idx + query.Length + 160);
    return (start > 0 ? "…" : "") + text[start..end] + (end < text.Length ? "…" : "");
}

string Initials(string name)
{
    var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    return string.Concat(parts.Take(2).Select(w => char.ToUpper(w[0])));
}

string ActorName(ClaimsPrincipal p) =>
    p.FindFirstValue("name") ?? p.FindFirstValue(ClaimTypes.Name) ?? "Unknown";

string ActorRole(ClaimsPrincipal p) =>
    p.FindFirstValue("role") ?? "";

ActivityEntry MakeActivity(string who, string action, string target, string kind, string module, string detail = "")
{
    var now = DateTime.Now;
    return new ActivityEntry {
        Who    = who,
        Action = action,
        Target = target,
        Kind   = kind,
        Module = module,
        Detail = detail,
        Ts     = now.ToString("yyyy-MM-ddTHH:mm"),
        Time   = now.ToString("dd MMM yyyy, HH:mm"),
    };
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

record LoginDto(string Email, string Password);
record StudyStatusDto(string Status, int? SignedDays);
record ClauseUpdateDto(string? Status, int? Evidence, string? Owner, string? LastReviewed);

record DocumentDto(
    string DocId, string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string? FileType, string? FileName, bool HasFile, string Workflow, string? RevisionOf);

record DocumentUpdateDto(
    string Title, string Version, string Status, string Folder,
    string Owner, string Clauses, string ReviewDue, string Updated,
    string Workflow);

record SiteRoomDto(string SiteId, string Name, string Type);

record AppointmentDto(
    string SiteId, string Type, string PatientName, string? PatientId,
    string Start, string End,
    string? RoomId, string? EquipmentId,
    string? Physician, string? Technician,
    string? Notes, string? Status);

record StandardSwitchDto(string Value);
record FormRecordDto(string FormId, string? FormTitle, string? Period, string? Notes, string? FormData, string? SnapshotHtml);
record IsrDto(string Quarter, string? Scorer, string? Reviewer, string? ReviewerRole,
    string? StudyIds, string? Results, string? Thresholds, string? Notes, string? Status,
    string? AttestationBy, string? AttestationDate);
record IsrSignDto(string? AttestationBy, string? AttestationDate, string? Notes);
record ProdigiLaunchDto(string StudyId, string ScorerId, string? ReviewerId);
record WorkbookUpdateDto(string? Frequency, string? AssignedTo);
record WorkbookCompleteDto(string? CompletedDate, string? Notes);
record WorkbookCompletionDto(string Period, string? FormData, string? Status);
