using BunBo.SharedKernel;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace IdentityService.Application.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<LoginResult>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IAppDbContext dbContext, ITokenService tokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Login by Username
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
        if (user == null)
            throw new DomainException("Tên đăng nhập hoặc mật khẩu không chính xác!");

        // Check Lockout
        if (user.IsLockedOut())
        {
            var remainingTime = user.LockoutEnd!.Value - DateTimeOffset.UtcNow;
            throw new DomainException($"Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau {Math.Ceiling(remainingTime.TotalMinutes)} phút.");
        }

        if (user.PasswordHash == null)
            throw new DomainException("Tài khoản này được đăng kì bằng Google. Vui lòng đăng nhập bằng Google.");

        if (user.IsBlacklisted)
            throw new DomainException($"Tài khoản của bạn đã bị khóa! Lý do: {user.BlacklistReason ?? "Không có lý do cụ thể"}. Liên hệ Admin để được hỗ trợ.");

        var passwordHasher = new PasswordHasher<User>();
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            user.IncrementFailedAttempts();
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw new DomainException("Tên đăng nhập hoặc mật khẩu không chính xác!");
        }

        // Reset failed attempts on successful login
        user.ResetFailedAttempts();
        await _dbContext.SaveChangesAsync(cancellationToken);

        var token = _tokenService.GenerateToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.UpdateRefreshToken(refreshToken, DateTime.UtcNow.AddDays(7));
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(token, refreshToken, user.Id.ToString(), user.Username, user.Email, user.Role);
    }
}
