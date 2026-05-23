using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BunBo.SharedKernel;
using OrderService.Domain.Enums;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetRecentOrderForCustomerQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetRecentOrderForCustomerQueryHandler _handler;

    public GetRecentOrderForCustomerQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetRecentOrderForCustomerQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithExistingOrders_ShouldReturnMostRecentOrder()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var oldOrder = new Order(session.Id, customerId, "Old", "Cash");
        oldOrder.UpdateStatus(OrderStatus.Paid);
        var recentOrder = new Order(session.Id, customerId, "Recent", "VnPay");
        recentOrder.UpdateStatus(OrderStatus.Paid);
        
        SetId(oldOrder, Guid.NewGuid());
        SetId(recentOrder, Guid.NewGuid());
        
        recentOrder.AddItem(new OrderItem(recentOrder.Id, Guid.NewGuid(), "Bun Bo", 2, 50000, ""));

        // Simulating created at
        SetProperty(oldOrder, "CreatedAt", DateTime.UtcNow.AddDays(-1));
        SetProperty(recentOrder, "CreatedAt", DateTime.UtcNow);

        _context.Orders.Add(oldOrder);
        _context.Orders.Add(recentOrder);
        await _context.SaveChangesAsync();

        var query = new GetRecentOrderForCustomerQuery(customerId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().ProductName.Should().Be("Bun Bo");
    }

    [Fact]
    public async Task Handle_WithNoOrders_ShouldReturnEmptyList()
    {
        // Arrange
        var query = new GetRecentOrderForCustomerQuery(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }

    private void SetProperty(object entity, string propertyName, object value)
    {
        var property = entity.GetType().GetProperty(propertyName);
        property?.SetValue(entity, value);
    }
}
