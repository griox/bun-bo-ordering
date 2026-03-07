using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Foods.Commands;

public record DeleteFoodCommand(Guid Id) : IRequest<bool>;

public class DeleteFoodCommandHandler : IRequestHandler<DeleteFoodCommand, bool>
{
    private readonly IAppDbContext _context;

    public DeleteFoodCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteFoodCommand request, CancellationToken cancellationToken)
    {
        var food = await _context.Foods.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        
        if (food == null)
            return false;

        _context.Foods.Remove(food);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
