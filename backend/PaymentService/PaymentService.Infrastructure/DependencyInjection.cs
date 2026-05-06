using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PaymentService.Application.Interfaces;
using PaymentService.Infrastructure.Security;
using PaymentService.Infrastructure.Messaging;

namespace PaymentService.Infrastructure.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PaymentDbContext>(options =>
            // Using standard DefaultConnection from docker-compose.yml
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptionsAction: sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorCodesToAdd: null);
                }));

        services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
        
        // Use Real validators & publishers
        services.AddScoped<ISignatureValidator, SePaySignatureValidator>();
        services.AddScoped<IEventPublisher, MassTransitEventPublisher>();

        // SePay Checkout API
        services.AddHttpClient<ISePayService, Infrastructure.Services.SePayService>();

        return services;
    }
}
