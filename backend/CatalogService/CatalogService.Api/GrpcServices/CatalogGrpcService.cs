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
}
