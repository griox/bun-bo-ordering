using BunBo.SharedKernel.Extensions;
using BunBo.SharedKernel;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Pre-warm ThreadPool để Kestrel có đủ luồng xử lý tải cao ngay từ đầu
ThreadPool.SetMinThreads(200, 200);

builder.Host.AddSerilogLogging("ApiGateway");

// Response Compression — giảm bandwidth trả về cho client
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});

// Add Yarp reverse proxy với HttpClient tối ưu cho downstream services
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .ConfigureHttpClient((context, handler) =>
    {
        handler.EnableMultipleHttp2Connections = true;
        handler.MaxConnectionsPerServer = 200;
        handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2);
        handler.PooledConnectionLifetime = TimeSpan.FromMinutes(5);
    });

// Configure Output Caching
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Expire(TimeSpan.FromSeconds(10)));
    options.AddPolicy("CatalogCache", builder => builder.Expire(TimeSpan.FromMinutes(5)).SetVaryByQuery("*"));
});

// Configure Rate Limiting
var rateLimitingConfig = builder.Configuration.GetSection("RateLimiting");
var permitLimit = rateLimitingConfig.GetValue<int>("PermitLimit", 500);
var queueLimit = rateLimitingConfig.GetValue<int>("QueueLimit", 100);
var windowMinutes = rateLimitingConfig.GetValue<int>("WindowMinutes", 1);

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = permitLimit,
                QueueLimit = queueLimit,
                Window = TimeSpan.FromMinutes(windowMinutes)
            }));
            
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new { Message = "Too many requests. Please try again later." }, token);
    };
});

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddBunBoHealthChecks(builder.Configuration);

var app = builder.Build();

app.UseResponseCompression();
app.UseCors(); // Must be before MapReverseProxy
app.UseOutputCache();
app.UseRateLimiter();
app.UseWebSockets(); // Crucial for proxying SignalR WebSocket connections

app.MapReverseProxy();

app.MapGet("/", () => "API Gateway is running.");

app.Run();
