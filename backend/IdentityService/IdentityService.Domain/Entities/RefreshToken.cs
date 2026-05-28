using BunBo.SharedKernel;

namespace IdentityService.Domain.Entities;

public class RefreshToken : BaseEntity<Guid>
{
    public string Token { get; private set; }
    public DateTime ExpiryTime { get; private set; }
    public Guid UserId { get; private set; }

    // Navigation property
    public User User { get; private set; } = null!;

    protected RefreshToken() 
    {
        Token = null!;
    }

    public RefreshToken(string token, DateTime expiryTime, Guid userId)
    {
        Token = token;
        ExpiryTime = expiryTime;
        UserId = userId;
    }

    public bool IsExpired => DateTime.UtcNow >= ExpiryTime;
}
