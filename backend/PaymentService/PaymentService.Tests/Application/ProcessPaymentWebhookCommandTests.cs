using System;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using PaymentService.Application.Commands;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using Xunit;

namespace PaymentService.Tests.Application;

public class ProcessPaymentWebhookCommandTests
{
    [Fact]
    public async Task Handle_WithValidSignatureAndTransaction_ShouldUpdateStatusAndPublishEvent()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var amount = 150000m;
        var providerTransactionId = "SEPAY123456";
        var signature = "valid_signature";
        
        var transaction = new PaymentTransaction(orderId, amount, "SePay", paymentUrl: "url");
        
        var mockRepo = new Mock<IPaymentTransactionRepository>();
        mockRepo.Setup(r => r.GetByOrderIdAsync(orderId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(transaction);

        var mockEventPublisher = new Mock<IEventPublisher>();

        var handler = new ProcessPaymentWebhookCommandHandler(
            mockRepo.Object, 
            mockEventPublisher.Object);

        var command = new ProcessPaymentWebhookCommand(orderId, providerTransactionId, amount, "Success", signature);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal(PaymentStatus.Success, transaction.Status);
        Assert.Equal(providerTransactionId, transaction.TransactionId);
        
        mockRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        mockEventPublisher.Verify(p => p.PublishPaymentCompletedEventAsync(
            orderId, 
            true, 
            amount, 
            transaction.CustomerId, 
            transaction.VoucherCode,
            transaction.TableSessionId,
            transaction.TableNumber,
            transaction.Note,
            providerTransactionId,
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
