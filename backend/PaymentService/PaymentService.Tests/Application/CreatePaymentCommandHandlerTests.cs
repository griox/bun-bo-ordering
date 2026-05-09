using Moq;
using PaymentService.Application.Commands;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace PaymentService.Tests.Application;

public class CreatePaymentCommandHandlerTests
{
    private readonly Mock<IPaymentTransactionRepository> _repositoryMock;
    private readonly Mock<ISePayService> _sePayServiceMock;
    private readonly CreatePaymentCommandHandler _handler;

    public CreatePaymentCommandHandlerTests()
    {
        _repositoryMock = new Mock<IPaymentTransactionRepository>();
        _sePayServiceMock = new Mock<ISePayService>();
        _handler = new CreatePaymentCommandHandler(_repositoryMock.Object, _sePayServiceMock.Object);
    }

    [Fact]
    public async Task Handle_OrderAlreadyPaid_ShouldReturnErrorMessage()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var existingTx = new PaymentTransaction(orderId, 50000, "SePay", null, null, null, Guid.NewGuid(), "T1", null);
        // Using reflection to set private field or simulate status if set via constructor/method
        // Looking at PaymentTransaction.cs (Domain), I'll check how to set Success.
        
        // I'll assume I can set it via a method or it's public for now (need to check).
        // For TDD RED phase, I'll write the expectation.
        
        _repositoryMock.Setup(x => x.GetByOrderIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTx);
        
        // Simulating Success status
        typeof(PaymentTransaction).GetProperty("Status")?.SetValue(existingTx, PaymentStatus.Success);

        var command = new CreatePaymentCommand(orderId, 50000, "SePay");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Message.Should().Be("Đơn hàng này đã được thanh toán thành công trước đó.");
    }

    [Fact]
    public async Task Handle_NewOrder_ShouldCreateTransactionAndCallSePay()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _repositoryMock.Setup(x => x.GetByOrderIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PaymentTransaction?)null);

        var sePayResponse = new SePayCheckoutResponse { Success = true, CheckoutUrl = "https://checkout.url" };
        _sePayServiceMock.Setup(x => x.CreateCheckoutUrlAsync(orderId, 50000, It.Is<string>(s => s.Contains("SEVQR")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sePayResponse);

        var command = new CreatePaymentCommand(orderId, 50000, "SePay");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(sePayResponse);
        _repositoryMock.Verify(x => x.AddAsync(It.Is<PaymentTransaction>(t => t.OrderId == orderId), It.IsAny<CancellationToken>()), Times.Once);
        _repositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
