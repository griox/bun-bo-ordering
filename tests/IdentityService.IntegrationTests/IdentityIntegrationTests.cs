using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace IdentityService.IntegrationTests;

public class IdentityIntegrationTests : IClassFixture<IdentityServiceFactory>
{
    private readonly HttpClient _client;
    private readonly IdentityServiceFactory _factory;

    public IdentityIntegrationTests(IdentityServiceFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterAndLogin_ShouldSucceed()
    {
        // 1. Register
        var registerCmd = new RegisterCommand("testuser", "test@example.com", "Password123!");
        var registerResponse = await _client.PostAsJsonAsync("/api/identity/register", registerCmd);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 2. Login
        var loginCmd = new LoginCommand("testuser", "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/identity/login", loginCmd);
        
        if (loginResponse.StatusCode != HttpStatusCode.OK)
        {
            var error = await loginResponse.Content.ReadAsStringAsync();
            throw new Exception($"Login failed with {loginResponse.StatusCode}. Body: {error}");
        }

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<LoginResult>();
        loginResult.Should().NotBeNull();
        loginResult!.token.Should().NotBeNullOrEmpty();
        loginResult.refreshToken.Should().NotBeNullOrEmpty();
        loginResult.username.Should().Be("testuser");

        // 3. Refresh Token
        var refreshCmd = new RefreshTokenCommand(loginResult.token, loginResult.refreshToken);
        var refreshResponse = await _client.PostAsJsonAsync("/api/identity/refresh-token", refreshCmd);
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshResult = await refreshResponse.Content.ReadFromJsonAsync<LoginResult>();
        refreshResult.Should().NotBeNull();
        refreshResult!.token.Should().NotBeNullOrEmpty();
        refreshResult.refreshToken.Should().NotBe(loginResult.refreshToken); // Should be rotated
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldFail()
    {
        var loginCmd = new LoginCommand("testuser", "WrongPassword!");
        var response = await _client.PostAsJsonAsync("/api/identity/login", loginCmd);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_DuplicateUser_ShouldFail()
    {
        var cmd = new RegisterCommand("existinguser", "existing@example.com", "Password123!");
        await _client.PostAsJsonAsync("/api/identity/register", cmd);
        
        var response = await _client.PostAsJsonAsync("/api/identity/register", cmd);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ShouldFail()
    {
        var cmd = new RefreshTokenCommand("fake-at", "invalid-rt");
        var response = await _client.PostAsJsonAsync("/api/identity/refresh-token", cmd);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
