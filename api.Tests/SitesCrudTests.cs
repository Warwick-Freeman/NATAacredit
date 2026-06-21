using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

[Collection("backend")]
public class SitesCrudTests
{
    private readonly NexusApiFactory _factory;
    public SitesCrudTests(NexusApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_sites_returns_an_array()
    {
        var client = await _factory.AuthedClientAsync();
        var list = await client.GetFromJsonAsync<JsonElement>("/api/sites");
        Assert.Equal(JsonValueKind.Array, list.ValueKind);
    }

    [Fact]
    public async Task Create_update_then_delete_site_round_trips()
    {
        var client = await _factory.AuthedClientAsync();
        var code = $"ST-TEST-{Guid.NewGuid():N}".Substring(0, 12);

        // CREATE
        var createResp = await client.PostAsJsonAsync("/api/sites", new
        {
            siteCode = code,
            name = "Test Lab North",
            type = "Lab",
            beds = "4",
        });
        Assert.Equal(HttpStatusCode.OK, createResp.StatusCode);
        var created = await createResp.ReadJsonAsync();
        Assert.Equal("Test Lab North", created.GetProperty("name").GetString());

        // UPDATE
        var updateResp = await client.PutAsJsonAsync($"/api/sites/{code}", new
        {
            siteCode = code,
            name = "Test Lab North (renamed)",
            type = "Lab",
            beds = "6",
        });
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var updated = await updateResp.ReadJsonAsync();
        Assert.Equal("Test Lab North (renamed)", updated.GetProperty("name").GetString());
        Assert.Equal("6", updated.GetProperty("beds").GetString());

        // DELETE
        var deleteResp = await client.DeleteAsync($"/api/sites/{code}");
        Assert.Equal(HttpStatusCode.OK, deleteResp.StatusCode);

        // UPDATE after delete → 404
        var updateGone = await client.PutAsJsonAsync($"/api/sites/{code}", new
        {
            siteCode = code, name = "ghost", type = "Lab", beds = "0",
        });
        Assert.Equal(HttpStatusCode.NotFound, updateGone.StatusCode);
    }
}
