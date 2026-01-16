using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class OrderItem : BaseEntity
    {
        public Guid OrderId { get; set; }
        public Order? Order { get; set; }
        
        public Guid FoodId { get; set; }
        public Food? Food { get; set; }
        
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Snapshot price at time of order
        public decimal TotalPrice => Quantity * UnitPrice;
        public string? Note { get; set; }
    }
}
