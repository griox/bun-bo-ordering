using BunBo.SharedKernel;
using PromotionService.Domain.Enums;

namespace PromotionService.Domain.Entities;

public class Voucher : BaseEntity
{
    public string Code { get; private set; }
    public string Description { get; private set; }
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public decimal MinOrderValue { get; private set; }
    
    public DateTime ValidFrom { get; private set; }
    public DateTime ValidTo { get; private set; }
    
    public int TotalUsageLimit { get; private set; }
    public int UsageCount { get; private set; }
    public int MaxUsagePerUser { get; private set; }
    
    public bool IsActive { get; private set; }

    // For EF Core
    protected Voucher() { }

    public Voucher(
        string code, 
        string description, 
        DiscountType discountType, 
        decimal discountValue, 
        decimal? maxDiscountAmount, 
        decimal minOrderValue,
        DateTime validFrom,
        DateTime validTo,
        int totalUsageLimit,
        int maxUsagePerUser)
    {
        Code = code.ToUpper();
        Description = description;
        DiscountType = discountType;
        DiscountValue = discountValue;
        MaxDiscountAmount = maxDiscountAmount;
        MinOrderValue = minOrderValue;
        ValidFrom = validFrom;
        ValidTo = validTo;
        TotalUsageLimit = totalUsageLimit;
        MaxUsagePerUser = maxUsagePerUser;
        UsageCount = 0;
        IsActive = true;
    }

    public void ToggleActive() => IsActive = !IsActive;

    public bool CanBeUsed(decimal orderAmount, Guid userId, int userUsageCount)
    {
        if (!IsActive) return false;
        if (DateTime.UtcNow < ValidFrom || DateTime.UtcNow > ValidTo) return false;
        if (orderAmount < MinOrderValue) return false;
        if (UsageCount >= TotalUsageLimit) return false;
        if (userUsageCount >= MaxUsagePerUser) return false;
        
        return true;
    }

    public void IncrementUsage()
    {
        if (UsageCount >= TotalUsageLimit)
            throw new Exception("Hết lượt sử dụng mã giảm giá này!");
            
        UsageCount++;
    }
}
