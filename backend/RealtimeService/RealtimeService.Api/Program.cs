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

// Configure CORS for Frontend
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                         ?? new[] { "http://localhost:3000" };
                         
    options.AddPolicy("CorsPolicy", builder => builder
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

// Add HttpClient for calling OrderService
builder.Services.AddHttpClient("OrderApiClient", client =>
{
    var orderUrl = builder.Configuration["Services:OrderService"] ?? "http://order-service:8080";
    client.BaseAddress = new Uri(orderUrl);
});

// Configure MassTransit to consume RabbitMQ events
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

        // Register the consumer on a specific queue
        cfg.ReceiveEndpoint("order_created_queue", e =>
        {
            e.ConfigureConsumer<OrderCreatedEventConsumer>(context);
        });

        cfg.ReceiveEndpoint("payment_completed_realtime_queue", e =>
        {
            e.ConfigureConsumer<PaymentCompletedEventConsumer>(context);
        });
    });
});

var app = builder.Build();

app.UseCors("CorsPolicy");

app.MapGet("/", () => "Realtime Service is running on Port 5005.");

// Map SignalR Hub
app.MapHub<NotificationHub>("/hub/notifications");

app.Run();
