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
    public VoucherType Type { get; private set; }
    public int? PointCost { get; private set; }
    public string? Conditions { get; private set; }
    
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
        int maxUsagePerUser,
        VoucherType type = VoucherType.Standard,
        int? pointCost = null,
        string? conditions = null)
    {
        if (discountValue < 0) throw new DomainException("Giá trị giảm không được nhỏ hơn 0.");
        if (minOrderValue < 0) throw new DomainException("Đơn tối thiểu không được nhỏ hơn 0.");
        if (maxDiscountAmount.HasValue && maxDiscountAmount.Value < 0) throw new DomainException("Giá trị giảm tối đa không được nhỏ hơn 0.");
        if (totalUsageLimit < 0) throw new DomainException("Tổng số lượt sử dụng không được nhỏ hơn 0.");
        if (maxUsagePerUser < 0) throw new DomainException("Số lượt sử dụng mỗi người không được nhỏ hơn 0.");
        if (pointCost.HasValue && pointCost.Value < 0) throw new DomainException("Số điểm quy đổi không được nhỏ hơn 0.");

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
        Type = type;
        PointCost = pointCost;
        Conditions = conditions;
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
