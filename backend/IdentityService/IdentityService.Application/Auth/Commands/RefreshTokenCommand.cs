using BunBo.SharedKernel;
using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Auth.Commands;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<LoginResult>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IAppDbContext dbContext, ITokenService tokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    public async Task<LoginResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
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

        // Revoke old token and issue a new one (Token Rotation)
        user.RemoveRefreshToken(request.RefreshToken);

        var newAccessToken = _tokenService.GenerateToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.AddRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(7));
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(newAccessToken, newRefreshToken, user.Id.ToString(), user.Username, user.Email, user.Role);
    }
}
