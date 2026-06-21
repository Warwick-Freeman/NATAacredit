using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

[Collection("backend")]
public class TasksTests
{
    private readonly NexusApiFactory _factory;
    public TasksTests(NexusApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_tasks_returns_an_array()
    {
        var client = await _factory.AuthedClientAsync();
        var list = await client.GetFromJsonAsync<JsonElement>("/api/tasks");
        Assert.Equal(JsonValueKind.Array, list.ValueKind);
    }

    [Fact]
    public async Task Create_task_returns_it_and_it_appears_in_the_list()
    {
        var client = await _factory.AuthedClientAsync();

        var createResp = await client.PostAsJsonAsync("/api/tasks", new
        {
            title = "Calibrate the Grael amplifier",
            clause = "5.4.2",
            due = "in 3 days",
            priority = "critical",
            assignedTo = "M. Chen",
        });
        Assert.Equal(HttpStatusCode.OK, createResp.StatusCode);

        var created = await createResp.ReadJsonAsync();
        Assert.Equal("Calibrate the Grael amplifier", created.GetProperty("title").GetString());
        Assert.Equal("critical", created.GetProperty("priority").GetString());
        var taskId = created.GetProperty("taskId").GetString();
        Assert.StartsWith("T-", taskId);

        var list = await client.GetFromJsonAsync<JsonElement>("/api/tasks");
        Assert.Contains(list.EnumerateArray(),
            t => t.GetProperty("taskId").GetString() == taskId);
    }
}
