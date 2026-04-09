using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using PromotionService.Infrastructure.Messaging.Consumers;

namespace PromotionService.UnitTests.Messaging;

public class PaymentCompletedConsumerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<ILogger<PaymentCompletedConsumer>> _loggerMock;
    private readonly PaymentCompletedConsumer _consumer;

    public PaymentCompletedConsumerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _loggerMock = new Mock<ILogger<PaymentCompletedConsumer>>();
        _consumer = new PaymentCompletedConsumer(_contextMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldAwardPoints_WhenPaymentIsSuccess()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var amount = 100000m; // Should earn 10 points
        
        var @event = new PaymentCompletedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            Amount = amount,
            IsSuccess = true,
            TransactionId = "TX123",
            CompletedAt = DateTime.UtcNow
        };

        var consumeContextMock = new Mock<ConsumeContext<PaymentCompletedEvent>>();
        consumeContextMock.Setup(x => x.Message).Returns(@event);

        _contextMock.Setup(x => x.PointTransactions).ReturnsDbSet(new List<PointTransaction>());
        _contextMock.Setup(x => x.LoyaltyPoints).ReturnsDbSet(new List<LoyaltyPoint>());

        // Act
        await _consumer.Consume(consumeContextMock.Object);

        // Assert
        _contextMock.Verify(x => x.LoyaltyPoints.Add(It.IsAny<LoyaltyPoint>()), Times.Once);
        _contextMock.Verify(x => x.PointTransactions.Add(It.Is<PointTransaction>(t => 
            t.UserId == customerId && 
            t.Points == 10 && 
            t.Type == TransactionType.Earn &&
            t.OrderId == orderId)), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Consume_ShouldNotAwardPoints_WhenTransactionAlreadyProcessed()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        
        var @event = new PaymentCompletedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            Amount = 100000m,
            IsSuccess = true
        };

        var consumeContextMock = new Mock<ConsumeContext<PaymentCompletedEvent>>();
        consumeContextMock.Setup(x => x.Message).Returns(@event);

        var existingTransaction = new PointTransaction(customerId, 10, TransactionType.Earn, orderId, "Test");
        _contextMock.Setup(x => x.PointTransactions).ReturnsDbSet(new List<PointTransaction> { existingTransaction });

        // Act
        await _consumer.Consume(consumeContextMock.Object);

        // Assert
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
