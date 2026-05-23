using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetUnreadOrdersQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetUnreadOrdersQueryHandler _handler;

    public GetUnreadOrdersQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetUnreadOrdersQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithUnreadOrders_ShouldReturnUnreadOrders()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        // Unread order
        var unreadOrder = new Order(session.Id, null, "Note", "Cash");
        SetId(unreadOrder, Guid.NewGuid());
        unreadOrder.AddItem(new OrderItem(unreadOrder.Id, Guid.NewGuid(), "Pho", 2, 50000, ""));
        _context.Orders.Add(unreadOrder);

        // Read order
        var readOrder = new Order(session.Id, null, "Note", "Cash");
        SetId(readOrder, Guid.NewGuid());
        readOrder.MarkAsRead();
        _context.Orders.Add(readOrder);

        await _context.SaveChangesAsync();

        var query = new GetUnreadOrdersQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        
        var dto = result.First();
        dto.Id.Should().Be(unreadOrder.Id);
        dto.TableCode.Should().Be("T1");
        dto.Items.Should().HaveCount(1);
        dto.Items.First().ProductName.Should().Be("Pho");
    }

    [Fact]
    public async Task Handle_WithNoUnreadOrders_ShouldReturnEmptyList()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        // Read order
        var readOrder = new Order(session.Id, null, "Note", "Cash");
        SetId(readOrder, Guid.NewGuid());
        readOrder.MarkAsRead();
        _context.Orders.Add(readOrder);

        await _context.SaveChangesAsync();

        var query = new GetUnreadOrdersQuery();

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
