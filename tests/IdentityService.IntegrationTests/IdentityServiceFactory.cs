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
            // Aggressively remove DB related services
            var dbDescriptors = services.Where(d => 
                d.ServiceType == typeof(AppDbContext) || 
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(DbContextOptions)).ToList();
            foreach (var d in dbDescriptors) services.Remove(d);

            // Remove Swagger/OpenAPI
            var swaggerDescriptors = services.Where(d => 
                d.ServiceType.Name.Contains("Swagger") || 
                d.ServiceType.Name.Contains("OpenApi")).ToList();
            foreach (var d in swaggerDescriptors) services.Remove(d);

            // Remove MassTransit
            var massTransitDescriptors = services.Where(d => 
                d.ServiceType.Namespace != null && d.ServiceType.Namespace.Contains("MassTransit")).ToList();
            foreach (var d in massTransitDescriptors) services.Remove(d);
            
            // Remove Redis
            var cacheDescriptors = services.Where(d => 
                d.ServiceType == typeof(IDistributedCache) || 
                d.ServiceType.Name.Contains("Redis")).ToList();
            foreach (var d in cacheDescriptors) services.Remove(d);

            // Add Mocks/Testing Services
            services.AddDistributedMemoryCache();
            services.AddMassTransitTestHarness();

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });
            
            // Add IAppDbContext for the application
            services.AddScoped<IdentityService.Application.Interfaces.IAppDbContext>(provider => 
                provider.GetRequiredService<AppDbContext>());
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
