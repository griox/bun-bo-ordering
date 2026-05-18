namespace BunBo.SharedKernel.Messaging;

public class VoucherHuntNotificationEvent
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public int DiscountType { get; set; } // 0: Percentage, 1: FixedAmount
    public int TotalUsageLimit { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}
