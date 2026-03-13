using MassTransit;
using Microsoft.EntityFrameworkCore;
using OrderService.Application;
using OrderService.Application.Interfaces;
using OrderService.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SuperSecretKeyForBunBoSystem1234567890";

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

// Add MediatR
builder.Services.AddApplicationServices();

// Add Http Clients for external sync
builder.Services.AddHttpClient<ICartDataClient, OrderService.Infrastructure.SyncDataServices.Http.CartDataClient>();

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitMqHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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

// Admin Table Management
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

orderGroup.MapPut("/tables/{id}", async (MediatR.IMediator mediator, Guid id, string tableCode, string name) =>
{
    try
    {
        var success = await mediator.Send(new OrderService.Application.Tables.Commands.UpdateTableCommand(id, tableCode, name));
        return success ? Results.NoContent() : Results.NotFound();
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
}).RequireAuthorization("Admin");

orderGroup.MapDelete("/tables/{id}", async (MediatR.IMediator mediator, Guid id) =>
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
orderGroup.MapGet("/", async (MediatR.IMediator mediator, int skip = 0, int take = 50) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetAllOrdersQuery(skip, take));
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/stats", async (MediatR.IMediator mediator) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetDashboardStatsQuery());
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapPut("/{id}/status", async (Guid id, OrderService.Domain.Enums.OrderStatus status, MediatR.IMediator mediator) =>
{
    var cmd = new OrderService.Application.Orders.Commands.UpdateOrderStatusCommand(id, status);
    var success = await mediator.Send(cmd);
    return success ? Results.NoContent() : Results.NotFound();
});

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
                new OrderService.Domain.Entities.RestaurantTable("T1", "Bàn VIP 1"),
                new OrderService.Domain.Entities.RestaurantTable("T2", "Bàn VIP 2"),
                new OrderService.Domain.Entities.RestaurantTable("T3", "Bàn Thường 3")
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
