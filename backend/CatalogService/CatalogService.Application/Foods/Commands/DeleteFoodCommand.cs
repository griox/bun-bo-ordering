using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Foods.Commands;

public record DeleteFoodCommand(Guid Id) : IRequest<bool>;

public class DeleteFoodCommandHandler : IRequestHandler<DeleteFoodCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IFileStorageService _storageService;
    private readonly ICacheService _cacheService;

    public DeleteFoodCommandHandler(IAppDbContext context, IFileStorageService storageService, ICacheService cacheService)
    {
        _context = context;
        _storageService = storageService;
        _cacheService = cacheService;
    }

    public async Task<bool> Handle(DeleteFoodCommand request, CancellationToken cancellationToken)
    {
        var food = await _context.Foods.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        
        if (food == null)
            return false;

        if (!string.IsNullOrEmpty(food.ImageUrl))
        {
            await _storageService.DeleteFileAsync(food.ImageUrl);
        }

        _context.Foods.Remove(food);
        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveByPrefixAsync("foods_", cancellationToken);

        return true;
    }
}
