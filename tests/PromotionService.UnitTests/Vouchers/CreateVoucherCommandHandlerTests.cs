using FluentAssertions;
using Moq;
using Moq.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Commands;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using Xunit;

namespace PromotionService.UnitTests.Vouchers;

public class CreateVoucherCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly CreateVoucherCommandHandler _handler;

    public CreateVoucherCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _handler = new CreateVoucherCommandHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateVoucher()
    {
        // Arrange
        var command = new CreateVoucherCommand
        {
            Code = "VOUCHER10",
            Description = "10% off",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            MaxDiscountAmount = 50000,
            MinOrderValue = 100000,
            ValidFrom = DateTime.UtcNow.AddDays(-1),
            ValidTo = DateTime.UtcNow.AddDays(7),
            TotalUsageLimit = 100,
            MaxUsagePerUser = 1,
            Type = VoucherType.Standard,
            PointCost = null,
            Conditions = null,
            MaxRedemptionsPerUser = 1
        };
            
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher>());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.Vouchers.Add(It.Is<Voucher>(v => v.Code == "VOUCHER10")), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateCode_ShouldThrowException()
    {
        // Arrange
        var existingVoucher = new Voucher("VOUCHER10", "desc", DiscountType.FixedAmount, 10, null, 0, DateTime.UtcNow, DateTime.UtcNow.AddDays(1), 1, 1);
        _contextMock.Setup(x => x.Vouchers).ReturnsDbSet(new List<Voucher> { existingVoucher });

        var command = new CreateVoucherCommand
        {
            Code = "VOUCHER10",
            Description = "10% off",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            MaxDiscountAmount = 50000,
            MinOrderValue = 100000,
            ValidFrom = DateTime.UtcNow.AddDays(-1),
            ValidTo = DateTime.UtcNow.AddDays(7),
            TotalUsageLimit = 100,
            MaxUsagePerUser = 1,
            Type = VoucherType.Standard,
            PointCost = null,
            Conditions = null,
            MaxRedemptionsPerUser = 1
        };

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Mã giảm giá này đã tồn tại.");
    }
}
