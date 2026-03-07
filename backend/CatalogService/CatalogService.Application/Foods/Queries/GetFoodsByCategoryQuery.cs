using CatalogService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Foods.Queries;

public record FoodDto(Guid Id, string Name, string? Description, string? ImageUrl, decimal Price, bool IsAvailable, int CategoryId);

public record GetFoodsByCategoryQuery(int CategoryId) : IRequest<List<FoodDto>>;

public class GetFoodsByCategoryQueryHandler : IRequestHandler<GetFoodsByCategoryQuery, List<FoodDto>>
{
    private readonly IAppDbContext _context;

    public GetFoodsByCategoryQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FoodDto>> Handle(GetFoodsByCategoryQuery request, CancellationToken cancellationToken)
    {
        return await _context.Foods
            .Where(f => f.CategoryId == request.CategoryId)
            .Select(f => new FoodDto(f.Id, f.Name, f.Description, f.ImageUrl, f.Price, f.IsAvailable, f.CategoryId))
            .ToListAsync(cancellationToken);
    }
}
