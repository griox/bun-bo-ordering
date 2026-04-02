using BunBo.SharedKernel;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddSerilogLogging("ApiGateway");


// Add Yarp reverse proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors(); // Must be before MapReverseProxy

app.MapReverseProxy();

app.MapGet("/", () => "API Gateway is running.");

app.Run();
