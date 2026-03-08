using MassTransit;
using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

// Configure SignalR with Redis Backplane (Allows scaling out multiple instances of RealtimeService)
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
builder.Services.AddSignalR().AddStackExchangeRedis(redisConnectionString, options => {
    options.Configuration.ChannelPrefix = "BunBoSignalR";
});

// Configure CORS for Frontend (Next.js)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder => builder
        .WithOrigins("http://localhost:3000")
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

// Configure MassTransit to consume RabbitMQ events
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderCreatedEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        // Register the consumer on a specific queue
        cfg.ReceiveEndpoint("order_created_queue", e =>
        {
            e.ConfigureConsumer<OrderCreatedEventConsumer>(context);
        });
    });
});

var app = builder.Build();

app.UseCors("CorsPolicy");

app.MapGet("/", () => "Realtime Service is running on Port 5005.");

// Map SignalR Hub
app.MapHub<NotificationHub>("/hub/notifications");

app.Run();
