using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PaymentDbContext>(options =>
            // Using standard DefaultConnection from docker-compose.yml
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
        
        // Mock implementations for now to allow API compilation
        services.AddScoped<ISignatureValidator, MockSignatureValidator>();
        services.AddScoped<IEventPublisher, MockEventPublisher>();

        return services;
    }
}

public class MockSignatureValidator : ISignatureValidator
{
    public bool IsValid(string payload, string signature) => true;
}

public class MockEventPublisher : IEventPublisher
{
    public System.Threading.Tasks.Task PublishPaymentCompletedEventAsync(System.Guid orderId, bool isSuccess, System.Threading.CancellationToken cancellationToken = default)
    {
        // To be replaced with actual MassTransit / RabbitMQ publisher
        return System.Threading.Tasks.Task.CompletedTask;
    }
}
