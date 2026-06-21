using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace NexusApi.Tests;

[Collection("backend")]
public class AuthTests
{
    private readonly NexusApiFactory _factory;
    public AuthTests(NexusApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Login_with_valid_demo_credentials_returns_token_and_user()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login",
            new { email = Accounts.QualityManager, password = Accounts.Password });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.ReadJsonAsync();
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("token").GetString()));
        Assert.Equal("Quality Manager", body.GetProperty("user").GetProperty("role").GetString());
    }

    [Fact]
    public async Task Login_with_wrong_password_is_unauthorized()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login",
            new { email = Accounts.QualityManager, password = "not-the-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_with_unknown_email_is_unauthorized()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "ghost@nexus360.com", password = Accounts.Password });
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Protected_endpoint_without_token_is_401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/studies");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Protected_endpoint_with_token_is_200()
    {
        var client = await _factory.AuthedClientAsync();
        var resp = await client.GetAsync("/api/studies");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
