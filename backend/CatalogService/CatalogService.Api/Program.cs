using CatalogService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using CatalogService.Application;
using CatalogService.Application.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure gRPC
builder.Services.AddGrpc();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Configure MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => "Catalog Service is running.");

var catalogGroup = app.MapGroup("/api/catalog");

// Category Endpoints
catalogGroup.MapPost("/categories", async (MediatR.IMediator mediator, CatalogService.Application.Categories.Commands.CreateCategoryCommand cmd) =>
{
    var id = await mediator.Send(cmd);
    return Results.Created($"/api/catalog/categories/{id}", new { Id = id });
});

catalogGroup.MapGet("/categories", async (MediatR.IMediator mediator) =>
{
    var categories = await mediator.Send(new CatalogService.Application.Categories.Queries.GetAllCategoriesQuery());
    return Results.Ok(categories);
});

// Food Endpoints
catalogGroup.MapPost("/foods", async (MediatR.IMediator mediator, CatalogService.Application.Foods.Commands.CreateFoodCommand cmd) =>
{
    try
    {
        var id = await mediator.Send(cmd);
        return Results.Created($"/api/catalog/foods/{id}", new { Id = id });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = ex.Message });
    }
});

catalogGroup.MapGet("/foods/category/{categoryId}", async (MediatR.IMediator mediator, Guid categoryId) =>
{
    var foods = await mediator.Send(new CatalogService.Application.Foods.Queries.GetFoodsByCategoryQuery(categoryId));
    return Results.Ok(foods);
});

// Auto migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
    } 
    catch(Exception ex) 
    {
        Console.WriteLine($"DB Migration failed: {ex.Message}");
    }
}

app.MapGrpcService<CatalogService.Api.GrpcServices.CatalogGrpcService>();

app.Run();
