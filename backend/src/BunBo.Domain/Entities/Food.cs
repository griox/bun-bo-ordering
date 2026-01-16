using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class Food : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; } = true;
        
        public Guid CategoryId { get; set; }
        public Category? Category { get; set; }
    }
}
