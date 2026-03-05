using BunBo.SharedKernel;

namespace CatalogService.Domain.Entities;

public class Food : BaseEntity
{
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public decimal Price { get; private set; }
    public bool IsAvailable { get; private set; }
    public Guid CategoryId { get; private set; }

    public Category? Category { get; private set; }

    protected Food() { } // For EF Core

    public Food(string name, string? description, string? imageUrl, decimal price, Guid categoryId)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        Price = price;
        IsAvailable = true;
        CategoryId = categoryId;
    }

    public void Update(string name, string? description, string? imageUrl, decimal price, Guid categoryId)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        Price = price;
        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetAvailability(bool isAvailable)
    {
        IsAvailable = isAvailable;
        UpdatedAt = DateTime.UtcNow;
    }
}
