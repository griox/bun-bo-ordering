using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Collections.Concurrent;

namespace CatalogService.Application.Foods.Queries;

public record PagedResult<T>(List<T> Items, int TotalCount, int Skip, int Take);

public record GetFoodsQuery(int Skip = 0, int Take = 50) : IRequest<PagedResult<FoodDto>>;

public class GetFoodsQueryHandler : IRequestHandler<GetFoodsQuery, PagedResult<FoodDto>>
{
    private readonly IAppDbContext _context;
    private readonly string _publicUrl;
    private readonly IDistributedCache _cache;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public GetFoodsQueryHandler(IAppDbContext context, IConfiguration configuration, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? "http://localhost:9000";
    }

    public async Task<PagedResult<FoodDto>> Handle(GetFoodsQuery request, CancellationToken cancellationToken)
    {
        string cacheKey = $"foods_skip_{request.Skip}_take_{request.Take}";
        var cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);

        if (!string.IsNullOrEmpty(cachedData))
        {
            return JsonSerializer.Deserialize<PagedResult<FoodDto>>(cachedData)!;
        }

        var keyLock = _locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await keyLock.WaitAsync(cancellationToken);
        try
        {
            // Re-check cache inside lock (Double-check locking pattern)
            cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<PagedResult<FoodDto>>(cachedData)!;
            }

            var query = _context.Foods.AsNoTracking().AsQueryable();

            var totalCount = await query.CountAsync(cancellationToken);

            var foods = await query
                .Include(f => f.Category)
                .OrderBy(f => f.Name)
                .Skip(request.Skip)
                .Take(request.Take)
                .ToListAsync(cancellationToken);

            var items = foods.Select(f => new FoodDto(
                f.Id,
                f.Name,
                f.Description,
                FixImageUrl(f.ImageUrl),
                f.Price,
                f.IsAvailable,
                f.CategoryId,
                f.Category?.Name
            )).ToList();

            var result = new PagedResult<FoodDto>(items, totalCount, request.Skip, request.Take);

            // Cache for 10 minutes
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions, cancellationToken);

            return result;
        }
        finally
        {
            keyLock.Release();
        }
    }

    private string? FixImageUrl(string? imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl)) return imageUrl;
        
        if (imageUrl.Contains("minio:9000"))
        {
            return imageUrl.Replace("http://minio:9000", _publicUrl.TrimEnd('/'));
        }

        if (imageUrl.Contains("via.placeholder.com"))
        {
            return imageUrl.Replace("via.placeholder.com", "placehold.co");
        }
        
        return imageUrl;
    }
}
