using FluentAssertions;
using OrderService.Domain.Entities;
using Xunit;

namespace OrderService.UnitTests.Domain;

public class UserOrderPreferenceTests
{
    // ── Constructor ───────────────────────────────────────────────────────────

    [Fact]
    public void Constructor_ValidArgs_ShouldSetProperties()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        // Act
        var pref = new UserOrderPreference(userId, orderId);

        // Assert
        pref.UserId.Should().Be(userId);
        pref.PreferredOrderId.Should().Be(orderId);
    }

    // ── UpdatePreferredOrder ──────────────────────────────────────────────────

    [Fact]
    public void UpdatePreferredOrder_NewOrderId_ShouldChangePreferredOrderId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var originalOrderId = Guid.NewGuid();
        var newOrderId = Guid.NewGuid();
        var pref = new UserOrderPreference(userId, originalOrderId);

        // Act
        pref.UpdatePreferredOrder(newOrderId);

        // Assert
        pref.PreferredOrderId.Should().Be(newOrderId);
    }

    [Fact]
    public void UpdatePreferredOrder_SameOrderId_ShouldRemainUnchanged()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var pref = new UserOrderPreference(userId, orderId);

        // Act
        pref.UpdatePreferredOrder(orderId);

        // Assert
        pref.PreferredOrderId.Should().Be(orderId);
    }

    [Fact]
    public void UpdatePreferredOrder_CalledMultipleTimes_ShouldAlwaysReflectLastValue()
    {
        // Arrange
        var pref = new UserOrderPreference(Guid.NewGuid(), Guid.NewGuid());
        var firstId = Guid.NewGuid();
        var secondId = Guid.NewGuid();
        var thirdId = Guid.NewGuid();

        // Act
        pref.UpdatePreferredOrder(firstId);
        pref.UpdatePreferredOrder(secondId);
        pref.UpdatePreferredOrder(thirdId);

        // Assert
        pref.PreferredOrderId.Should().Be(thirdId);
    }

    [Fact]
    public void UpdatePreferredOrder_ShouldNotChangeUserId()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var pref = new UserOrderPreference(userId, Guid.NewGuid());

        // Act
        pref.UpdatePreferredOrder(Guid.NewGuid());

        // Assert
        pref.UserId.Should().Be(userId);
    }
}
