using Microsoft.EntityFrameworkCore;
using OrderService.Application;
using OrderService.Application.Interfaces;
using OrderService.Application.Interfaces;
using OrderService.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Add MediatR
builder.Services.AddApplicationServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
