using IdentityService.Application.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;

namespace IdentityService.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;

    public GoogleAuthService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<GoogleUserInfo?> GetUserInfoAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var data = JsonSerializer.Deserialize<JsonElement>(json);

        return new GoogleUserInfo(
            Sub: data.GetProperty("sub").GetString() ?? string.Empty,
            Email: data.GetProperty("email").GetString() ?? string.Empty,
            Name: data.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? string.Empty : string.Empty
        );
    }
}
