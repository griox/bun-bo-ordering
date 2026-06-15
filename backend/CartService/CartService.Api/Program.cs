using BunBo.SharedKernel.Extensions;
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
using Grpc.Net.Client;
using Grpc.Core;

var builder = WebApplication.CreateBuilder(args);

ThreadPool.SetMinThreads(200, 200);
builder.Host.AddSerilogLogging("CartService");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting — chỉ chặn abuse thực sự, không chặn load test
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("cart-update", context =>
    {
        var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                 ?? context.Connection.RemoteIpAddress?.ToString() 
                 ?? "unknown";

        var permitLimit = builder.Configuration.GetValue<int>("RateLimiting:PermitLimit", 3000);
        var queueLimit = builder.Configuration.GetValue<int>("RateLimiting:QueueLimit", 100);

        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            Window = TimeSpan.FromSeconds(60),
            PermitLimit = permitLimit,
            QueueLimit = queueLimit
        });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Hệ thống đang bận. Vui lòng thử lại sau."
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = "sub"
        };
    });

builder.Services.AddAuthorization();

// Configure Redis — cấu hình timeout và retry để chịu tải cao
var redisConnString = builder.Configuration.GetConnectionString("Redis");
var redisOptions = ConfigurationOptions.Parse(redisConnString!);
redisOptions.ConnectTimeout = 5000;       // 5s để thiết lập kết nối
redisOptions.SyncTimeout = 3000;          // 3s cho sync ops
redisOptions.AsyncTimeout = 3000;         // 3s cho async ops
redisOptions.ConnectRetry = 3;            // Retry kết nối 3 lần trước khi từ bỏ
redisOptions.ReconnectRetryPolicy = new ExponentialRetry(5000); // Backoff tối đa 5s giữa các lần retry
redisOptions.AbortOnConnectFail = false;  // Không crash app khi Redis tạm thời mất kết nối
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisOptions));

builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ISyncCatalogClient, CartService.Infrastructure.SyncDataServices.Grpc.CatalogDataClient>();

// Configure gRPC Client — có timeout và retry để tránh treo request khi CatalogService bận
builder.Services.AddGrpcClient<CatalogService.Api.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    o.Address = new Uri(builder.Configuration["GrpcSettings:CatalogUrl"]!);
})
.ConfigureChannel(o =>
{
    // Tối đa 200 kết nối HTTP/2 song song đến CatalogService
    o.MaxReceiveMessageSize = 4 * 1024 * 1024; // 4MB
    o.HttpHandler = new SocketsHttpHandler
    {
        EnableMultipleHttp2Connections = true,      // Tái sử dụng connection thay vì mở mới
        PooledConnectionLifetime = TimeSpan.FromMinutes(2), // BẮT BUỘC TRONG K8S: Tránh cache DNS cũ khi CatalogService restart
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(5),
        KeepAlivePingDelay = TimeSpan.FromSeconds(30),
        KeepAlivePingTimeout = TimeSpan.FromSeconds(10),
    };
});

// Configure MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddBunBoHealthChecks(builder.Configuration);

builder.Services.AddBunBoPrometheusMetrics();
var app = builder.Build();
app.UseBunBoPrometheusMetrics();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapBunBoHealthChecks();
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
