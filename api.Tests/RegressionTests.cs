using System.Net;
using System.Text.Json;
using Xunit;

namespace NexusApi.Tests;

/// <summary>
/// Guards against the two server-side 500s the UI smoke suite surfaced:
///   1. /api/appointments date-range filter used the StringComparison.Ordinal
///      overload of string.Compare, which EF Core can't translate to SQLite.
///   2. /api/isr threw on a stale schema missing the IsrAssessment.ActionPlanJson
///      column — these tests run against a freshly-created schema, so a recurrence
///      of either would show up as a 500 here.
/// </summary>
[Collection("backend")]
public class RegressionTests
{
    private readonly NexusApiFactory _factory;
    public RegressionTests(NexusApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/api/appointments")]
    [InlineData("/api/appointments?siteId=all")]
    [InlineData("/api/appointments?from=2026-06-15&to=2026-06-22")]
    [InlineData("/api/appointments?siteId=all&from=2026-06-15&to=2026-06-22")]
    public async Task Appointments_query_does_not_500(string url)
    {
        var client = await _factory.AuthedClientAsync();
        var resp = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.ReadJsonAsync();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
    }

    [Theory]
    [InlineData("/api/isr")]
    [InlineData("/api/isr?quarter=Q2%202026")]
    public async Task Isr_query_does_not_500(string url)
    {
        var client = await _factory.AuthedClientAsync();
        var resp = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.ReadJsonAsync();
        Assert.Equal(JsonValueKind.Array, body.ValueKind);
    }
}
