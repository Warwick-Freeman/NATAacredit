using Microsoft.EntityFrameworkCore;
using NexusApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NexusDbContext>(opt =>
    opt.UseSqlite("Data Source=nexus.db"));

builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173", "http://localhost:4173")
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NexusDbContext>();
    db.Database.EnsureCreated();
    SeedData.Seed(db);
}

app.UseCors();

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

app.Run();
