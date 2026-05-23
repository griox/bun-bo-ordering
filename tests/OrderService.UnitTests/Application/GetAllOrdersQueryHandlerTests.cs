using FluentAssertions;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetAllOrdersQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetAllOrdersQueryHandler _handler;

    public GetAllOrdersQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _handler = new GetAllOrdersQueryHandler(_context);
    }

    [Fact]
    public async Task Handle_WithSkipAndTake_ShouldReturnPagedOrders()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var session = new TableSession(table.Id, "1234");
        SetId(session, Guid.NewGuid());
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        for (int i = 0; i < 5; i++)
        {
            var order = new Order(session.Id, null, $"Note {i}", "Cash");
            SetId(order, Guid.NewGuid());
            _context.Orders.Add(order);
        }
        await _context.SaveChangesAsync();

        var query = new GetAllOrdersQuery(1, 2); // Skip 1, Take 2

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(5);
        result.Skip.Should().Be(1);
        result.Take.Should().Be(2);
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
