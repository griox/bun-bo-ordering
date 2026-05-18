using IdentityService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using IdentityService.Application;
using BunBo.SharedKernel;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

ThreadPool.SetMinThreads(500, 500);
builder.Host.AddSerilogLogging("IdentityService");


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Application Services
builder.Services.AddApplication();

// Configure Global Exception Handling
builder.Services.AddExceptionHandler<IdentityService.Api.Middlewares.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 15; // Increased slightly for better UX
        opt.QueueLimit = 0;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            Message = "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút."
        }, token);
    };
});

// Configure Database
var identityConnStr = builder.Configuration.GetConnectionString("DefaultConnection") + ";MaxPoolSize=15;MinPoolSize=2;Connection Lifetime=300;";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(identityConnStr,
        npgsqlOptionsAction: sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorCodesToAdd: null);
        }));

builder.Services.AddScoped<IdentityService.Application.Interfaces.IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Configure Caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
});

builder.Services.AddHttpClient<IdentityService.Infrastructure.Services.GoogleAuthService>();
builder.Services.AddScoped<IdentityService.Application.Interfaces.IGoogleAuthService, IdentityService.Infrastructure.Services.GoogleAuthService>();

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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<IdentityService.Application.Consumers.VoucherCreatedEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        cfg.ReceiveEndpoint("voucher_created_identity_queue", e =>
        {
            e.ConfigureConsumer<IdentityService.Application.Consumers.VoucherCreatedEventConsumer>(context);
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
app.UseRateLimiter();
app.UseExceptionHandler();

var authGroup = app.MapGroup("/api/identity");

authGroup.MapPost("/register", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.RegisterCommand cmd) =>
{
    var userId = await mediator.Send(cmd);
    return Results.Ok(new { UserId = userId, Message = "Đăng ký thành công. Vui lòng đăng nhập." });
}).RequireRateLimiting("auth");

authGroup.MapPost("/login", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.LoginCommand cmd) =>
{
    var result = await mediator.Send(cmd);
    return Results.Ok(result);
}).RequireRateLimiting("auth");

authGroup.MapPost("/refresh-token", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.RefreshTokenCommand cmd) =>
{
    var result = await mediator.Send(cmd);
    return Results.Ok(result);
}).RequireRateLimiting("auth");

authGroup.MapPost("/google-login", async (MediatR.IMediator mediator, IdentityService.Application.Auth.Commands.GoogleLoginCommand cmd) =>
{
    var result = await mediator.Send(cmd);
    return Results.Ok(result);
}).RequireRateLimiting("auth");

authGroup.MapPost("/forgot-password", async (MediatR.IMediator mediator, IdentityService.Application.Users.Commands.ForgotPasswordCommand cmd) =>
{
    await mediator.Send(cmd);
    return Results.Ok(new { Message = "Nếu email tồn tại, mã OTP đã được gửi." });
}).RequireRateLimiting("auth");

authGroup.MapPost("/verify-otp", async (MediatR.IMediator mediator, IdentityService.Application.Users.Commands.VerifyOtpCommand cmd) =>
{
    var isValid = await mediator.Send(cmd);
    if (!isValid)
    {
        throw new DomainException("Mã OTP không hợp lệ hoặc đã hết hạn.");
    }
    return Results.Ok(new { Message = "Mã OTP hợp lệ." });
}).RequireRateLimiting("auth");

authGroup.MapPost("/reset-password", async (MediatR.IMediator mediator, IdentityService.Application.Users.Commands.ResetPasswordCommand cmd) =>
{
    await mediator.Send(cmd);
    return Results.Ok(new { Message = "Mật khẩu đã được đặt lại thành công." });
}).RequireRateLimiting("auth");

authGroup.MapPost("/logout", async (MediatR.IMediator mediator, System.Security.Claims.ClaimsPrincipal user) =>
{
    var userIdClaim = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    if (Guid.TryParse(userIdClaim, out var userId))
    {
        await mediator.Send(new IdentityService.Application.Auth.Commands.LogoutCommand(userId));
    }
    return Results.Ok(new { Message = "Đăng xuất thành công và token đã bị hủy." });
}).RequireAuthorization();

authGroup.MapGet("/users", async (int? pageNumber, int? pageSize, string? searchTerm, MediatR.IMediator mediator) =>
{
    var users = await mediator.Send(new IdentityService.Application.Users.Queries.GetAllUsersQuery(pageNumber ?? 1, pageSize ?? 10, searchTerm));
    return Results.Ok(users);
}).RequireAuthorization("Admin");

authGroup.MapGet("/users/{id:guid}", async (Guid id, MediatR.IMediator mediator) =>
{
    var user = await mediator.Send(new IdentityService.Application.Users.Queries.GetUserByIdQuery(id));
    return user is null ? Results.NotFound() : Results.Ok(user);
}).RequireAuthorization();

authGroup.MapPost("/users/{id:guid}/blacklist", async (Guid id, string reason, MediatR.IMediator mediator) =>
{
    await mediator.Send(new IdentityService.Application.Users.Commands.BlacklistUserCommand(id, reason));
    return Results.Ok(new { Message = "User blacklisted successfully" });
}).RequireAuthorization("Admin");

authGroup.MapPost("/users/{id:guid}/revoke-all", async (Guid id, MediatR.IMediator mediator) =>
{
    var success = await mediator.Send(new IdentityService.Application.Auth.Commands.RevokeAllTokensCommand(id));
    return success ? Results.Ok(new { Message = "Đã thu hồi toàn bộ token của người dùng này." }) : Results.NotFound();
}).RequireAuthorization("Admin");

authGroup.MapDelete("/users/{id:guid}/blacklist", async (Guid id, MediatR.IMediator mediator) =>
{
    await mediator.Send(new IdentityService.Application.Users.Commands.RemoveBlacklistCommand(id));
    return Results.Ok(new { Message = "User removed from blacklist successfully" });
}).RequireAuthorization("Admin");

authGroup.MapDelete("/users/{id:guid}", async (Guid id, MediatR.IMediator mediator) =>
{
    await mediator.Send(new IdentityService.Application.Users.Commands.DeleteUserCommand(id));
    return Results.Ok(new { Message = "User deleted successfully" });
}).RequireAuthorization("Admin");

authGroup.Map("{**catchall}", (string catchall, HttpContext context, ILogger<Program> logger) =>
{
    logger.LogWarning("Request to unmatched route: {Method} {Path}", context.Request.Method, context.Request.Path);
    return Results.NotFound(new { Message = "Route not found", Path = context.Request.Path, Method = context.Request.Method });
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

        // Seed Admin User if not exists
        if (!db.Users.Any(u => u.Role == "Admin"))
        {
            var adminUser = builder.Configuration["ADMIN_USER"] ?? "admin";
            var adminEmail = builder.Configuration["ADMIN_EMAIL"] ?? "admin@bunbo.com";
            var adminPassword = builder.Configuration["ADMIN_PASSWORD"] ?? "Admin@123";

            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<IdentityService.Domain.Entities.User>();
            var user = new IdentityService.Domain.Entities.User(adminUser, adminEmail, "", "Admin");
            var hash = passwordHasher.HashPassword(user, adminPassword);
            user.UpdatePassword(hash);

            db.Users.Add(user);
            db.SaveChanges();
            Console.WriteLine($"Admin user seeded: {adminUser} ({adminEmail})");
        }
    } 
    catch(Exception ex) 
    {
        Console.WriteLine($"DB Migration/Seeding failed: {ex.Message}");
    }
}

app.Run();

public partial class Program { }
