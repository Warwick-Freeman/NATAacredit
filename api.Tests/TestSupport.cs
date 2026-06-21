using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

/// <summary>
/// All backend test classes join this collection so they share ONE seeded
/// database and run sequentially — SQLite file locking makes parallel writers
/// flaky. Tests stay independent by creating uniquely-named records.
/// </summary>
[CollectionDefinition("backend")]
public class BackendCollection : ICollectionFixture<NexusApiFactory> { }

/// <summary>Seeded demo accounts (password "demo"). See SeedData.SeedUsers.</summary>
public static class Accounts
{
    public const string QualityManager = "kavya.patel@nexus360.com";   // not a physician
    public const string MedicalDirector = "rafael.okafor@nexus360.com"; // physician → may sign Final
    public const string Password = "demo";
}

public static class ClientExtensions
{
    /// <summary>Logs in via /api/auth/login and returns a client with the bearer token attached.</summary>
    public static async Task<HttpClient> AuthedClientAsync(
        this NexusApiFactory factory,
        string email = Accounts.QualityManager,
        string password = Accounts.Password)
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var token = body.GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage resp) =>
        await resp.Content.ReadFromJsonAsync<JsonElement>();
}
