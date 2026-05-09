using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;
using Xunit;

namespace RealtimeService.UnitTests.Consumers;

public class OrderStatusUpdatedEventConsumerTests
{
    private readonly Mock<IHubContext<NotificationHub>> _hubContextMock;
    private readonly Mock<ILogger<OrderStatusUpdatedEventConsumer>> _loggerMock;
    private readonly OrderStatusUpdatedEventConsumer _consumer;

    public OrderStatusUpdatedEventConsumerTests()
    {
        _hubContextMock = new Mock<IHubContext<NotificationHub>>();
        _loggerMock = new Mock<ILogger<OrderStatusUpdatedEventConsumer>>();
        
        var clientsMock = new Mock<IHubClients>();
        var clientProxyMock = new Mock<IClientProxy>();
        
        _hubContextMock.Setup(x => x.Clients).Returns(clientsMock.Object);
        clientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(clientProxyMock.Object);

        _consumer = new OrderStatusUpdatedEventConsumer(_hubContextMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldAlwaysNotifyKitchenGroup()
    {
        // Arrange
        var @event = new OrderStatusUpdatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            NewStatus = "Preparing"
        };
        var contextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.KitchenGroup), Times.Once);
    }

    [Fact]
    public async Task Consume_StatusPaid_ShouldNotifyTableGroup()
    {
        // Arrange
        var @event = new OrderStatusUpdatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            NewStatus = "Paid"
        };
        var contextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.TableGroup(@event.TableSessionId.ToString())), Times.Once);
    }

    [Fact]
    public async Task Consume_StatusNotPaid_ShouldNotNotifyTableGroup()
    {
        // Arrange
        var @event = new OrderStatusUpdatedEvent 
        { 
            OrderId = Guid.NewGuid(), 
            TableSessionId = Guid.NewGuid(),
            NewStatus = "Preparing"
        };
        var contextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _hubContextMock.Verify(x => x.Clients.Group(HubConstants.TableGroup(@event.TableSessionId.ToString())), Times.Never);
    }
}
