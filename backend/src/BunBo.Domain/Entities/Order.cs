using BunBo.Domain.Common;
using BunBo.Domain.Enums;

namespace BunBo.Domain.Entities
{
    public class Order : BaseEntity
    {
        public Guid TableSessionId { get; set; }
        public TableSession? TableSession { get; set; }
        
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Created;
        public string? Note { get; set; }
        
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
