using BunBo.SharedKernel;

namespace IdentityService.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; private set; }
    public string? PasswordHash { get; private set; } // Nullable for Google users
    public string Role { get; private set; } // "Admin" or "Client"
    public string? GoogleId { get; private set; } // Nullable for normal users

    // For EF Core
    protected User() { }

    // Constructor for normal registration
    public User(string username, string passwordHash, string role)
    {
        Username = username;
        PasswordHash = passwordHash;
        Role = role;
    }

    // Constructor for Google OAuth registration
    public static User CreateGoogleUser(string email, string googleId)
    {
        var user = new User();
        user.Username = email; // Using email as username for Google login
        user.PasswordHash = null;
        user.Role = "Client"; // Specific requirement
        user.GoogleId = googleId;
        return user;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}
