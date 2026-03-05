using IdentityService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using IdentityService.Application;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IdentityService.Application.Interfaces.IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Configure MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

builder.Services.AddScoped<IdentityService.Application.Interfaces.ITokenService, IdentityService.Infrastructure.Services.TokenService>();

// Configure Authentication & Authorization
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

var authGroup = app.MapGroup("/api/identity");

authGroup.MapPost("/register", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.RegisterCommand cmd) =>
{
    try
    {
        var token = await mediator.Send(cmd);
        return Results.Ok(new { Token = token });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
});

authGroup.MapPost("/login", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.LoginCommand cmd) =>
{
    try
    {
        var token = await mediator.Send(cmd);
        return Results.Ok(new { Token = token });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
});

app.MapGet("/", () => "Identity Service is running.");

// Auto migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // We will catch exceptions here in production, but for local dev it's okay to run Migrate
    try
    {
        db.Database.Migrate();
    } 
    catch(Exception ex) 
    {
        Console.WriteLine($"DB Migration failed: {ex.Message}");
    }
}

app.Run();
