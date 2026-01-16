using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class Branch : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        
        public ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
    }
}
