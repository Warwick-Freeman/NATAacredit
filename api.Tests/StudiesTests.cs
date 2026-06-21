using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

[Collection("backend")]
public class StudiesTests
{
    private readonly NexusApiFactory _factory;
    public StudiesTests(NexusApiFactory factory) => _factory = factory;

    private static async Task<string> FirstStudyIdAsync(HttpClient client)
    {
        var studies = await client.GetFromJsonAsync<JsonElement>("/api/studies");
        return studies.EnumerateArray().First().GetProperty("studyId").GetString()!;
    }

    [Fact]
    public async Task Non_physician_can_set_a_non_final_status()
    {
        var client = await _factory.AuthedClientAsync(Accounts.QualityManager);
        var id = await FirstStudyIdAsync(client);

        var resp = await client.PatchAsJsonAsync($"/api/studies/{id}/status",
            new { status = "Preliminary", signedDays = (int?)null });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var updated = await resp.ReadJsonAsync();
        Assert.Equal("Preliminary", updated.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Non_physician_signing_Final_is_forbidden()
    {
        var client = await _factory.AuthedClientAsync(Accounts.QualityManager);
        var id = await FirstStudyIdAsync(client);

        var resp = await client.PatchAsJsonAsync($"/api/studies/{id}/status",
            new { status = "Final", signedDays = 7 });

        Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
    }

    [Fact]
    public async Task Physician_can_sign_Final()
    {
        var client = await _factory.AuthedClientAsync(Accounts.MedicalDirector);
        var id = await FirstStudyIdAsync(client);

        var resp = await client.PatchAsJsonAsync($"/api/studies/{id}/status",
            new { status = "Final", signedDays = 6 });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var updated = await resp.ReadJsonAsync();
        Assert.Equal("Final", updated.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Invalid_status_value_is_rejected()
    {
        var client = await _factory.AuthedClientAsync(Accounts.MedicalDirector);
        var id = await FirstStudyIdAsync(client);

        var resp = await client.PatchAsJsonAsync($"/api/studies/{id}/status",
            new { status = "Banana", signedDays = (int?)null });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Status_update_on_unknown_study_is_404()
    {
        var client = await _factory.AuthedClientAsync(Accounts.QualityManager);
        var resp = await client.PatchAsJsonAsync("/api/studies/STU-nope/status",
            new { status = "Preliminary", signedDays = (int?)null });

        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
