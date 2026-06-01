using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using System;

namespace BunBo.SharedKernel.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddBunBoHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        var builder = services.AddHealthChecks();
        
        // 1. Check PostgreSQL Connection
        var postgresConn = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(postgresConn))
        {
            builder.AddNpgSql(postgresConn, name: "postgres", tags: new[] { "db", "postgresql" });
        }
        
        // 2. Check Redis Connection
        var redisConn = configuration.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConn))
        {
            builder.AddRedis(redisConn, name: "redis", tags: new[] { "cache", "redis" });
        }
        
        // 3. Check RabbitMQ Connection
        var rabbitHost = configuration["RabbitMq:Host"];
        if (!string.IsNullOrEmpty(rabbitHost))
        {
            var user = configuration["RabbitMq:Username"] ?? "guest";
            var pass = configuration["RabbitMq:Password"] ?? "guest";
            // Format: amqp://user:pass@host:5672
            var rabbitConnStr = $"amqp://{user}:{pass}@{rabbitHost}:5672";
            builder.AddRabbitMQ(rabbitConnectionString: rabbitConnStr, name: "rabbitmq", tags: new[] { "queue", "rabbitmq" });
        }

        return services;
    }

    public static IEndpointRouteBuilder MapBunBoHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });
        
        // Also map standard / to retain simple compatibility temporarily if needed
        endpoints.MapGet("/", () => "Service is running correctly.");
        
        return endpoints;
    }
}
