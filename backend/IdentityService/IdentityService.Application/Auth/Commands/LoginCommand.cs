using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace IdentityService.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;



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
        // Login by Email
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user == null)
            throw new Exception("Email hoặc mật khẩu không chính xác!");

        if (user.PasswordHash == null)
            throw new Exception("Tài khoản này được đăng kí bằng Google. Vui lòng đăng nhập bằng Google.");

        var passwordHasher = new PasswordHasher<User>();
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
            throw new Exception("Email hoặc mật khẩu không chính xác!");

        var token = _tokenService.GenerateToken(user);
        return new LoginResult(token, user.Id.ToString(), user.Username, user.Email, user.Role);
    }
}
