using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;
using Xunit;

namespace RealtimeService.UnitTests.Consumers;

public class OrderCreatedEventConsumerTests
{
    private readonly Mock<IHubContext<NotificationHub>> _hubContextMock;
    private readonly Mock<ILogger<OrderCreatedEventConsumer>> _loggerMock;
    private readonly OrderCreatedEventConsumer _consumer;

    public OrderCreatedEventConsumerTests()
    {
        _hubContextMock = new Mock<IHubContext<NotificationHub>>();
        _loggerMock = new Mock<ILogger<OrderCreatedEventConsumer>>();
        
        // Mocking SignalR Hub structure
        var clientsMock = new Mock<IHubClients>();
        var clientProxyMock = new Mock<IClientProxy>();
        
        _hubContextMock.Setup(x => x.Clients).Returns(clientsMock.Object);
        clientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(clientProxyMock.Object);

        _consumer = new OrderCreatedEventConsumer(_hubContextMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldNotifyTableGroup()
    {
        // Arrange
        var @event = new OrderCreatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            PaymentMethod = "Cash"
        };
        var contextMock = new Mock<ConsumeContext<OrderCreatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.TableGroup(@event.TableSessionId.ToString())), Times.Once);
    }

    [Fact]
    public async Task Consume_CashOrder_ShouldNotifyKitchenGroup()
    {
        // Arrange
        var @event = new OrderCreatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            PaymentMethod = "Cash"
        };
        var contextMock = new Mock<ConsumeContext<OrderCreatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.KitchenGroup), Times.Once);
    }

    [Fact]
    public async Task Consume_TransferOrder_ShouldNotNotifyKitchenGroup()
    {
        // Arrange
        var @event = new OrderCreatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            PaymentMethod = "Transfer"
        };
        var contextMock = new Mock<ConsumeContext<OrderCreatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.KitchenGroup), Times.Never);
    }
}
