using IdentityService.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MassTransit;

namespace IdentityService.IntegrationTests;

public class IdentityServiceFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
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

            // Remove MassTransit to avoid RabbitMQ connection
            var massTransitDescriptors = services.Where(d => d.ServiceType.Namespace != null && d.ServiceType.Namespace.Contains("MassTransit")).ToList();
            foreach (var d in massTransitDescriptors) services.Remove(d);
            
            // Add MassTransit In-Memory for testing
            services.AddMassTransitTestHarness();

            // Add In-Memory database for testing
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("IdentityIntegrationTestDb");
            });

            // Add basic API Explorer which Swagger needs (if we keep it) or just stub it
            // For now, let's just make sure the DB is initialized

            // Ensure DB is created
            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
