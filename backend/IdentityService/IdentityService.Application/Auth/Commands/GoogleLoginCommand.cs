using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Auth.Commands;

public record GoogleLoginCommand(string AccessToken) : IRequest<LoginResult>;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, LoginResult>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly IGoogleAuthService _googleAuthService;

    public GoogleLoginCommandHandler(IAppDbContext dbContext, ITokenService tokenService, IGoogleAuthService googleAuthService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _googleAuthService = googleAuthService;
    }

    public async Task<LoginResult> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await _googleAuthService.GetUserInfoAsync(request.AccessToken, cancellationToken)
            ?? throw new Exception("Invalid Google access token.");

        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.GoogleId == googleUser.Sub, cancellationToken);

        if (user == null)
        {
            user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Username == googleUser.Email, cancellationToken);
            if (user != null)
            {
                throw new Exception("Tài khoản với email này đã tồn tại. Vui lòng đăng nhập bằng mật khẩu.");
            }

            user = User.CreateGoogleUser(googleUser.Email, googleUser.Sub);
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var token = _tokenService.GenerateToken(user);
        return new LoginResult(token, user.Id.ToString(), user.Username, user.Role);
    }
}
