using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Foods.Commands;

public record UpdateFoodCommand(Guid Id, string Name, string? Description, decimal Price, int CategoryId, IFormFile? ImageFile) : IRequest<bool>;

public class UpdateFoodCommandHandler : IRequestHandler<UpdateFoodCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IFileStorageService _storageService;

    public UpdateFoodCommandHandler(IAppDbContext context, IFileStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
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

        string? imageUrl = food.ImageUrl;
        if (request.ImageFile != null)
        {
            // Optional: Delete old image if needed
            // if (!string.IsNullOrEmpty(food.ImageUrl)) await _storageService.DeleteFileAsync(food.ImageUrl);
            
            imageUrl = await _storageService.UploadFileAsync(request.ImageFile, request.Name);
        }

        food.Update(request.Name, request.Description, imageUrl, request.Price, request.CategoryId);
        
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
