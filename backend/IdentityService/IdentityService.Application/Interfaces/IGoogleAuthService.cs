namespace IdentityService.Application.Interfaces;

public record GoogleUserInfo(string Sub, string Email, string Name);

public interface IGoogleAuthService
{
    Task<GoogleUserInfo?> GetUserInfoAsync(string accessToken, CancellationToken cancellationToken = default);
}
