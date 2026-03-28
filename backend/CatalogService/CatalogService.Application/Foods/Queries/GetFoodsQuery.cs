using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CatalogService.Application.Foods.Queries;

public record GetFoodsQuery(int Skip = 0, int Take = 50) : IRequest<List<FoodDto>>;

public class GetFoodsQueryHandler : IRequestHandler<GetFoodsQuery, List<FoodDto>>
{
    private readonly IAppDbContext _context;
    private readonly string _publicUrl;

    public GetFoodsQueryHandler(IAppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? "http://localhost:9000";
    }

    public async Task<List<FoodDto>> Handle(GetFoodsQuery request, CancellationToken cancellationToken)
    {
        var foods = await _context.Foods
            .Include(f => f.Category)
            .OrderBy(f => f.Name)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync(cancellationToken);

        return foods.Select(f => new FoodDto(
            f.Id,
            f.Name,
            f.Description,
            FixImageUrl(f.ImageUrl),
            f.Price,
            f.IsAvailable,
            f.CategoryId
        )).ToList();
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
