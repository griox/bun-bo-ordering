using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Foods.Commands;

public record UpdateFoodCommand(Guid Id, string Name, string? Description, string? ImageUrl, decimal Price, int CategoryId) : IRequest<bool>;

public class UpdateFoodCommandHandler : IRequestHandler<UpdateFoodCommand, bool>
{
    private readonly IAppDbContext _context;

    public UpdateFoodCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateFoodCommand request, CancellationToken cancellationToken)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new Exception("Category not found");
        }

        var food = await _context.Foods.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (food == null)
            return false;

        food.Update(request.Name, request.Description, request.ImageUrl, request.Price, request.CategoryId);
        
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
