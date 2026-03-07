using BunBo.SharedKernel;

namespace IdentityService.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; private set; }
    public string PasswordHash { get; private set; }
    public string Role { get; private set; } // "Admin" or "Client"

    // For EF Core
    protected User() { }

    public User(string username, string passwordHash, string role)
    {
        Username = username;
        PasswordHash = passwordHash;
        Role = role;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}
