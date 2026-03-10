using CatalogService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using CatalogService.Application;
using CatalogService.Application.Interfaces;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to support HTTP/2 for gRPC globally
builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureEndpointDefaults(o => o.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1AndHttp2);
});
// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"] ?? "SuperSecretKeyForBunBoSystem1234567890"; // Fallback to same default as IdentityService

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

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Catalog Service is running.");

var catalogGroup = app.MapGroup("/api/catalog");

// Category Endpoints
catalogGroup.MapPost("/categories", async (MediatR.IMediator mediator, CatalogService.Application.Categories.Commands.CreateCategoryCommand cmd) =>
{
    var id = await mediator.Send(cmd);
    return Results.Created($"/api/catalog/categories/{id}", new { Id = id });
}).RequireAuthorization("Admin");

catalogGroup.MapGet("/categories", async (MediatR.IMediator mediator) =>
{
    var categories = await mediator.Send(new CatalogService.Application.Categories.Queries.GetAllCategoriesQuery());
    return Results.Ok(categories);
});

catalogGroup.MapPut("/categories/{id}", async (MediatR.IMediator mediator, int id, CatalogService.Application.Categories.Commands.UpdateCategoryCommand cmd) =>
{
    if (id != cmd.Id) return Results.BadRequest("ID mismatch");
    var success = await mediator.Send(cmd);
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

catalogGroup.MapDelete("/categories/{id}", async (MediatR.IMediator mediator, int id) =>
{
    var success = await mediator.Send(new CatalogService.Application.Categories.Commands.DeleteCategoryCommand(id));
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

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
}).RequireAuthorization("Admin");

catalogGroup.MapGet("/foods/category/{categoryId}", async (MediatR.IMediator mediator, int categoryId) =>
{
    var foods = await mediator.Send(new CatalogService.Application.Foods.Queries.GetFoodsByCategoryQuery(categoryId));
    return Results.Ok(foods);
});

catalogGroup.MapPut("/foods/{id}", async (MediatR.IMediator mediator, Guid id, CatalogService.Application.Foods.Commands.UpdateFoodCommand cmd) =>
{
    if (id != cmd.Id) return Results.BadRequest("ID mismatch");
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

catalogGroup.MapDelete("/foods/{id}", async (MediatR.IMediator mediator, Guid id) =>
{
    var success = await mediator.Send(new CatalogService.Application.Foods.Commands.DeleteFoodCommand(id));
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

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
