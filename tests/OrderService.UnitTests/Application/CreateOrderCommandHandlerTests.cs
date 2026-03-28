using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Moq;
using Moq.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using Xunit;

namespace OrderService.UnitTests.Application;

public class CreateOrderCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly Mock<ICartDataClient> _cartDataClientMock;
    private readonly CreateOrderCommandHandler _handler;

    public CreateOrderCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _cartDataClientMock = new Mock<ICartDataClient>();
        _handler = new CreateOrderCommandHandler(_contextMock.Object, _publishEndpointMock.Object, _cartDataClientMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateOrderAndReturnId()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new TableSession(Guid.NewGuid(), "1234");
        SetId(session, sessionId);

        var cart = new CartDto
        {
            CartOwnerId = sessionId.ToString(),
            Items = new List<CartItemDto>
            {
                new CartItemDto { FoodId = Guid.NewGuid(), FoodName = "Bun Bo", Quantity = 2, UnitPrice = 50000 }
            }
        };

        _contextMock.Setup(x => x.TableSessions.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);
        _contextMock.Setup(x => x.Orders).ReturnsDbSet(new List<Order>());
        _cartDataClientMock.Setup(x => x.GetCartAsync(sessionId.ToString())).ReturnsAsync(cart);

        var command = new CreateOrderCommand(sessionId, null, "No spicy");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.Orders.Add(It.Is<Order>(o => o.TableSessionId == sessionId && o.Status == OrderStatus.Unpaid)), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _publishEndpointMock.Verify(x => x.Publish(It.IsAny<OrderCreatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        _cartDataClientMock.Verify(x => x.ClearCartAsync(sessionId.ToString()), Times.Once);
    }

    [Fact]
    public async Task Handle_SessionNotFound_ShouldThrowException()
    {
        // Arrange
        _contextMock.Setup(x => x.TableSessions.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TableSession?)null);

        var command = new CreateOrderCommand(Guid.NewGuid(), null, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("TableSession not found.");
    }

    [Fact]
    public async Task Handle_SessionClosed_ShouldThrowException()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new TableSession(Guid.NewGuid(), "1234");
        SetId(session, sessionId);
        session.CloseSession();

        _contextMock.Setup(x => x.TableSessions.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        var command = new CreateOrderCommand(sessionId, null, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Session is closed. Cannot place new orders.");
    }

    [Fact]
    public async Task Handle_EmptyCart_ShouldThrowException()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new TableSession(Guid.NewGuid(), "1234");
        SetId(session, sessionId);

        _contextMock.Setup(x => x.TableSessions.FindAsync(It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);
        _cartDataClientMock.Setup(x => x.GetCartAsync(sessionId.ToString())).ReturnsAsync(new CartDto());

        var command = new CreateOrderCommand(sessionId, null, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Giỏ hàng đang trống. Không thể tạo đơn.");
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
