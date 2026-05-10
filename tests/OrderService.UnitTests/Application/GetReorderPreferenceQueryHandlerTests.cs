using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Orders.Commands;
using OrderService.Application.Orders.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetReorderPreferenceQueryHandlerTests
{
    private readonly AppDbContext _context;
    private readonly GetReorderPreferenceQueryHandler _handler;

    public GetReorderPreferenceQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _handler = new GetReorderPreferenceQueryHandler(_context);
    }

    // ── Happy Path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_UserHasPreference_ShouldReturnPreferredOrderId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var preferredOrderId = Guid.NewGuid();
        _context.UserOrderPreferences.Add(new UserOrderPreference(userId, preferredOrderId));
        await _context.SaveChangesAsync();

        var query = new GetReorderPreferenceQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().Be(preferredOrderId);
    }

    [Fact]
    public async Task Handle_UserHasNoPreference_ShouldReturnNull()
    {
        // Arrange
        var query = new GetReorderPreferenceQuery(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    // ── Edge Cases ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_MultipleUsers_ShouldReturnOnlyCurrentUserPreference()
    {
        // Arrange
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var order1 = Guid.NewGuid();
        var order2 = Guid.NewGuid();

        _context.UserOrderPreferences.AddRange(
            new UserOrderPreference(userId1, order1),
            new UserOrderPreference(userId2, order2)
        );
        await _context.SaveChangesAsync();

        var query = new GetReorderPreferenceQuery(userId1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().Be(order1);
        result.Should().NotBe(order2);
    }
}
