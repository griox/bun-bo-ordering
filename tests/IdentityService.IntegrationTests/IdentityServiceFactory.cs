using IdentityService.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MassTransit;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace IdentityService.IntegrationTests;

public class IdentityServiceFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RabbitMq:Host"] = "localhost",
                ["RabbitMq:Username"] = "guest",
                ["RabbitMq:Password"] = "guest",
                ["Redis"] = "localhost:6379",
                ["JwtSettings:Secret"] = "VeryVerySecretKeyForTestingPurposesOnly123!",
                ["JwtSettings:Issuer"] = "IdentityService",
                ["JwtSettings:Audience"] = "BunBoApp"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing AppDbContext registration
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

            if (dbDescriptor != null)
            {
                services.Remove(dbDescriptor);
            }

            // Remove Swagger to avoid DI issues in tests
            var swaggerDescriptor = services.SingleOrDefault(
                d => d.ServiceType.Name.Contains("SwaggerGenOptions"));
            if (swaggerDescriptor != null) services.Remove(swaggerDescriptor);

            var massTransitDescriptors = services.Where(d => d.ServiceType.Namespace != null && d.ServiceType.Namespace.Contains("MassTransit")).ToList();
            foreach (var d in massTransitDescriptors) services.Remove(d);
            
            // Remove Redis to avoid connection issues
            var redisDescriptor = services.SingleOrDefault(d => d.ServiceType.Name.Contains("IDistributedCache"));
            if (redisDescriptor != null) services.Remove(redisDescriptor);
            services.AddDistributedMemoryCache();

            // Add MassTransit In-Memory for testing
            services.AddMassTransitTestHarness();

            // Add In-Memory database for testing
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using (var scope = host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        }
        return host;
    }
}
