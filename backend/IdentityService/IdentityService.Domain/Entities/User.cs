using BunBo.SharedKernel;

namespace IdentityService.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; private set; }
    public string Email { get; private set; }
    public string? PasswordHash { get; private set; } // Nullable for Google users
    public string Role { get; private set; }
    public string? GoogleId { get; private set; } // Nullable for normal users

    // For EF Core
    protected User() { }

    // Constructor for normal registration
    public User(string username, string email, string passwordHash, string role)
    {
        Username = username;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
    }

    // Constructor for Google OAuth registration
    public static User CreateGoogleUser(string email, string googleId)
    {
        var user = new User();
        // Use the part before @ as the display username
        user.Username = email.Split('@')[0];
        user.Email = email;
        user.PasswordHash = null;
        user.Role = "Client";
        user.GoogleId = googleId;
        return user;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}
