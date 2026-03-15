using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class RestaurantTable : BaseEntity
{
    public string TableCode { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public int PosX { get; private set; }
    public int PosY { get; private set; }
    
    public ICollection<TableSession> Sessions { get; private set; } = new List<TableSession>();

    protected RestaurantTable() { }

    public RestaurantTable(string tableCode, string name, int posX = 0, int posY = 0)
    {
        TableCode = tableCode;
        Name = name;
        PosX = posX;
        PosY = posY;
    }

    public void UpdateDetails(string tableCode, string name)
    {
        TableCode = tableCode;
        Name = name;
    }

    public void SetPosition(int x, int y)
    {
        PosX = x;
        PosY = y;
    }
}
