using BunBo.SharedKernel;
using OrderService.Domain.Enums;

namespace OrderService.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    public string TableCode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public TableStatus Status { get; private set; }
    
    public ICollection<TableSession> Sessions { get; private set; } = new List<TableSession>();

    protected RestaurantTable() { }

    public RestaurantTable(string tableCode, string name)
    {
        TableCode = tableCode;
        Name = name;
        Status = TableStatus.Available;
    }

    public void MarkAsOccupied() => Status = TableStatus.Occupied;
    public void MarkAsAvailable() => Status = TableStatus.Available;
    public void MarkAsReserved() => Status = TableStatus.Reserved;
}
