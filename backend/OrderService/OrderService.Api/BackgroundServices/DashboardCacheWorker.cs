using MediatR;
using OrderService.Application.Orders.Queries;

namespace OrderService.Api.BackgroundServices;

public class DashboardCacheWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DashboardCacheWorker> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(1); // Run every 1 minute to keep it always hot

    public DashboardCacheWorker(IServiceProvider serviceProvider, ILogger<DashboardCacheWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_period);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("DashboardCacheWorker running cache refresh...");
                using var scope = _serviceProvider.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                
                // Force refresh cache (bypass cache check)
                await mediator.Send(new GetDashboardStatsQuery(ForceRefresh: true), stoppingToken);
                _logger.LogInformation("DashboardCacheWorker cache refreshed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh dashboard cache in background.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }
}
