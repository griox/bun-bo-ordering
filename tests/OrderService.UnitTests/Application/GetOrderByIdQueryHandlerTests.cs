using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using BunBo.SharedKernel;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetOrderByIdQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetOrderByIdQueryHandler _handler;

    public GetOrderByIdQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetOrderByIdQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithValidId_ShouldReturnOrderDto()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var order = new Order(session.Id, null, "Note", "Cash");
        SetId(order, Guid.NewGuid());
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var query = new GetOrderByIdQuery(order.Id);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(order.Id);
        result.Note.Should().Be("Note");
    }

    [Fact]
    public async Task Handle_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        var query = new GetOrderByIdQuery(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
