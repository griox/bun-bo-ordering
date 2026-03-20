using CatalogService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CatalogService.Application.Foods.Queries;

public record FoodDto(Guid Id, string Name, string? Description, string? ImageUrl, decimal Price, bool IsAvailable, int CategoryId);

public record GetFoodsByCategoryQuery(int CategoryId) : IRequest<List<FoodDto>>;

public class GetFoodsByCategoryQueryHandler : IRequestHandler<GetFoodsByCategoryQuery, List<FoodDto>>
{
    private readonly IAppDbContext _context;
    private readonly string _publicUrl;

    public GetFoodsByCategoryQueryHandler(IAppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? "http://localhost:9000";
    }

    public async Task<List<FoodDto>> Handle(GetFoodsByCategoryQuery request, CancellationToken cancellationToken)
    {
        var foods = await _context.Foods
            .Where(f => f.CategoryId == request.CategoryId)
            .ToListAsync(cancellationToken);

        return foods.Select(f => new FoodDto(
            f.Id, 
            f.Name, 
            f.Description, 
            FixImageUrl(f.ImageUrl), 
            f.Price, 
            f.IsAvailable, 
            f.CategoryId))
            .ToList();
    }

    private string? FixImageUrl(string? imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl)) return imageUrl;
        
        // 1. If the URL contains 'minio:9000' (internal docker name), replace it with the PublicUrl
        if (imageUrl.Contains("minio:9000"))
        {
            return imageUrl.Replace("http://minio:9000", _publicUrl.TrimEnd('/'));
        }

        // 2. If via.placeholder.com is unreachable (DNS issue), redirect to placehold.co
        if (imageUrl.Contains("via.placeholder.com"))
        {
            return imageUrl.Replace("via.placeholder.com", "placehold.co");
        }
        
        return imageUrl;
    }
}
