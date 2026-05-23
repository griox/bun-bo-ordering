using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetTableSessionOrdersQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetTableSessionOrdersQueryHandler _handler;

    public GetTableSessionOrdersQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetTableSessionOrdersQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithValidSession_ShouldReturnOrders()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session1 = new TableSession(table.Id, "1234");
        SetId(session1, Guid.NewGuid());
        _context.TableSessions.Add(session1);
        
        var session2 = new TableSession(table.Id, "5678");
        SetId(session2, Guid.NewGuid());
        _context.TableSessions.Add(session2);

        await _context.SaveChangesAsync();

        var order1 = new Order(session1.Id, null, "Note 1", "Cash");
        var order2 = new Order(session2.Id, null, "Note 2", "VnPay");
        SetId(order1, Guid.NewGuid());
        SetId(order2, Guid.NewGuid());
        
        _context.Orders.Add(order1);
        _context.Orders.Add(order2);
        await _context.SaveChangesAsync();

        var query = new GetTableSessionOrdersQuery(session1.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Id.Should().Be(order1.Id);
    }

    [Fact]
    public async Task Handle_WithNoOrders_ShouldReturnEmptyList()
    {
        // Arrange
        var query = new GetTableSessionOrdersQuery(Guid.NewGuid());

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
}
