using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;

namespace CatalogService.Application.Foods.Commands;

public record CreateFoodCommand(string Name, string? Description, string? ImageUrl, decimal Price, int CategoryId) : IRequest<Guid>;

public class CreateFoodCommandHandler : IRequestHandler<CreateFoodCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateFoodCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateFoodCommand request, CancellationToken cancellationToken)
    {
        var categoryExists = _context.Categories.Any(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            throw new Exception("Category not found");
        }

        var food = new Food(request.Name, request.Description, request.ImageUrl, request.Price, request.CategoryId);
        
        _context.Foods.Add(food);
        await _context.SaveChangesAsync(cancellationToken);

        return food.Id;
    }
}
