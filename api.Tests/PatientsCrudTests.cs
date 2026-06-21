using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

[Collection("backend")]
public class PatientsCrudTests
{
    private readonly NexusApiFactory _factory;
    public PatientsCrudTests(NexusApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_patients_returns_seeded_list()
    {
        var client = await _factory.AuthedClientAsync();
        var list = await client.GetFromJsonAsync<JsonElement>("/api/patients");
        Assert.Equal(JsonValueKind.Array, list.ValueKind);
        Assert.True(list.GetArrayLength() > 0, "expected seeded patients");
    }

    [Fact]
    public async Task Create_update_then_delete_patient_round_trips()
    {
        var client = await _factory.AuthedClientAsync();

        // CREATE
        var createResp = await client.PostAsJsonAsync("/api/patients", new
        {
            name = "Test Patient One",
            sex = "F",
            mrn = "MRN-TEST-001",
            status = "active",
        });
        Assert.Equal(HttpStatusCode.OK, createResp.StatusCode);
        var created = await createResp.ReadJsonAsync();
        var id = created.GetProperty("patientId").GetString();
        Assert.False(string.IsNullOrEmpty(id));
        // Initials are derived from the name when not supplied.
        Assert.Equal("TPO", created.GetProperty("initials").GetString());

        // READ — appears in the list
        var afterCreate = await client.GetFromJsonAsync<JsonElement>("/api/patients");
        Assert.Contains(afterCreate.EnumerateArray(),
            p => p.GetProperty("patientId").GetString() == id);

        // UPDATE
        var updateResp = await client.PutAsJsonAsync($"/api/patients/{id}", new
        {
            name = "Test Patient Renamed",
            status = "inactive",
        });
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var updated = await updateResp.ReadJsonAsync();
        Assert.Equal("Test Patient Renamed", updated.GetProperty("name").GetString());
        Assert.Equal("inactive", updated.GetProperty("status").GetString());

        // DELETE
        var deleteResp = await client.DeleteAsync($"/api/patients/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // DELETE again → 404 (gone)
        var deleteAgain = await client.DeleteAsync($"/api/patients/{id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteAgain.StatusCode);
    }

    [Fact]
    public async Task Update_missing_patient_is_404()
    {
        var client = await _factory.AuthedClientAsync();
        var resp = await client.PutAsJsonAsync("/api/patients/PAT-does-not-exist",
            new { name = "Nobody" });
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
