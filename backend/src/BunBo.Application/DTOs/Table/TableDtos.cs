using BunBo.Domain.Enums;

namespace BunBo.Application.DTOs.Table
{
    public class TableResponseDto
    {
        public Guid Id { get; set; }
        public string TableCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty; 
    }

    public class StartSessionRequestDto
    {
        public Guid TableId { get; set; }
    }

    public class TableSessionResponseDto
    {
        public Guid Id { get; set; }
        public Guid TableId { get; set; }
        public DateTime StartTime { get; set; }
        public bool IsClosed { get; set; }
    }
}
