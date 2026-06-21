using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NexusApi.Data;

namespace NexusApi.Tests;

/// <summary>
/// Boots the real API (entire Program.cs, including its startup seeding) but
/// swaps the SQLite connection to a throwaway temp file so tests never touch
/// the dev `nexus.db`. The fresh file is created and seeded on first request.
/// </summary>
public class NexusApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath =
        Path.Combine(Path.GetTempPath(), $"nexus-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove every DB-related registration the app added (the context,
            // its options, and EF Core's options-configuration callbacks) so our
            // temp-file connection string is the only one that applies.
            var toRemove = services.Where(d =>
                d.ServiceType == typeof(NexusDbContext) ||
                d.ServiceType == typeof(DbContextOptions) ||
                (d.ServiceType.IsGenericType &&
                 d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>)) ||
                (d.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration") ?? false)
            ).ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<NexusDbContext>(o => o.UseSqlite($"Data Source={_dbPath}"));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing) return;
        try
        {
            SqliteConnection.ClearAllPools(); // release the file handle
            if (File.Exists(_dbPath)) File.Delete(_dbPath);
        }
        catch
        {
            // Temp file — fine to leave behind if the OS still holds it.
        }
    }
}
