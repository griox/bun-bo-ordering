using BunBo.Domain.Common;
using BunBo.Domain.Enums;

namespace BunBo.Domain.Entities
{
    public class Payment : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Order? Order { get; set; }
        
        public decimal Amount { get; set; }
        public string Provider { get; set; } = string.Empty; // MOMO, ZALOPAY
        public string? TransactionId { get; set; } // ID from Provider
        public string? Signature { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? PaymentUrl { get; set; }
    }
}
