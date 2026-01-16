using BunBo.Domain.Common;
using BunBo.Domain.Enums;

namespace BunBo.Domain.Entities
{
    public class RestaurantTable : BaseEntity
    {
        public string TableCode { get; set; } = string.Empty; // QR Code content
        public string Name { get; set; } = string.Empty; // "Table 1"
        public TableStatus Status { get; set; } = TableStatus.Available;
        
        public Guid BranchId { get; set; }
        public Branch? Branch { get; set; }
        
        public ICollection<TableSession> Sessions { get; set; } = new List<TableSession>();
    }
}
