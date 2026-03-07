using BunBo.SharedKernel;

namespace CatalogService.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; private set; }

    public ICollection<Food> Foods { get; private set; } = new List<Food>();

    protected Category() { Name = null!; } // For EF Core

    public Category(string name)
    {
        Name = name;
    }

    public void Update(string name)
    {
        Name = name;
        UpdatedAt = DateTime.UtcNow;
    }
}
