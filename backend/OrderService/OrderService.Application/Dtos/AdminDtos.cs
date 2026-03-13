using OrderService.Domain.Enums;

namespace OrderService.Application.Dtos;

public record OrderSummaryDto(
    Guid Id,
    string TableCode,
    string TableName,
    DateTime CreatedAt,
    decimal TotalAmount,
    OrderStatus Status,
    string? Note
);

public record DashboardStatsDto(
    decimal DailyRevenue,
    int TotalOrdersToday,
    int NewCustomersToday,
    string BestSellingItem,
    List<RevenueChartDataDto> WeeklyRevenue
);

public record RevenueChartDataDto(
    string Date,
    string DayOfWeek,
    decimal Revenue
);
