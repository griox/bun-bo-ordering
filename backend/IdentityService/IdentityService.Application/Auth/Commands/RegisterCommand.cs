using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

// Since we don't have a shared repository yet, we reference DbContext directly or via an interface.
// For simplicity in this microservice, using the DbContext interface/class directly is common.
namespace IdentityService.Application.Auth.Commands;

public record RegisterCommand(string Username, string Password, string Role) : IRequest<Guid>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IAppDbContext _dbContext;

    public RegisterCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Password Validation: At least 8 characters, 1 uppercase, 1 special character
        var passwordRegex = new System.Text.RegularExpressions.Regex(@"^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$");
        if (!passwordRegex.IsMatch(request.Password))
        {
            throw new Exception("Password must be at least 8 characters long, contain at least one uppercase letter, and at least one special character.");
        }

        var allowedRoles = new[] { "Admin", "Client" };
        if (!allowedRoles.Contains(request.Role))
        {
            throw new Exception("Invalid role. Only 'Admin' and 'Client' are allowed.");
        }
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

        return user.Id;
    }
}
