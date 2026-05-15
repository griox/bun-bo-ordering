using BunBo.SharedKernel;
using Microsoft.AspNetCore.ResponseCompression;

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

var app = builder.Build();

app.UseResponseCompression();
app.UseCors(); // Must be before MapReverseProxy
app.UseWebSockets(); // Crucial for proxying SignalR WebSocket connections

app.MapReverseProxy();

app.MapGet("/", () => "API Gateway is running.");

app.Run();
