using PromotionService.Application.Vouchers.Queries;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using Moq;
using Moq.EntityFrameworkCore;

namespace PromotionService.UnitTests.Vouchers;

public class ValidateVoucherQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly ValidateVoucherQueryHandler _handler;

    public ValidateVoucherQueryHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _handler = new ValidateVoucherQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnValid_WhenVoucherIsValidFixed()
    {
        // Arrange
        var code = "BUNBO50";
        var userId = Guid.NewGuid();
        var voucher = new Voucher(code, "Giảm 50k", DiscountType.FixedAmount, 50000, null, 100000, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1), 100, 1);
        
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher>());

        var query = new ValidateVoucherQuery(code, userId, 150000);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsValid.Should().BeTrue();
        result.DiscountAmount.Should().Be(50000);
        result.Message.Should().Be("Mã hợp lệ");
    }

    [Fact]
    public async Task Handle_ShouldReturnValid_WhenVoucherIsValidPercentage()
    {
        // Arrange
        var code = "PROMO10";
        var userId = Guid.NewGuid();
        var voucher = new Voucher(code, "Giảm 10%", DiscountType.Percentage, 10, 20000, 50000, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1), 100, 1);
        
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher>());

        var query = new ValidateVoucherQuery(code, userId, 100000);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsValid.Should().BeTrue();
        result.DiscountAmount.Should().Be(10000); // 10% of 100k
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenVoucherIsExpired()
    {
        // Arrange
        var code = "EXPIRED";
        var voucher = new Voucher(code, "Đã hết hạn", DiscountType.FixedAmount, 10000, null, 0, DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(-1), 100, 1);
        
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher>());

        var query = new ValidateVoucherQuery(code, Guid.NewGuid(), 100000);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Be("Mã giảm giá đã hết hạn.");
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenMinOrderValueNotMet()
    {
        // Arrange
        var code = "MIN100";
        var voucher = new Voucher(code, "Đơn từ 100k", DiscountType.FixedAmount, 10000, null, 100000, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1), 100, 1);
        
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher>());

        var query = new ValidateVoucherQuery(code, Guid.NewGuid(), 50000);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Contain("áp dụng cho đơn từ 100,000đ");
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenUserExceededUsage()
    {
        // Arrange
        var code = "ONCE";
        var userId = Guid.NewGuid();
        var voucher = new Voucher(code, "Dùng 1 lần", DiscountType.FixedAmount, 10000, null, 0, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(1), 100, 1);
        
        var usedVoucher = new UserVoucher(userId, voucher.Id);
        usedVoucher.Use(Guid.NewGuid());

        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { voucher });
        _contextMock.Setup(x => x.UserVouchers).ReturnsDbSet(new List<UserVoucher> { usedVoucher });

        var query = new ValidateVoucherQuery(code, userId, 100000);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Message.Should().Be("Bạn đã dùng hết lượt cho mã này.");
    }
}
