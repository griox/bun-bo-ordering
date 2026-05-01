using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetDashboardStatsQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly Mock<ICacheService> _cacheMock;
    private readonly GetDashboardStatsQueryHandler _handler;

    public GetDashboardStatsQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _cacheMock = new Mock<ICacheService>();
        _handler = new GetDashboardStatsQueryHandler(_context, _cacheMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCacheExists_ShouldReturnCachedData()
    {
        // Arrange
        var cachedStats = new DashboardStatsDto(1000, 5, 2, "Bun Bo", new List<RevenueChartDataDto>(), new List<OrderSummaryDto>());
        _cacheMock.Setup(x => x.GetAsync<DashboardStatsDto>("dashboard_stats")).ReturnsAsync(cachedStats);

        // Act
        var result = await _handler.Handle(new GetDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(cachedStats);
        _cacheMock.Verify(x => x.GetAsync<DashboardStatsDto>("dashboard_stats"), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCacheIsEmpty_ShouldCalculateStatsAndCacheThem()
    {
        // Arrange
        _cacheMock.Setup(x => x.GetAsync<DashboardStatsDto>(It.IsAny<string>())).ReturnsAsync((DashboardStatsDto?)null);

        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var order = new Order(session.Id, null, "Note", "Cash");
        order.AddItem(new OrderItem(order.Id, Guid.NewGuid(), "Bun Bo Special", 2, 65000, null));
        order.UpdateStatus(OrderStatus.Paid);
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // Act
        var result = await _handler.Handle(new GetDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.DailyRevenue.Should().Be(130000);
        result.TotalOrdersToday.Should().Be(1);
        result.BestSellingItem.Should().Be("Bun Bo Special");
        result.RecentOrders.Should().HaveCount(1);
        result.RecentOrders[0].TableCode.Should().Be("T1");

        _cacheMock.Verify(x => x.SetAsync(
            "dashboard_stats", 
            It.IsAny<DashboardStatsDto>(), 
            It.Is<TimeSpan?>(t => t == TimeSpan.FromMinutes(2))), 
            Times.Once);
    }
}
