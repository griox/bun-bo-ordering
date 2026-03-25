using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MassTransit;
using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

// Configure SignalR with Redis Backplane
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
builder.Services.AddSignalR(options => {
    options.EnableDetailedErrors = true;
}).AddStackExchangeRedis(redisConnectionString, options => {
    options.Configuration.ChannelPrefix = "BunBoSignalR";
});

// Configure JWT Authentication (Critical for identifying Admin/Kitchen)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SuperSecretKeyForBunBoSystem1234567890";

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
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
    });
});

var app = builder.Build();

app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Realtime Service is running.");
app.MapHub<NotificationHub>("/hub/notifications");

app.Run();
