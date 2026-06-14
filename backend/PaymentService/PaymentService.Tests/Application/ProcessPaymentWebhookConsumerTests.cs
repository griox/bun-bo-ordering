using System;
using System.Threading.Tasks;
using MassTransit;
using MediatR;
using Moq;
using PaymentService.Application.Commands;
using PaymentService.Infrastructure.Consumers;
using Xunit;

namespace PaymentService.Tests.Application;

public class ProcessPaymentWebhookConsumerTests
{
    [Fact]
    public async Task Consume_ShouldSendWebhookCommandToMediator()
    {
        // Arrange
        var mockMediator = new Mock<IMediator>();
        var consumer = new ProcessPaymentWebhookConsumer(mockMediator.Object);

        var orderId = Guid.NewGuid();
        var command = new ProcessPaymentWebhookCommand(
            orderId: orderId,
            providerTransactionId: "TX123",
            amount: 50000m,
            status: "Success",
            signature: "sig123"
        );

        var mockContext = new Mock<ConsumeContext<ProcessPaymentWebhookCommand>>();
        mockContext.Setup(c => c.Message).Returns(command);

        // Act
        await consumer.Consume(mockContext.Object);

        // Assert
        mockMediator.Verify(m => m.Send(command, default), Times.Once);
    }
}
