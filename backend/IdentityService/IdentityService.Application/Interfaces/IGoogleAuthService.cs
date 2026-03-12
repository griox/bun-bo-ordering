namespace IdentityService.Application.Interfaces;

public record GoogleUserInfo(string Sub, string Email);

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> GetUserInfoAsync(string accessToken, CancellationToken cancellationToken = default);
}
