namespace BunBo.SharedKernel.Messaging;

public class VoucherCreatedEvent
{
    public Guid VoucherId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public int DiscountType { get; set; } // 0: Percentage, 1: FixedAmount
    public int TotalUsageLimit { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}
