using BunBo.SharedKernel;

namespace IdentityService.Domain.Entities;

public class User : BaseEntity
{
    public string Username { get; private set; }
    public string Email { get; private set; }
    public string? PasswordHash { get; private set; } // Nullable for Google users
    public string Role { get; private set; }
    public string? GoogleId { get; private set; } // Nullable for normal users

    public bool IsBlacklisted { get; private set; }
    public string? BlacklistReason { get; private set; }
    public DateTime? BlacklistedAt { get; private set; }

    public int FailedLoginAttempts { get; private set; }
    public DateTimeOffset? LockoutEnd { get; private set; }

    private readonly List<RefreshToken> _refreshTokens = new();
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

    public void AddRefreshToken(string token, DateTime expiryTime)
    {
        // Giới hạn số lượng thiết bị đăng nhập đồng thời (ví dụ: tối đa 5 thiết bị)
        var maxTokens = 5;
        if (_refreshTokens.Count >= maxTokens)
        {
            // Xóa các token đã hết hạn
            _refreshTokens.RemoveAll(rt => rt.IsExpired);

            // Nếu vẫn đầy, xóa token cũ nhất
            if (_refreshTokens.Count >= maxTokens)
            {
                var oldestToken = _refreshTokens.OrderBy(rt => rt.CreatedAt).First();
                _refreshTokens.Remove(oldestToken);
            }
        }

        _refreshTokens.Add(new RefreshToken(token, expiryTime, this.Id));
    }

    public void RemoveRefreshToken(string token)
    {
        var refreshToken = _refreshTokens.SingleOrDefault(rt => rt.Token == token);
        if (refreshToken != null)
        {
            _refreshTokens.Remove(refreshToken);
        }
    }

    public void RevokeAllRefreshTokens()
    {
        _refreshTokens.Clear();
    }

    // For EF Core
    protected User() 
    { 
        Username = null!;
        Email = null!;
        Role = null!;
    }

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

    public void UpdateUsername(string newUsername)
    {
        Username = newUsername;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }

    public void Blacklist(string reason)
    {
        IsBlacklisted = true;
        BlacklistReason = reason;
        BlacklistedAt = DateTime.UtcNow;
    }

    public void RemoveBlacklist()
    {
        IsBlacklisted = false;
        BlacklistReason = null;
        BlacklistedAt = null;
    }

    public void IncrementFailedAttempts()
    {
        FailedLoginAttempts++;
        if (FailedLoginAttempts >= 5)
        {
            LockAccount(TimeSpan.FromMinutes(5));
        }
    }

    public void ResetFailedAttempts()
    {
        FailedLoginAttempts = 0;
        LockoutEnd = null;
    }

    public void LockAccount(TimeSpan duration)
    {
        LockoutEnd = DateTimeOffset.UtcNow.Add(duration);
    }

    public bool IsLockedOut()
    {
        return LockoutEnd.HasValue && LockoutEnd.Value > DateTimeOffset.UtcNow;
    }
}
