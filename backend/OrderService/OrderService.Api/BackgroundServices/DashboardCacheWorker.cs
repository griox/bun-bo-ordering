using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Queries;

namespace OrderService.Api.BackgroundServices;

public class DashboardCacheWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DashboardCacheWorker> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(1);

    public DashboardCacheWorker(IServiceProvider serviceProvider, ILogger<DashboardCacheWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Khởi động lệch pha (jitter) để tránh tất cả các pod đồng loạt chạy worker cùng 1 ms khi HPA scale
        await Task.Delay(TimeSpan.FromSeconds(Random.Shared.Next(1, 30)), stoppingToken);

        using var timer = new PeriodicTimer(_period);
        try
        {
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var cache = scope.ServiceProvider.GetRequiredService<ICacheService>();

                    // Pseudo-distributed lock: Ngăn chặn 5 pods cùng gọi DB query 1 lúc (Gây thundering herd lên DB)
                    var isLocked = await cache.GetAsync<string>("dashboard_worker_lock");
                    if (isLocked != null)
                    {
                        continue; // Pod khác đang xử lý hoặc vừa xử lý xong, skip.
                    }

                    // Khóa trong 45 giây (Worker chạy mỗi 60 giây, nên khóa sẽ nhả trước kỳ tiếp theo)
                    await cache.SetAsync("dashboard_worker_lock", "locked", TimeSpan.FromSeconds(45));

                    _logger.LogInformation("DashboardCacheWorker running cache refresh...");
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    
                    // Force refresh cache (bypass cache check)
                    await mediator.Send(new GetDashboardStatsQuery(ForceRefresh: true), stoppingToken);
                    _logger.LogInformation("DashboardCacheWorker cache refreshed successfully.");
                }
                catch (OperationCanceledException)
                {
                    // Ignore cancellation from within the loop (e.g. timeout)
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh dashboard cache in background.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Bắt lỗi khi Kubernetes gửi tín hiệu SIGTERM (shutting down) làm stoppingToken bị hủy.
            // Điều này tránh việc BackgroundService tung lỗi UnhandledException và làm sập Process.
            _logger.LogInformation("DashboardCacheWorker is stopping gracefully.");
        }
    }
}
