using BunBo.SharedKernel.Extensions;
using PromotionService.Application;
using PromotionService.Infrastructure;
using BunBo.SharedKernel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PromotionService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using System.Security.Claims;
using System.Text.Json.Serialization;
using PromotionService.Api.Middlewares;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

ThreadPool.SetMinThreads(500, 500);
builder.Host.AddSerilogLogging("PromotionService");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("voucher-validation", context =>
    {
        // Get IP from reverse proxy headers if available, otherwise connection IP
        var ip = context.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                 ?? context.Connection.RemoteIpAddress?.ToString() 
                 ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            Window = TimeSpan.FromMinutes(1),
            PermitLimit = 200, // 200 requests per minute per IP
            QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst,
            QueueLimit = 50
        });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút."
        }, token);
    };
});

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
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = "sub"
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
    x.AddConsumer<PromotionService.Infrastructure.Messaging.Consumers.OrderCreatedEventConsumer>();
    x.AddConsumer<PromotionService.Infrastructure.Messaging.Consumers.OrderStatusUpdatedEventConsumer>();

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

builder.Services.AddBunBoHealthChecks(builder.Configuration);

builder.Services.AddBunBoPrometheusMetrics();
var app = builder.Build();
app.UseBunBoPrometheusMetrics();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapBunBoHealthChecks();

var promotionGroup = app.MapGroup("/api/promotion");

// Admin APIs
promotionGroup.MapPost("/vouchers", async (MediatR.IMediator mediator, PromotionService.Application.Vouchers.Commands.CreateVoucherCommand cmd) =>
{
    var id = await mediator.Send(cmd);
    return Results.Ok(new { Id = id, Message = "Voucher created successfully." });
}).RequireAuthorization("Admin");

promotionGroup.MapPost("/vouchers/redeem", async (MediatR.IMediator mediator, Guid voucherId, ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst("sub")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var id = await mediator.Send(new PromotionService.Application.Vouchers.Commands.RedeemVoucherCommand(userId, voucherId));
    return Results.Ok(new { Id = id, Message = "Voucher redeemed successfully." });
}).RequireAuthorization();

promotionGroup.MapGet("/vouchers", async (MediatR.IMediator mediator, int skip = 0, int take = 50) =>
{
    var result = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetVouchersQuery(skip, take));
    return Results.Ok(result);
}).RequireAuthorization("Admin");

promotionGroup.MapPut("/vouchers/{id}", async (MediatR.IMediator mediator, Guid id, PromotionService.Application.Vouchers.Commands.UpdateVoucherCommand cmd) =>
{
    cmd.Id = id;
    var result = await mediator.Send(cmd);
    return result ? Results.Ok(new { Message = "Voucher updated successfully." }) : Results.NotFound();
}).RequireAuthorization("Admin");

promotionGroup.MapDelete("/vouchers/{id}", async (MediatR.IMediator mediator, Guid id) =>
{
    var result = await mediator.Send(new PromotionService.Application.Vouchers.Commands.DeleteVoucherCommand(id));
    return result ? Results.Ok(new { Message = "Voucher deleted successfully." }) : Results.NotFound();
}).RequireAuthorization("Admin");

promotionGroup.MapGet("/vouchers/active", async (MediatR.IMediator mediator) =>
{
    var vouchers = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetPublicVouchersQuery());
    return Results.Ok(vouchers);
}).RequireAuthorization();

// Client APIs
promotionGroup.MapPost("/vouchers/validate", async (MediatR.IMediator mediator, ValidateVoucherRequest req, ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst("sub")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var result = await mediator.Send(new PromotionService.Application.Vouchers.Queries.ValidateVoucherQuery(req.Code, userId, req.OrderValue));
    if (result.IsValid) return Results.Ok(result);
    return result.IsConflict ? Results.Conflict(result) : Results.BadRequest(result);
}).RequireAuthorization().RequireRateLimiting("voucher-validation");

promotionGroup.MapGet("/points", async (MediatR.IMediator mediator, ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst("sub")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var points = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetUserLoyaltyPointsQuery(userId));
    return Results.Ok(points);
}).RequireAuthorization();

promotionGroup.MapGet("/vouchers/my", async (MediatR.IMediator mediator, ClaimsPrincipal user) =>
{
    var userIdStr = user.FindFirst("sub")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userIdStr)) return Results.Unauthorized();
    
    var userId = Guid.Parse(userIdStr);
    var vouchers = await mediator.Send(new PromotionService.Application.Vouchers.Queries.GetUserVouchersQuery(userId));
    return Results.Ok(vouchers);
}).RequireAuthorization();

promotionGroup.MapGet("/health", () => Results.Ok(new { Status = "Healthy" }));

// Auto migrate database and seed data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    // Explicit migration check
    if (args.Contains("--migrate"))
    {
        try
        {
            Console.WriteLine("Applying Database Migrations...");
            db.Database.Migrate();
            Console.WriteLine("Migration completed successfully.");
            return; // Exit after migration
        } 
        catch(Exception ex) 
        {
            Console.WriteLine($"DB Migration failed: {ex.Message}");
            Environment.Exit(1);
        }
    }
}

app.Run();

public record ValidateVoucherRequest(string Code, decimal OrderValue);
