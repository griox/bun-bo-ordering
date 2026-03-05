using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

// Since we don't have a shared repository yet, we reference DbContext directly or via an interface.
// For simplicity in this microservice, using the DbContext interface/class directly is common.
namespace IdentityService.Application.Auth.Commands;

public record RegisterCommand(string Username, string Password, string Role) : IRequest<string>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, string>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(IAppDbContext dbContext, ITokenService tokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    public async Task<string> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
        {
            throw new Exception("User already exists");
        }

        var passwordHasher = new PasswordHasher<User>();
        var user = new User(request.Username, "", request.Role);
        var hash = passwordHasher.HashPassword(user, request.Password);
        user.UpdatePassword(hash);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return _tokenService.GenerateToken(user);
    }
}
