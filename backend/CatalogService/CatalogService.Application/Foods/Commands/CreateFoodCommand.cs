using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BunBo.SharedKernel;

namespace CatalogService.Application.Foods.Commands;

public record CreateFoodCommand(string Name, string? Description, decimal Price, int CategoryId, IFormFile? ImageFile) : IRequest<Guid>;

public class CreateFoodCommandHandler : IRequestHandler<CreateFoodCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IFileStorageService _storageService;
    private readonly ICacheService _cacheService;

    public CreateFoodCommandHandler(IAppDbContext context, IFileStorageService storageService, ICacheService cacheService)
    {
        _context = context;
        _storageService = storageService;
        _cacheService = cacheService;
    }

    public async Task<Guid> Handle(CreateFoodCommand request, CancellationToken cancellationToken)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new DomainException("Category not found");
        }

        if (request.Price <= 0)
        {
            throw new DomainException("Price must be greater than zero");
        }

        var isDuplicate = await _context.Foods.AnyAsync(f => f.Name == request.Name && f.CategoryId == request.CategoryId, cancellationToken);
        if (isDuplicate)
        {
            throw new DomainException("Food with this name already exists in this category");
        }

        string? imageUrl = null;
        if (request.ImageFile != null)
        {
            imageUrl = await _storageService.UploadFileAsync(request.ImageFile, request.Name);
        }

        var food = new Food(request.Name, request.Description, imageUrl, request.Price, request.CategoryId);
        
        _context.Foods.Add(food);
        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveByPrefixAsync("foods_", cancellationToken);

        return food.Id;
    }
}
