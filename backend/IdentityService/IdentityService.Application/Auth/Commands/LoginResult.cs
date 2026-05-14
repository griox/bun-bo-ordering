namespace IdentityService.Application.Auth.Commands;

public record LoginResult(string token, string refreshToken, string userId, string username, string email, string role);
