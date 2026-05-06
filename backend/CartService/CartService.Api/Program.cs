using CartService.Application;
using CartService.Application.Interfaces;
using CartService.Infrastructure.Repositories;
using StackExchange.Redis;
using BunBo.SharedKernel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CartService.Api.Middlewares;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

ThreadPool.SetMinThreads(500, 500);
builder.Host.AddSerilogLogging("CartService");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("cart-update", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 30; // 30 updates per minute per user is generous
        opt.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Bạn đang cập nhật giỏ hàng quá nhanh. Vui lòng chậm lại một chút."
        }, token);
    };
});

// Configure JWT Authentication (read secret, fail fast if missing)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"]
    ?? throw new InvalidOperationException("JwtSettings:Secret is not configured. Application cannot start.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "BunBoIdentity",
            ValidAudience = jwtSettings["Audience"] ?? "BunBoMicroservices",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// Configure Redis
var redisConnString = builder.Configuration.GetConnectionString("Redis");
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnString!));

builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ISyncCatalogClient, CartService.Infrastructure.SyncDataServices.Grpc.CatalogDataClient>();

// Configure gRPC Client
builder.Services.AddGrpcClient<CatalogService.Api.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
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

app.UseExceptionHandler();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Cart Service is running.");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Service = "CartService" }));

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
}).RequireRateLimiting("cart-update");

app.Run();
