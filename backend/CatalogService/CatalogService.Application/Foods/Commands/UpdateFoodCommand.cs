using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BunBo.SharedKernel;

namespace CatalogService.Application.Foods.Commands;

public record UpdateFoodCommand(Guid Id, string Name, string? Description, decimal Price, int CategoryId, IFormFile? ImageFile) : IRequest<bool>;

public class UpdateFoodCommandHandler : IRequestHandler<UpdateFoodCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IFileStorageService _storageService;
    private readonly ICacheService _cacheService;

    public UpdateFoodCommandHandler(IAppDbContext context, IFileStorageService storageService, ICacheService cacheService)
    {
        _context = context;
        _storageService = storageService;
        _cacheService = cacheService;
    }

    public async Task<bool> Handle(UpdateFoodCommand request, CancellationToken cancellationToken)
    {
        // ... (validation and update logic)
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            throw new DomainException("Category not found");
        }

        var food = await _context.Foods.FirstOrDefaultAsync(f => f.Id == request.Id, cancellationToken);
        if (food == null)
            return false;

        if (request.Price <= 0)
        {
            throw new DomainException("Price must be greater than zero");
        }

        var isDuplicate = await _context.Foods.AnyAsync(f => 
            f.Name == request.Name && 
            f.CategoryId == request.CategoryId && 
            f.Id != request.Id, cancellationToken);
            
        if (isDuplicate)
        {
            throw new DomainException("Food with this name already exists in this category");
        }

        string? imageUrl = food.ImageUrl;
        if (request.ImageFile != null)
        {
            if (!string.IsNullOrEmpty(food.ImageUrl)) 
            {
                await _storageService.DeleteFileAsync(food.ImageUrl);
            }
            
            imageUrl = await _storageService.UploadFileAsync(request.ImageFile, request.Name);
        }

        food.Update(request.Name, request.Description, imageUrl, request.Price, request.CategoryId);
        
        await _context.SaveChangesAsync(cancellationToken);

        // Invalidate cache
        await _cacheService.RemoveByPrefixAsync("foods_", cancellationToken);

        return true;
    }
}
