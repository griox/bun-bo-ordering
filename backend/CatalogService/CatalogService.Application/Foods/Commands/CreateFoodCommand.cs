using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace CatalogService.Application.Foods.Commands;

public record CreateFoodCommand(string Name, string? Description, decimal Price, int CategoryId, IFormFile? ImageFile) : IRequest<Guid>;

public class CreateFoodCommandHandler : IRequestHandler<CreateFoodCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IFileStorageService _storageService;

    public CreateFoodCommandHandler(IAppDbContext context, IFileStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<Guid> Handle(CreateFoodCommand request, CancellationToken cancellationToken)
    {
        var categoryExists = _context.Categories.Any(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            throw new Exception("Category not found");
        }

        string? imageUrl = null;
        if (request.ImageFile != null)
        {
            imageUrl = await _storageService.UploadFileAsync(request.ImageFile, request.Name);
        }

        var food = new Food(request.Name, request.Description, imageUrl, request.Price, request.CategoryId);
        
        _context.Foods.Add(food);
        await _context.SaveChangesAsync(cancellationToken);

        return food.Id;
    }
}
