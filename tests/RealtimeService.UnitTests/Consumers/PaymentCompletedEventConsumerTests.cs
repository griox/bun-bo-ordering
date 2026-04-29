using RealtimeService.Api.Consumers;
using RealtimeService.Api.Hubs;
using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace RealtimeService.UnitTests.Consumers;

public class PaymentCompletedEventConsumerTests
{
    private readonly Mock<IHubContext<NotificationHub>> _hubContextMock;
    private readonly Mock<IHubClients> _clientsMock;
    private readonly Mock<IClientProxy> _clientProxyMock;
    private readonly Mock<IGroupManager> _groupManagerMock;
    private readonly Mock<ILogger<PaymentCompletedEventConsumer>> _loggerMock;
    private readonly PaymentCompletedEventConsumer _consumer;

    public PaymentCompletedEventConsumerTests()
    {
        _hubContextMock = new Mock<IHubContext<NotificationHub>>();
        _clientsMock = new Mock<IHubClients>();
        _clientProxyMock = new Mock<IClientProxy>();
        _groupManagerMock = new Mock<IGroupManager>();
        _loggerMock = new Mock<ILogger<PaymentCompletedEventConsumer>>();

        _hubContextMock.Setup(x => x.Clients).Returns(_clientsMock.Object);
        _hubContextMock.Setup(x => x.Groups).Returns(_groupManagerMock.Object);
        
        // Mocking Groups(...).SendAsync(...)
        _clientsMock.Setup(x => x.Groups(It.IsAny<IReadOnlyList<string>>())).Returns(_clientProxyMock.Object);
        // Mocking Group(...).SendAsync(...)
        _clientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);

        _consumer = new PaymentCompletedEventConsumer(_hubContextMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_PaymentSuccess_ShouldNotifyKitchenAndAdmin()
    {
        // Arrange
        var contextMock = new Mock<ConsumeContext<PaymentCompletedEvent>>();
        var message = new PaymentCompletedEvent
        {
            OrderId = Guid.NewGuid(),
            IsSuccess = true,
            Amount = 55000,
            CompletedAt = DateTime.UtcNow,
            TransactionId = "TXN123"
        };
        contextMock.Setup(x => x.Message).Returns(message);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _clientsMock.Verify(x => x.Groups(It.Is<IReadOnlyList<string>>(list => 
            list.Contains(HubConstants.KitchenGroup) && list.Contains(HubConstants.AdminGroup))), Times.Once);
            
        _clientProxyMock.Verify(x => x.SendCoreAsync(
            HubConstants.Events.ReceiveNewOrder,
            It.Is<object[]>(args => args.Length == 1),
            default), Times.Once);
    }

    [Fact]
    public async Task Consume_PaymentSuccess_WithTableSession_ShouldNotifyTable()
    {
        // Arrange
        var tableSessionId = Guid.NewGuid();
        var contextMock = new Mock<ConsumeContext<PaymentCompletedEvent>>();
        var message = new PaymentCompletedEvent
        {
            OrderId = Guid.NewGuid(),
            IsSuccess = true,
            TableSessionId = tableSessionId,
            TransactionId = "TXN123"
        };
        contextMock.Setup(x => x.Message).Returns(message);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        var tableGroupName = HubConstants.TableGroup(tableSessionId.ToString());
        _clientsMock.Verify(x => x.Group(tableGroupName), Times.Once);
        
        _clientProxyMock.Verify(x => x.SendCoreAsync(
            HubConstants.Events.PaymentSuccess,
            It.IsAny<object[]>(),
            default), Times.Once);
    }

    [Fact]
    public async Task Consume_PaymentFailed_ShouldNotSendNotifications()
    {
        // Arrange
        var contextMock = new Mock<ConsumeContext<PaymentCompletedEvent>>();
        var message = new PaymentCompletedEvent
        {
            OrderId = Guid.NewGuid(),
            IsSuccess = false
        };
        contextMock.Setup(x => x.Message).Returns(message);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _clientsMock.Verify(x => x.Groups(It.IsAny<IReadOnlyList<string>>()), Times.Never);
        _clientsMock.Verify(x => x.Group(It.IsAny<string>()), Times.Never);
    }
}
