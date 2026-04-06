using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Moq;
using Moq.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using Xunit;

namespace OrderService.UnitTests.Application;

public class UpdateOrderStatusCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly UpdateOrderStatusCommandHandler _handler;

    public UpdateOrderStatusCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _handler = new UpdateOrderStatusCommandHandler(_contextMock.Object, _publishEndpointMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldUpdateStatusToPaidAndReturnTrue()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new Order(Guid.NewGuid(), null, null, "Cash"); // Status is Unpaid initially
        SetId(order, orderId);

        _contextMock.Setup(x => x.Orders.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        var command = new UpdateOrderStatusCommand(orderId, OrderStatus.Paid);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        order.Status.Should().Be(OrderStatus.Paid);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _publishEndpointMock.Verify(x => x.Publish(It.IsAny<OrderStatusUpdatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_OrderNotFound_ShouldReturnFalse()
    {
        // Arrange
        _contextMock.Setup(x => x.Orders.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        var command = new UpdateOrderStatusCommand(Guid.NewGuid(), OrderStatus.Paid);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_InvalidStateTransition_ShouldThrowException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new Order(Guid.NewGuid(), null, null, "Cash");
        SetId(order, orderId);
        order.UpdateStatus(OrderStatus.Paid); // Order is now Paid

        _contextMock.Setup(x => x.Orders.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Try to move from Paid back to Unpaid (Invalid)
        var command = new UpdateOrderStatusCommand(orderId, OrderStatus.Unpaid);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Cannot change status back to Unpaid once it is Paid.");
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
