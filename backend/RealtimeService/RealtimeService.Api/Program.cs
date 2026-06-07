using BunBo.SharedKernel.Extensions;
using RealtimeService.Api.Middlewares;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MassTransit;
using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;
using BunBo.SharedKernel;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddSerilogLogging("RealtimeService");


builder.Services.AddEndpointsApiExplorer();

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting (Crucial for SignalR handshakes)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("signalr-hub", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 50; // Max 50 connections/handshakes per minute per IP/User
        opt.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Bạn đang kết nối quá nhanh. Vui lòng đợi một lát."
        }, token);
    };
});

// Configure SignalR with Redis Backplane
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSignalR(options => {
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(10);
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
}).AddStackExchangeRedis(redisConnectionString, options => {
    options.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("BunBoSignalR");
});

// Configure JWT Authentication (Critical for identifying Admin/Kitchen)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret is missing from configuration.");

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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

    // Essential for SignalR WebSockets as headers aren't available during initial handshake
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hub"))
            {
                context.Token = accessToken;
            }
            else if (context.Request.Cookies.TryGetValue("accessToken", out var cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                         ?? new[] { "http://localhost:3000", "http://localhost:3001" };
                         
    options.AddPolicy("CorsPolicy", builder => builder
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

builder.Services.AddHttpClient("OrderApiClient", client =>
{
    var orderUrl = builder.Configuration["Services:OrderService"] ?? "http://order-service:8080";
    client.BaseAddress = new Uri(orderUrl);
});

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderCreatedEventConsumer>();
    x.AddConsumer<PaymentCompletedEventConsumer>();
    x.AddConsumer<OrderStatusUpdatedEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        cfg.ReceiveEndpoint("order_created_queue", e => e.ConfigureConsumer<OrderCreatedEventConsumer>(context));
        cfg.ReceiveEndpoint("payment_completed_realtime_queue", e => e.ConfigureConsumer<PaymentCompletedEventConsumer>(context));
        cfg.ReceiveEndpoint("order_status_updated_queue", e => e.ConfigureConsumer<OrderStatusUpdatedEventConsumer>(context));
    });
});

builder.Services.AddBunBoHealthChecks(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("CorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapBunBoHealthChecks();
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Service = "RealtimeService" }));

app.MapHub<NotificationHub>("/hub/notifications").RequireRateLimiting("signalr-hub");

app.Run();
