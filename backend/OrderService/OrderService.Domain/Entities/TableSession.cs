using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class TableSession : BaseEntity
{
    public Guid TableId { get; private set; }
    public RestaurantTable? Table { get; private set; }
    
    // Auto-generated 4-digit PIN for joining tables
    public string GroupCode { get; private set; } = string.Empty;
    
    public DateTime StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public bool IsClosed { get; private set; }

    public ICollection<Order> Orders { get; private set; } = new List<Order>();

    protected TableSession() { }

    public TableSession(Guid tableId, string groupCode)
    {
        TableId = tableId;
        GroupCode = groupCode;
        StartTime = DateTime.UtcNow;
        IsClosed = false;
    }

    public void CloseSession()
    {
        if (IsClosed) throw new DomainException("Session is already closed.");
        IsClosed = true;
        EndTime = DateTime.UtcNow;
    }
}
