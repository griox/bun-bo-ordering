using NotificationService.Api.Consumers;
using NotificationService.Api.Services;
using MassTransit;
using BunBo.SharedKernel;

var builder = WebApplication.CreateBuilder(args);

// Centralized Logging
builder.Host.AddSerilogLogging("NotificationService");

builder.Services.AddEndpointsApiExplorer();

// Dependency Injection
builder.Services.AddScoped<IEmailService, EmailService>();

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<UserRegisteredEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        // Unique queue for user registration notifications
        cfg.ReceiveEndpoint("user_registered_email_queue", e =>
        {
            e.ConfigureConsumer<UserRegisteredEventConsumer>(context);
            
            // Retries for transient SMTP errors
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
        });
    });
});

var app = builder.Build();

app.MapGet("/", () => "Notification Service is running correctly.");

app.Run();
