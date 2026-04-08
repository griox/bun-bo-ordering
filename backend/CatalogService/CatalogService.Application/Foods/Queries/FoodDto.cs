using System;

namespace CatalogService.Application.Foods.Queries;

public record FoodDto(
    Guid Id, 
    string Name, 
    string? Description, 
    string? ImageUrl, 
    decimal Price, 
    bool IsAvailable, 
    int CategoryId, 
    string? CategoryName = null);
