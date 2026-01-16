using BunBo.Domain.Common;

namespace BunBo.Domain.Entities
{
    public class AdminUser : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        
        public Guid RoleId { get; set; }
        public Role? Role { get; set; }
    }
}
