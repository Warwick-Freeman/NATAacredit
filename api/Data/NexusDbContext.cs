using Microsoft.EntityFrameworkCore;
using NexusApi.Models;

namespace NexusApi.Data;

public class NexusDbContext(DbContextOptions<NexusDbContext> options) : DbContext(options)
{
    public DbSet<Study> Studies => Set<Study>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<Indicator> Indicators => Set<Indicator>();
    public DbSet<Clause> Clauses => Set<Clause>();
    public DbSet<ComplianceSection> ComplianceSections => Set<ComplianceSection>();
    public DbSet<NexusTask> Tasks => Set<NexusTask>();
    public DbSet<ActivityEntry> Activity => Set<ActivityEntry>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<SiteRoom> Rooms => Set<SiteRoom>();
    public DbSet<SiteConfig> SiteConfig => Set<SiteConfig>();
    public DbSet<FormRecord> FormRecords => Set<FormRecord>();
    public DbSet<WorkbookSchedule> WorkbookSchedules => Set<WorkbookSchedule>();
    public DbSet<WorkbookCompletion> WorkbookCompletions => Set<WorkbookCompletion>();
}
