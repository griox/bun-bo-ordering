using BunBo.SharedKernel.Extensions;
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
using OrderService.Api.Middlewares;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

ThreadPool.SetMinThreads(500, 500);
builder.Host.AddSerilogLogging("OrderService");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JSON options to ignore circular references (Order -> OrderItems -> Order)
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("order-creation", opt =>
    {
        opt.Window = TimeSpan.FromSeconds(30);
        opt.PermitLimit = 500; // Tăng lên 500 để phục vụ load test
        opt.QueueLimit = 100;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Bạn đang đặt hàng quá nhanh. Vui lòng đợi 30 giây."
        }, token);
    };
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = "sub"
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});


// Configure Database
var orderConnStr = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(orderConnStr,
        npgsqlOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        }));

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
builder.Services.AddHostedService<OrderService.Api.BackgroundServices.DashboardCacheWorker>();

// Add Http Clients for external sync
builder.Services.AddHttpClient<ICartDataClient, OrderService.Infrastructure.SyncDataServices.Http.CartDataClient>(client => {
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<AppDbContext>(o =>
    {
        o.UsePostgres();
        o.UseBusOutbox();
        o.IsolationLevel = System.Data.IsolationLevel.ReadCommitted;
    });

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
    var success = await mediator.Send(cmd);
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

orderGroup.MapPost("/tables", async (MediatR.IMediator mediator, OrderService.Application.Tables.Commands.CreateTableCommand cmd) =>
{
    var id = await mediator.Send(cmd);
    return Results.Created($"/api/orders/tables/{id}", new { Id = id });
}).RequireAuthorization("Admin");

orderGroup.MapGet("/tables", async (MediatR.IMediator mediator) =>
{
    var tables = await mediator.Send(new OrderService.Application.Tables.Queries.GetAllTablesQuery());
    return Results.Ok(tables);
}).RequireAuthorization("Admin");

orderGroup.MapPut("/tables/{id:guid}", async (MediatR.IMediator mediator, Guid id, OrderService.Application.Tables.Commands.UpdateTableCommand cmd) =>
{
    if (id != cmd.Id) return Results.BadRequest("ID mismatch.");
    var success = await mediator.Send(cmd);
    return success ? Results.NoContent() : Results.NotFound();
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
    // Try to identify if the customer is logged in
    var userIdString = httpContext.User.FindFirst("sub")?.Value 
        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    
    if (Guid.TryParse(userIdString, out Guid customerId))
    {
        cmd = cmd with { CustomerId = customerId };
    }

    var id = await mediator.Send(cmd);
    return Results.Created($"/api/orders/{id}", new { Id = id });
}).RequireRateLimiting("order-creation");

orderGroup.MapGet("/{id:guid}", async (Guid id, MediatR.IMediator mediator) =>
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
orderGroup.MapGet("/unread", async (MediatR.IMediator mediator) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetUnreadOrdersQuery());
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapPost("/mark-read-by-table/{tableCode}", async (string tableCode, MediatR.IMediator mediator) =>
{
    var success = await mediator.Send(new OrderService.Application.Orders.Commands.MarkTableOrdersAsReadCommand(tableCode));
    return success ? Results.NoContent() : Results.NotFound();
}).RequireAuthorization("Admin");

orderGroup.MapGet("/", async (MediatR.IMediator mediator, int skip = 0, int take = 20, OrderStatus? status = null, DateTime? fromDate = null, DateTime? toDate = null, string? keyword = null, string? paymentMethod = null) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetAllOrdersQuery(skip, take, status, fromDate, toDate, keyword, paymentMethod));
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/stats", async (MediatR.IMediator mediator, [Microsoft.AspNetCore.Mvc.FromQuery] int weekOffset = 0) =>
{
    var result = await mediator.Send(new OrderService.Application.Orders.Queries.GetDashboardStatsQuery(ForceRefresh: false, WeekOffset: weekOffset));
    return Results.Ok(result);
}).RequireAuthorization("Admin");

orderGroup.MapGet("/customer/{customerId:guid}", async (Guid customerId, MediatR.IMediator mediator, int skip = 0, int take = 20) =>
{
    var orders = await mediator.Send(new OrderService.Application.Orders.Queries.GetOrdersByCustomerQuery(customerId, skip, take));
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

// Reorder preference endpoints
orderGroup.MapGet("/preferences/reorder", async (
    Microsoft.AspNetCore.Http.HttpContext httpContext,
    MediatR.IMediator mediator) =>
{
    var userIdClaim = httpContext.User.FindFirst("sub")
        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
    if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        return Results.Unauthorized();

    var preferredOrderId = await mediator.Send(
        new OrderService.Application.Orders.Queries.GetReorderPreferenceQuery(userId));
    return Results.Ok(new { preferredOrderId });
}).RequireAuthorization();

orderGroup.MapPut("/preferences/reorder", async (
    Microsoft.AspNetCore.Http.HttpContext httpContext,
    MediatR.IMediator mediator,
    SavePreferenceRequest body) =>
{
    var userIdClaim = httpContext.User.FindFirst("sub")
        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
    if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        return Results.Unauthorized();

    await mediator.Send(
        new OrderService.Application.Orders.Commands.SaveReorderPreferenceCommand(
            userId, body.PreferredOrderId));
    return Results.Ok();
}).RequireAuthorization();

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

record SavePreferenceRequest(Guid PreferredOrderId);
