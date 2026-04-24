using PromotionService.Application;
using PromotionService.Infrastructure;
using BunBo.SharedKernel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PromotionService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using MS = Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddSerilogLogging("PromotionService");

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            RoleClaimType = ClaimTypes.Role
        };
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"[JWT Error] Authentication failed: {context.Exception}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"[JWT Success] Token validated successfully for {context.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                Console.WriteLine($"[JWT Info] Token received: {context.Token?.Substring(0, Math.Min(10, context.Token?.Length ?? 0))}...");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

// Configure Layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<PromotionService.Infrastructure.Messaging.Consumers.PaymentCompletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitHost, "/", h =>
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

app.MapGet("/", () => "Promotion Service is running.");

var promotionGroup = app.MapGroup("/api/promotion");

// Admin APIs
promotionGroup.MapPost("/vouchers", async (MediatR.IMediator mediator, PromotionService.Application.Vouchers.Commands.CreateVoucherCommand cmd) =>
{
    try
    {
        var id = await mediator.Send(cmd);
        return Results.Ok(new { Id = id, Message = "Voucher created successfully." });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
}).RequireAuthorization("Admin");

promotionGroup.MapGet("/vouchers", async (MediatR.IMediator mediator) =>
{
    var vouchers = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetVouchersQuery());
    return Results.Ok(vouchers);
}).RequireAuthorization("Admin");

// Client APIs
promotionGroup.MapPost("/vouchers/validate", async (MediatR.IMediator mediator, string code, decimal amount, System.Security.Claims.ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var result = await mediator.Send(new PromotionService.Application.Vouchers.Queries.ValidateVoucherQuery(code, userId, amount));
    
    return result.IsValid ? Results.Ok(result) : Results.BadRequest(result);
}).RequireAuthorization();

promotionGroup.MapGet("/points", async (MediatR.IMediator mediator, System.Security.Claims.ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var points = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetUserLoyaltyPointsQuery(userId));
    return Results.Ok(points);
}).RequireAuthorization();

promotionGroup.MapGet("/health", () => Results.Ok(new { Status = "Healthy" }));

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

app.Run();
