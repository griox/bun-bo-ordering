using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
namespace IdentityService.Application.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<LoginResult>;

public record LoginResult(string token, string userId, string username, string role);

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
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
        if (user == null)
        {
            throw new Exception("Invalid username or password");
        }

        var passwordHasher = new PasswordHasher<User>();
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            throw new Exception("Invalid username or password");
        }

        var token = _tokenService.GenerateToken(user);
        return new LoginResult(token, user.Id.ToString(), user.Username, user.Role);
    }
}
