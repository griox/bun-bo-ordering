using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using BunBo.SharedKernel.Messaging;

namespace IdentityService.Application.Auth.Commands;

public record GoogleLoginCommand(string AccessToken) : IRequest<LoginResult>;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, LoginResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IPublishEndpoint _publishEndpoint;

    public GoogleLoginCommandHandler(
        IAppDbContext dbContext, 
        ITokenService tokenService, 
        IGoogleAuthService googleAuthService,
        IPublishEndpoint publishEndpoint)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _googleAuthService = googleAuthService;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<LoginResult> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await _googleAuthService.GetUserInfoAsync(request.AccessToken, cancellationToken)
            ?? throw new Exception("Invalid Google access token.");

        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.GoogleId == googleUser.Sub, cancellationToken);

        if (user == null)
        {
            user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == googleUser.Email, cancellationToken);
            if (user != null)
            {
                throw new Exception("Tài khoản với email này đã tồn tại. Vui lòng đăng nhập bằng mật khẩu.");
            }

            user = User.CreateGoogleUser(googleUser.Email, googleUser.Sub);
            user.UpdateUsername(googleUser.Email.Split('@')[0]);
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);

            // Publish event for new Google user
            await _publishEndpoint.Publish(new UserRegisteredEvent
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                RegisteredAt = DateTime.UtcNow
            }, cancellationToken);
        }
        else if (string.IsNullOrWhiteSpace(user.Username) || user.Username.Contains("@"))
        {
            // Auto-correct empty usernames or legacy ones set to full email
            var newUsername = googleUser.Email.Split('@')[0];
            user.UpdateUsername(newUsername);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        if (user.IsBlacklisted)
            throw new Exception($"Tài khoản của bạn đã bị khóa! Lý do: {user.BlacklistReason ?? "Không có lý do cụ thể"}. Liên hệ Admin để được hỗ trợ.");

        var token = _tokenService.GenerateToken(user);
        return new LoginResult(token, user.Id.ToString(), user.Username, user.Email, user.Role);
    }
}
