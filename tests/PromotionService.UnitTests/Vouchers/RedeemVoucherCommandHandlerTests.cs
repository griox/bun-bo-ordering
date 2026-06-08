using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Moq.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Commands;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using Xunit;

namespace PromotionService.UnitTests.Vouchers;

public class RedeemVoucherCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly RedeemVoucherCommandHandler _handler;

    public RedeemVoucherCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        var databaseMock = new Mock<Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade>(Mock.Of<DbContext>());
        databaseMock.Setup(x => x.ProviderName).Returns("InMemory");
        _contextMock.Setup(x => x.Database).Returns(databaseMock.Object);
        
        databaseMock.Setup(x => x.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction>());

        _handler = new RedeemVoucherCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ExceedMaxRedemptionsPerUser_ShouldThrowException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var voucherId = Guid.NewGuid();
        var voucher = new Voucher("POINTS50", "50k off", DiscountType.FixedAmount, 50000, null, 100000, 
            DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(7), 100, 1, VoucherType.PointRedemption, 500, null, 1);
        
        // Mocking voucher with Id
        typeof(Voucher).GetProperty("Id")?.SetValue(voucher, voucherId);

        var loyalty = new LoyaltyPoint(userId);
        loyalty.AddPoints(1000);

        // Already redeemed once
        var userVoucher = new UserVoucher(userId, voucherId, DateTime.UtcNow.AddDays(7));
        userVoucher.Use(Guid.NewGuid()); // Even if used, it counts towards redemption limit

        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher> { userVoucher });
        _contextMock.Setup(x => x.LoyaltyPoints).ReturnsDbSet(new List<LoyaltyPoint> { loyalty });
        _contextMock.Setup(x => x.PointTransactions).ReturnsDbSet(new List<PointTransaction>());

        var command = new RedeemVoucherCommand(userId, voucherId);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Bạn đã đổi tối đa số lần cho phép cho mã này.");
    }

    [Fact]
    public async Task Handle_ValidRedemption_ShouldSucceed()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var voucherId = Guid.NewGuid();
        var voucher = new Voucher("POINTS50", "50k off", DiscountType.FixedAmount, 50000, null, 100000, 
            DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(7), 100, 1, VoucherType.PointRedemption, 500, null, 2);
        
        typeof(Voucher).GetProperty("Id")?.SetValue(voucher, voucherId);

        var loyalty = new LoyaltyPoint(userId);
        loyalty.AddPoints(1000);

        // Already redeemed once, but max is 2
        var userVoucher = new UserVoucher(userId, voucherId, DateTime.UtcNow.AddDays(7));
        userVoucher.Use(Guid.NewGuid());

        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher> { userVoucher });
        _contextMock.Setup(x => x.LoyaltyPoints).ReturnsDbSet(new List<LoyaltyPoint> { loyalty });
        _contextMock.Setup(x => x.PointTransactions).ReturnsDbSet(new List<PointTransaction>());

        var command = new RedeemVoucherCommand(userId, voucherId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
