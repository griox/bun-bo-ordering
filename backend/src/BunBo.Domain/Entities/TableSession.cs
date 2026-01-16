using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class TableSession : BaseEntity
    {
        public Guid TableId { get; set; }
        public RestaurantTable? Table { get; set; }
        
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        
        public bool IsClosed { get; set; } = false;
        
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
