using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetOrdersByCustomerQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetOrdersByCustomerQueryHandler _handler;

    public GetOrdersByCustomerQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetOrdersByCustomerQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithExistingCustomer_ShouldReturnOrders()
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

        var order1 = new Order(session.Id, customerId, "Note 1", "Cash");
        var order2 = new Order(session.Id, customerId, "Note 2", "VnPay");
        SetId(order1, Guid.NewGuid());
        SetId(order2, Guid.NewGuid());
        
        _context.Orders.Add(order1);
        _context.Orders.Add(order2);
        await _context.SaveChangesAsync();

        var query = new GetOrdersByCustomerQuery(customerId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.Items.Any(o => o.Id == order1.Id).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithNoOrders_ShouldReturnEmptyList()
    {
        // Arrange
        var query = new GetOrdersByCustomerQuery(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
