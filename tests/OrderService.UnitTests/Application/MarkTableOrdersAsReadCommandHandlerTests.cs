using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class MarkTableOrdersAsReadCommandHandlerTests
{
    private readonly AppDbContext _context;
    private readonly MarkTableOrdersAsReadCommandHandler _handler;

    public MarkTableOrdersAsReadCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new MarkTableOrdersAsReadCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WithUnreadOrders_ShouldMarkAsReadAndReturnTrue()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var order1 = new Order(session.Id, null, "Note", "Cash");
        var order2 = new Order(session.Id, null, "Note", "Cash");
        SetId(order1, Guid.NewGuid());
        SetId(order2, Guid.NewGuid());
        
        _context.Orders.Add(order1);
        _context.Orders.Add(order2);
        await _context.SaveChangesAsync();

        var command = new MarkTableOrdersAsReadCommand("T1");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        
        var updatedOrders = await _context.Orders.ToListAsync();
        updatedOrders.Should().HaveCount(2);
        updatedOrders.All(o => o.IsRead).Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithNoUnreadOrders_ShouldReturnFalse()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        // Orders are read
        var order1 = new Order(session.Id, null, "Note", "Cash");
        order1.MarkAsRead();
        SetId(order1, Guid.NewGuid());
        
        _context.Orders.Add(order1);
        await _context.SaveChangesAsync();

        var command = new MarkTableOrdersAsReadCommand("T1");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_TableDoesNotExist_ShouldReturnFalse()
    {
        // Arrange
        var command = new MarkTableOrdersAsReadCommand("INVALID_TABLE");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
