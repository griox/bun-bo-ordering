using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    public string TableCode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    
    public ICollection<TableSession> Sessions { get; private set; } = new List<TableSession>();

    protected RestaurantTable() { }

    public RestaurantTable(string tableCode, string name)
    {
        TableCode = tableCode;
        Name = name;
    }



    public void UpdateDetails(string tableCode, string name)
    {
        TableCode = tableCode;
        Name = name;
    }
}
