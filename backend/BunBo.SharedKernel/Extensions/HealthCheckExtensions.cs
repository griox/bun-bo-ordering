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
        
        // 1. Check PostgreSQL Connection — dùng pooled connection qua PgBouncer
        var postgresConn = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(postgresConn))
        {
            // QUAN TRỌNG: KHÔNG dùng Pooling=false — sẽ tạo raw TCP connection bypass PgBouncer
            // Khi PostgreSQL bận dưới load, auth handshake timeout → readiness probe fail → pod bị xóa khỏi LB
            var hcConn = postgresConn;
            if (!hcConn.EndsWith(";")) hcConn += ";";
            
            // Chỉ override timeout, GIỮ pooling mặc định (true)
            hcConn = System.Text.RegularExpressions.Regex.Replace(hcConn, @"(?i)timeout\s*=\s*[^;]+;?", "");
            hcConn = System.Text.RegularExpressions.Regex.Replace(hcConn, @"(?i)command\s*timeout\s*=\s*[^;]+;?", "");
            hcConn += "Timeout=5;Command Timeout=5;";
            builder.AddNpgSql(hcConn, name: "postgres", tags: new[] { "db", "postgresql" });
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
        // 1. Liveness Probe: Chạy siêu nhẹ, KHÔNG check DB, dùng để K8s biết tiến trình chưa sập
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false, // Bỏ qua tất cả external checks
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        // 2. Readiness Probe: Deep Health Check (Postgres, Redis, RMQ)
        // K8s dùng cái này để biết khi nào thì gửi traffic tới Pod
        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = _ => true, // Chạy tất cả các checks
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        // Giữ lại endpoint /health cũ tạm thời để tương thích ngược nếu cần
        endpoints.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });
        
        // Also map standard / to retain simple compatibility temporarily if needed
        endpoints.MapGet("/", () => "Service is running correctly.");
        
        return endpoints;
    }
}
