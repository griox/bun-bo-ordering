using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;

namespace IdentityService.Application.Auth.Commands;

public record GoogleLoginCommand(string IdToken) : IRequest<string>;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, string>
{
    private readonly IAppDbContext _dbContext;
    private readonly ITokenService _tokenService;

    // We can inject IConfiguration if we need the Google ClientId, 
    // but for now we can validate without enforcing a specific audience 
    // or validate it using GoogleJsonWebSignature.ValidateAsync(request.IdToken).

    public GoogleLoginCommandHandler(IAppDbContext dbContext, ITokenService tokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    public async Task<string> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            // Validates the JWT signature with Google's public keys
            // In a real production app, you SHOULD pass ValidationSettings with your specific ClientId
            // payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings() { Audience = new[] { "YOUR_CLIENT_ID" } });
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken);
        }
        catch (InvalidJwtException)
        {
            throw new Exception("Invalid Google ID Token.");
        }

        // Check if a user with this GoogleId already exists
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.GoogleId == payload.Subject, cancellationToken);
        
        if (user == null)
        {
            // Maybe they registered with the same email normally before?
            user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Username == payload.Email, cancellationToken);
            
            if (user != null)
            {
                // Optionally: link the Google account to the existing account
                throw new Exception("An account with this email already exists but is not linked to Google. Please login normally.");
            }
            else
            {
                // Register new user automatically
                user = User.CreateGoogleUser(payload.Email, payload.Subject);
                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        // Generate JWT Token for our system
        return _tokenService.GenerateToken(user);
    }
}
