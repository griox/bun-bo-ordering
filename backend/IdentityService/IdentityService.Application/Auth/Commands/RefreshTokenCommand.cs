using BunBo.SharedKernel;
using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace IdentityService.Application.Auth.Commands;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<LoginResult>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IDistributedCache _cache;

    public RefreshTokenCommandHandler(IAppDbContext dbContext, ITokenService tokenService, IDistributedCache cache)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _cache = cache;
    }

    public async Task<LoginResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if this refresh token was recently rotated (within 30 seconds grace period)
        var cacheKey = $"used-refresh-token:{request.RefreshToken}";
        var cachedResultJson = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedResultJson))
        {
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var cachedResult = JsonSerializer.Deserialize<LoginResult>(cachedResultJson, options);
                if (cachedResult != null)
                {
                    return cachedResult;
                }
            }
            catch
            {
                // Fallback to database lookup if cache deserialization fails
            }
        }

        // 2. Validate user and token against database
        var user = await _dbContext.Users
            .Include(u => u.RefreshTokens)
            .SingleOrDefaultAsync(u => u.RefreshTokens.Any(rt => rt.Token == request.RefreshToken), cancellationToken);

        if (user == null)
        {
            throw new DomainException("Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        var currentToken = user.RefreshTokens.SingleOrDefault(rt => rt.Token == request.RefreshToken);
        if (currentToken == null || currentToken.IsExpired)
        {
            throw new DomainException("Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (user.IsBlacklisted)
        {
            throw new DomainException($"Tài khoản của bạn đã bị khóa! Lý do: {user.BlacklistReason ?? "Không có lý do cụ thể"}.");
        }

        if (user.IsLockedOut())
        {
            throw new DomainException("Tài khoản hiện đang bị khóa tạm thời.");
        }

        // 3. Revoke old token and issue a new one (Token Rotation)
        user.RemoveRefreshToken(request.RefreshToken);

        var newAccessToken = _tokenService.GenerateToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.AddRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(7));
        await _dbContext.SaveChangesAsync(cancellationToken);

        var result = new LoginResult(newAccessToken, newRefreshToken, user.Id.ToString(), user.Username, user.Email, user.Role);

        // 4. Cache the mapping from old refresh token to the new LoginResult
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
        };
        var serializedResult = JsonSerializer.Serialize(result);
        await _cache.SetStringAsync(cacheKey, serializedResult, cacheOptions, cancellationToken);

        return result;
    }
}
