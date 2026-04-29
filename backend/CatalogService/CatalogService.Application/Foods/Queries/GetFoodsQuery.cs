using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CatalogService.Application.Foods.Queries;

public record PagedResult<T>(List<T> Items, int TotalCount, int Skip, int Take);

public record GetFoodsQuery(int Skip = 0, int Take = 50) : IRequest<PagedResult<FoodDto>>;

public class GetFoodsQueryHandler : IRequestHandler<GetFoodsQuery, PagedResult<FoodDto>>
{
    private readonly IAppDbContext _context;
    private readonly string _publicUrl;

    public GetFoodsQueryHandler(IAppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? "http://localhost:9000";
    }

    public async Task<PagedResult<FoodDto>> Handle(GetFoodsQuery request, CancellationToken cancellationToken)
    {
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

        return new PagedResult<FoodDto>(items, totalCount, request.Skip, request.Take);
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
