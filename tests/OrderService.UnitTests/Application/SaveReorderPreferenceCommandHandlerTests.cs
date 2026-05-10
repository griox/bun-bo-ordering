using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class SaveReorderPreferenceCommandHandlerTests
{
    private readonly AppDbContext _context;
    private readonly SaveReorderPreferenceCommandHandler _handler;

    public SaveReorderPreferenceCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _handler = new SaveReorderPreferenceCommandHandler(_context);
    }

    // ── Happy Path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NewUser_ShouldCreatePreference()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var command = new SaveReorderPreferenceCommand(userId, orderId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var saved = await _context.UserOrderPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId);
        saved.Should().NotBeNull();
        saved!.PreferredOrderId.Should().Be(orderId);
    }

    [Fact]
    public async Task Handle_ExistingUser_ShouldUpdatePreferenceNotDuplicate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var oldOrderId = Guid.NewGuid();
        var newOrderId = Guid.NewGuid();

        _context.UserOrderPreferences.Add(new UserOrderPreference(userId, oldOrderId));
        await _context.SaveChangesAsync();

        var command = new SaveReorderPreferenceCommand(userId, newOrderId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        var allPrefs = await _context.UserOrderPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();

        allPrefs.Should().HaveCount(1);
        allPrefs[0].PreferredOrderId.Should().Be(newOrderId);
    }

    // ── Edge Cases ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_SameOrderIdTwice_ShouldIdempotentlyUpdate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var command = new SaveReorderPreferenceCommand(userId, orderId);

        // Act — call twice with same data
        await _handler.Handle(command, CancellationToken.None);
        await _handler.Handle(command, CancellationToken.None);

        // Assert — still only one record
        var count = await _context.UserOrderPreferences
            .CountAsync(p => p.UserId == userId);
        count.Should().Be(1);
    }

    [Fact]
    public async Task Handle_TwoDifferentUsers_ShouldCreateSeparatePreferences()
    {
        // Arrange
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        var order1 = Guid.NewGuid();
        var order2 = Guid.NewGuid();

        // Act
        await _handler.Handle(new SaveReorderPreferenceCommand(user1, order1), CancellationToken.None);
        await _handler.Handle(new SaveReorderPreferenceCommand(user2, order2), CancellationToken.None);

        // Assert
        var pref1 = await _context.UserOrderPreferences.FirstAsync(p => p.UserId == user1);
        var pref2 = await _context.UserOrderPreferences.FirstAsync(p => p.UserId == user2);
        pref1.PreferredOrderId.Should().Be(order1);
        pref2.PreferredOrderId.Should().Be(order2);
    }

    // ── Error Cases ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_UpdatePreference_ShouldPersistNewOrderIdCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var commandA = new SaveReorderPreferenceCommand(userId, Guid.NewGuid());
        var commandB = new SaveReorderPreferenceCommand(userId, Guid.NewGuid());
        var commandC = new SaveReorderPreferenceCommand(userId, Guid.NewGuid());

        // Act — change preference multiple times
        await _handler.Handle(commandA, CancellationToken.None);
        await _handler.Handle(commandB, CancellationToken.None);
        await _handler.Handle(commandC, CancellationToken.None);

        // Assert — only last preference persisted
        var pref = await _context.UserOrderPreferences.FirstAsync(p => p.UserId == userId);
        pref.PreferredOrderId.Should().Be(commandC.PreferredOrderId);
    }
}
