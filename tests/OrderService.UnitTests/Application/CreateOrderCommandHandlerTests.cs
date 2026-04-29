using BunBo.SharedKernel;
using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class CreateOrderCommandHandlerTests
{
    private readonly AppDbContext _context;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly Mock<ICartDataClient> _cartDataClientMock;
    private readonly Mock<ILogger<CreateOrderCommandHandler>> _loggerMock;
    private readonly CreateOrderCommandHandler _handler;

    public CreateOrderCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _cartDataClientMock = new Mock<ICartDataClient>();
        _loggerMock = new Mock<ILogger<CreateOrderCommandHandler>>();
        _handler = new CreateOrderCommandHandler(_context, _publishEndpointMock.Object, _cartDataClientMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateOrderAndReturnId()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var sessionId = Guid.NewGuid();
        var session = new TableSession(table.Id, "1234");
        SetId(session, sessionId);
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var cart = new CartDto
        {
            CartOwnerId = sessionId.ToString(),
            Items = new List<CartItemDto>
            {
                new CartItemDto { FoodId = Guid.NewGuid(), FoodName = "Bun Bo", Quantity = 2, UnitPrice = 50000 }
            }
        };

        _cartDataClientMock.Setup(x => x.GetCartAsync(sessionId.ToString())).ReturnsAsync(cart);

        var command = new CreateOrderCommand(sessionId, null, "No spicy", "Cash");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == result);
        order.Should().NotBeNull();
        order!.TableSessionId.Should().Be(sessionId);
        order.Status.Should().Be(OrderStatus.Unpaid);
        order.OrderItems.Should().HaveCount(1);
        
        _publishEndpointMock.Verify(x => x.Publish(It.IsAny<OrderCreatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        _cartDataClientMock.Verify(x => x.ClearCartAsync(sessionId.ToString()), Times.Once);
    }

    [Fact]
    public async Task Handle_SessionNotFound_ShouldThrowDomainException()
    {
        // Arrange
        var command = new CreateOrderCommand(Guid.NewGuid(), null, null, "Cash");

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("TableSession not found.");
    }

    [Fact]
    public async Task Handle_SessionClosed_ShouldThrowDomainException()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var sessionId = Guid.NewGuid();
        var session = new TableSession(table.Id, "1234");
        SetId(session, sessionId);
        session.CloseSession();
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        var command = new CreateOrderCommand(sessionId, null, null, "Cash");

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Session is closed. Cannot place new orders.");
    }

    [Fact]
    public async Task Handle_EmptyCart_ShouldThrowDomainException()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Table 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var sessionId = Guid.NewGuid();
        var session = new TableSession(table.Id, "1234");
        SetId(session, sessionId);
        _context.TableSessions.Add(session);
        await _context.SaveChangesAsync();

        _cartDataClientMock.Setup(x => x.GetCartAsync(sessionId.ToString())).ReturnsAsync(new CartDto { Items = new List<CartItemDto>() });

        var command = new CreateOrderCommand(sessionId, null, null, "Cash");

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Giỏ hàng đang trống. Không thể tạo đơn.");
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
