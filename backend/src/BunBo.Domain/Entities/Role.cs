using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // e.g. "Admin", "Manager"
        public ICollection<AdminUser> Users { get; set; } = new List<AdminUser>();
    }
}
