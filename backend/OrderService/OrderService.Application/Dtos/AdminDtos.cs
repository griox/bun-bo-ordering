using OrderService.Domain.Enums;

namespace OrderService.Application.Dtos;

public record OrderSummaryDto(
    Guid Id,
    string TableCode,
    string TableName,
    DateTime CreatedAt,
    decimal TotalAmount,
    OrderStatus Status,
    string? Note,
    string PaymentMethod
);

public record DashboardStatsDto(
    decimal DailyRevenue,
    int TotalOrdersToday,
    int NewCustomersToday,
    string BestSellingItem,
    List<RevenueChartDataDto> WeeklyRevenue,
    List<OrderSummaryDto> RecentOrders,
    // Trend data for comparison
    decimal YesterdayRevenue,
    int TotalOrdersYesterday,
    int NewCustomersYesterday,
    decimal MonthlyRevenue,
    int TotalOrdersMonth,
    int TotalCustomersMonth
);

public record RevenueChartDataDto(
    string Date,
    string DayOfWeek,
    decimal RevenueCash,
    decimal RevenueTransfer
);
