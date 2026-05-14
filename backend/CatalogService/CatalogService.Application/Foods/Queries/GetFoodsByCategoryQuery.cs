using CatalogService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace CatalogService.Application.Foods.Queries;

public record GetFoodsByCategoryQuery(int CategoryId) : IRequest<List<FoodDto>>;

public class GetFoodsByCategoryQueryHandler : IRequestHandler<GetFoodsByCategoryQuery, List<FoodDto>>
{
    private readonly IAppDbContext _context;
    private readonly string _publicUrl;
    private readonly IDistributedCache _cache;

    public GetFoodsByCategoryQueryHandler(IAppDbContext context, IConfiguration configuration, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? "http://localhost:9000";
    }

    public async Task<List<FoodDto>> Handle(GetFoodsByCategoryQuery request, CancellationToken cancellationToken)
    {
        string cacheKey = $"foods_category_{request.CategoryId}";
        var cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);

        if (!string.IsNullOrEmpty(cachedData))
        {
            return JsonSerializer.Deserialize<List<FoodDto>>(cachedData)!;
        }

        var foods = await _context.Foods
            .Include(f => f.Category)
            .Where(f => f.CategoryId == request.CategoryId)
            .ToListAsync(cancellationToken);

        var result = foods.Select(f => new FoodDto(
            f.Id, 
            f.Name, 
            f.Description, 
            FixImageUrl(f.ImageUrl), 
            f.Price, 
            f.IsAvailable, 
            f.CategoryId,
            f.Category?.Name))
            .ToList();

        // Cache for 10 minutes
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions, cancellationToken);

        return result;
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
