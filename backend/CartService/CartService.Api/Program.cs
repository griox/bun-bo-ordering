using CartService.Application;
using CartService.Application.Interfaces;
using CartService.Infrastructure.Repositories;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Redis
var redisConnString = builder.Configuration.GetConnectionString("Redis");
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnString!));

builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ISyncCatalogClient, CartService.Infrastructure.SyncDataServices.Grpc.CatalogDataClient>();

// Configure gRPC Client
builder.Services.AddGrpcClient<CatalogService.Api.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    // The address of Catalog Service inside API Gateway or cluster
    o.Address = new Uri(builder.Configuration["GrpcSettings:CatalogUrl"]!);
});

// Configure MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => "Cart Service is running.");

var cartGroup = app.MapGroup("/api/cart");

cartGroup.MapGet("/{cartOwnerId}", async (MediatR.IMediator mediator, string cartOwnerId) =>
{
    var cart = await mediator.Send(new CartService.Application.Cart.Queries.GetCartQuery(cartOwnerId));
    return Results.Ok(cart ?? new CartService.Domain.Entities.ShoppingCart(cartOwnerId));
});

cartGroup.MapPost("/", async (MediatR.IMediator mediator, CartService.Application.Cart.Commands.UpdateCartCommand cmd) =>
{
    var updatedCart = await mediator.Send(cmd);
    return Results.Ok(updatedCart);
});

app.Run();
