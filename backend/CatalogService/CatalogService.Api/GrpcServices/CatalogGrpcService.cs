using CatalogService.Api.Protos;
using CatalogService.Application.Interfaces;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Api.GrpcServices;

public class CatalogGrpcService : CatalogGrpc.CatalogGrpcBase
{
    private readonly IAppDbContext _context;

    public CatalogGrpcService(IAppDbContext context)
    {
        _context = context;
    }

    public override async Task<GetFoodPriceResponse> GetFoodPrice(GetFoodPriceRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.FoodId, out var foodId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid Food ID"));
        }

        var food = await _context.Foods.FirstOrDefaultAsync(f => f.Id == foodId);

        if (food == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"Food with ID {request.FoodId} not found."));
        }

        return new GetFoodPriceResponse
        {
            Price = (double)food.Price,
            IsAvailable = food.IsAvailable,
            Name = food.Name
        };
    }

    public override async Task<GetFoodPricesResponse> GetFoodPrices(GetFoodPricesRequest request, ServerCallContext context)
    {
        var validGuids = request.FoodIds
            .Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty)
            .Where(g => g != Guid.Empty)
            .ToList();

        if (!validGuids.Any())
        {
            return new GetFoodPricesResponse();
        }

        var foods = await _context.Foods
            .Where(f => validGuids.Contains(f.Id))
            .ToListAsync();

        var response = new GetFoodPricesResponse();
        foreach (var food in foods)
        {
            response.FoodPrices.Add(food.Id.ToString(), new GetFoodPriceResponse
            {
                Price = (double)food.Price,
                IsAvailable = food.IsAvailable,
                Name = food.Name
            });
        }

        return response;
    }
}
