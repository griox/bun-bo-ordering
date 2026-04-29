using BunBo.SharedKernel;
using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Moq;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class UpdateOrderStatusCommandHandlerTests
{
    private readonly AppDbContext _context;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly UpdateOrderStatusCommandHandler _handler;

    public UpdateOrderStatusCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _handler = new UpdateOrderStatusCommandHandler(_context, _publishEndpointMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldUpdateStatusToPaidAndReturnTrue()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new Order(Guid.NewGuid(), null, null, "Cash"); // Status is Unpaid initially
        SetId(order, orderId);
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var command = new UpdateOrderStatusCommand(orderId, OrderStatus.Paid);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updatedOrder = await _context.Orders.FindAsync(orderId);
        updatedOrder!.Status.Should().Be(OrderStatus.Paid);
        _publishEndpointMock.Verify(x => x.Publish(It.IsAny<OrderStatusUpdatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_OrderNotFound_ShouldReturnFalse()
    {
        // Arrange
        var command = new UpdateOrderStatusCommand(Guid.NewGuid(), OrderStatus.Paid);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_InvalidStateTransition_ShouldThrowDomainException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new Order(Guid.NewGuid(), null, null, "Cash");
        SetId(order, orderId);
        order.UpdateStatus(OrderStatus.Paid); // Order is now Paid
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // Try to move from Paid back to Unpaid (Invalid)
        var command = new UpdateOrderStatusCommand(orderId, OrderStatus.Unpaid);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Cannot change status back to Unpaid once it is Paid.");
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
