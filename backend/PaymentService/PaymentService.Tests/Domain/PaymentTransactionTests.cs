using System;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using Xunit;

namespace PaymentService.Tests.Domain;

public class PaymentTransactionTests
{
    [Fact]
    public void Constructor_WithValidData_ShouldCreatePendingTransaction()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var amount = 150000m;
        var provider = "SePay";
        var paymentUrl = "https://checkout.sepay.vn/xyz";

        // Act
        var transaction = new PaymentTransaction(orderId, amount, provider, paymentUrl);

        // Assert
        Assert.Equal(orderId, transaction.OrderId);
        Assert.Equal(amount, transaction.Amount);
        Assert.Equal(provider, transaction.Provider);
        Assert.Equal(paymentUrl, transaction.PaymentUrl);
        Assert.Equal(PaymentStatus.Pending, transaction.Status);
        Assert.Null(transaction.TransactionId);
        Assert.Null(transaction.Signature);
    }

    [Fact]
    public void MarkAsSuccess_WithValidTransactionData_ShouldUpdateStatusAndDetails()
    {
        // Arrange
        var transaction = new PaymentTransaction(Guid.NewGuid(), 150000m, "SePay", "url");
        var providerTransactionId = "SEPAY123456";
        var signature = "hmac256signature";

        // Act
        transaction.MarkAsSuccess(providerTransactionId, signature);

        // Assert
        Assert.Equal(PaymentStatus.Success, transaction.Status);
        Assert.Equal(providerTransactionId, transaction.TransactionId);
        Assert.Equal(signature, transaction.Signature);
    }

    [Fact]
    public void MarkAsFailed_ShouldUpdateStatusToFailed()
    {
        // Arrange
        var transaction = new PaymentTransaction(Guid.NewGuid(), 150000m, "SePay", "url");

        // Act
        transaction.MarkAsFailed();

        // Assert
        Assert.Equal(PaymentStatus.Failed, transaction.Status);
    }
}
