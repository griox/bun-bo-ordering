using MassTransit;
using Microsoft.EntityFrameworkCore;
using OrderService.Application;
using OrderService.Application.Interfaces;
using OrderService.Infrastructure.Data;
using OrderService.Domain.Enums;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BunBo.SharedKernel;
using StackExchange.Redis;
using OrderService.Infrastructure.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Host.AddSerilogLogging("OrderService");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JSON options to ignore circular references (Order -> OrderItems -> Order)
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// Configure JWT Authentication (fail fast if secret is missing)
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});


// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Configure Redis
var redisConnString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnString));
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Add CORS: restrict to configured allowed origins only
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:3000", "http://localhost:8000" };

    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add MediatR
builder.Services.AddApplicationServices();

// Add Http Clients for external sync
builder.Services.AddHttpClient<ICartDataClient, OrderService.Infrastructure.SyncDataServices.Http.CartDataClient>(client => {
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<OrderService.Application.Messaging.PaymentCompletedEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitMqHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Order Service is running.");

var orderGroup = app.MapGroup("/api/orders");

// Table Sessions endpoints
orderGroup.MapPost("/tables/{tableId}/scan", async (Guid tableId, MediatR.IMediator mediator) =>
{
    var command = new OrderService.Application.TableSessions.Commands.OpenSessionCommand { TableId = tableId };
    var result = await mediator.Send(command);
    return Results.Ok(result);
});

orderGroup.MapGet("/tables/{tableId}", async (Guid tableId, MediatR.IMediator mediator) =>
{
    var query = new OrderService.Application.TableSessions.Queries.GetTableQuery { TableId = tableId };
    var result = await mediator.Send(query);
    return result != null ? Results.Ok(result) : Results.NotFound();
});

// Admin Table Management - Move specific routes before generic {id}
orderGroup.MapPost("/tables/positions", async (MediatR.IMediator mediator, OrderService.Application.Tables.Commands.UpdateTablePositionsCommand cmd) =>
{
    try 
    {
        var success = await mediator.Send(cmd);
        return success ? Results.NoContent() : Results.NotFound();
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
}).RequireAuthorization("Admin");

orderGroup.MapPost("/tables", async (MediatR.IMediator mediator, OrderService.Application.Tables.Commands.CreateTableCommand cmd) =>
{
    try
    {
        var id = await mediator.Send(cmd);
        return Results.Created($"/api/orders/tables/{id}", new { Id = id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
}).RequireAuthorization("Admin");

orderGroup.MapGet("/tables", async (MediatR.IMediator mediator) =>
{
    var tables = await mediator.Send(new OrderService.Application.Tables.Queries.GetAllTablesQuery());
    return Results.Ok(tables);
}).RequireAuthorization("Admin");

orderGroup.MapPut("/tables/{id:guid}", async (MediatR.IMediator mediator, Guid id, OrderService.Application.Tables.Commands.UpdateTableCommand cmd) =>
{
    if (id != cmd.Id) return Results.BadRequest("ID mismatch.");
    try
    {
        var success = await mediator.Send(cmd);
        return success ? Results.NoContent() : Results.NotFound();
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
}).RequireAuthorization("Admin");

orderGroup.MapPatch("/tables/{id:guid}/position", async (MediatR.IMediator mediator, Guid id, [Microsoft.AspNetCore.Mvc.FromQuery] int posX, [Microsoft.AspNetCore.Mvc.FromQuery] int posY) =>
{
    var success = await mediator.Send(new OrderService.Application.Tables.Commands.UpdateTablePositionCommand(id, posX, posY));
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

orderGroup.MapDelete("/tables/{id:guid}", async (MediatR.IMediator mediator, Guid id) =>
{
    var success = await mediator.Send(new OrderService.Application.Tables.Commands.DeleteTableCommand(id));
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");


orderGroup.MapPost("/", async (Microsoft.AspNetCore.Http.HttpContext httpContext, MediatR.IMediator mediator, OrderService.Application.Orders.Commands.CreateOrderCommand cmd) =>
{
    try
    {
        // Try to identify if the customer is logged in
        // In JWT, the user's ID is typically stored in the NameIdentifier claim
        var userIdString = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (Guid.TryParse(userIdString, out Guid customerId))
        {
            cmd = cmd with { CustomerId = customerId };
        }

        var id = await mediator.Send(cmd);
        return Results.Created($"/api/orders/{id}", new { Id = id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
});

orderGroup.MapGet("/{id}", async (Guid id, MediatR.IMediator mediator) =>
{
    var order = await mediator.Send(new OrderService.Application.Orders.Queries.GetOrderByIdQuery(id));
    return order != null ? Results.Ok(order) : Results.NotFound();
});

orderGroup.MapGet("/tablesession/{sessionId}", async (Guid sessionId, MediatR.IMediator mediator) =>
{
    var orders = await mediator.Send(new OrderService.Application.Orders.Queries.GetTableSessionOrdersQuery(sessionId));
    return Results.Ok(orders);
});

// Admin Dashboard & History
orderGroup.MapGet("/", async (MediatR.IMediator mediator, int skip = 0, int take = 50, OrderStatus? status = null) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetAllOrdersQuery(skip, take, status));
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/{id:guid}", async (Guid id, MediatR.IMediator mediator) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetOrderByIdQuery(id));
    return result is null ? Results.NotFound() : Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/stats", async (MediatR.IMediator mediator) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetDashboardStatsQuery());
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/customer/{customerId:guid}", async (Guid customerId, MediatR.IMediator mediator) =>
{
    var orders = await mediator.Send(new OrderService.Application.Orders.Queries.GetOrdersByCustomerQuery(customerId));
    return Results.Ok(orders);
}).RequireAuthorization();

orderGroup.MapGet("/customer/{customerId:guid}/recent", async (Guid customerId, MediatR.IMediator mediator) =>
{
    var items = await mediator.Send(new OrderService.Application.Orders.Queries.GetRecentOrderForCustomerQuery(customerId));
    return Results.Ok(items);
}).RequireAuthorization();

orderGroup.MapPut("/{id}/status", async (Guid id, OrderService.Domain.Enums.OrderStatus status, MediatR.IMediator mediator) =>
{
    var cmd = new OrderService.Application.Orders.Commands.UpdateOrderStatusCommand(id, status);
    var success = await mediator.Send(cmd);
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

// Auto migrate database on startup and seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();

        // Seed Tables for Testing QR
        if (!db.RestaurantTables.Any())
        {
            db.RestaurantTables.AddRange(
                new OrderService.Domain.Entities.RestaurantTable("T1", "Bàn VIP 1", 50, 50),
                new OrderService.Domain.Entities.RestaurantTable("T2", "Bàn VIP 2", 200, 50),
                new OrderService.Domain.Entities.RestaurantTable("T3", "Bàn Thường 3", 50, 150)
            );
            db.SaveChanges();
            Console.WriteLine("Mock Tables seeded.");
        }
    } 
    catch(Exception ex) 
    {
        Console.WriteLine($"DB Migration failed: {ex.Message}");
    }
}

app.Run();
