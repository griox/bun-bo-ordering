using BunBo.SharedKernel;

namespace PromotionService.Domain.Entities;

public class UserVoucher : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid VoucherId { get; private set; }
    public bool IsUsed { get; private set; }
    public Guid? OrderId { get; private set; }
    public DateTime ClaimedAt { get; private set; }
    public DateTime? UsedAt { get; private set; }
    public DateTime? ExpiryDate { get; private set; }

    // Navigation (Optional for EF Core)
    // public Voucher Voucher { get; private set; }

    protected UserVoucher() { }

    public UserVoucher(Guid userId, Guid voucherId, DateTime? expiryDate = null)
    {
        UserId = userId;
        VoucherId = voucherId;
        IsUsed = false;
        ClaimedAt = DateTime.UtcNow;
        ExpiryDate = expiryDate;
    }

    public UserVoucher(Guid userId, Guid voucherId, Guid orderId)
    {
        UserId = userId;
        VoucherId = voucherId;
        IsUsed = true;
        OrderId = orderId;
        ClaimedAt = DateTime.UtcNow;
        UsedAt = DateTime.UtcNow;
    }

    public void Use(Guid orderId)
    {
        if (IsUsed) throw new Exception("Voucher này đã được sử dụng!");
        
        IsUsed = true;
        OrderId = orderId;
        UsedAt = DateTime.UtcNow;
    }
}
