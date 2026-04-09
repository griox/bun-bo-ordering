using PromotionService.Application.Vouchers.Queries;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using Moq;
using Moq.EntityFrameworkCore;

namespace PromotionService.UnitTests.Vouchers;

public class GetUserLoyaltyPointsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly GetUserLoyaltyPointsQueryHandler _handler;

    public GetUserLoyaltyPointsQueryHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _handler = new GetUserLoyaltyPointsQueryHandler(_contextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnLoyaltyPointsAndRecentTransactions()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var loyaltyPoint = new LoyaltyPoint(userId);
        loyaltyPoint.AddPoints(150);

        var transactions = new List<PointTransaction>
        {
            new PointTransaction(userId, 100, TransactionType.Earn, Guid.NewGuid(), "Earn 100"),
            new PointTransaction(userId, 50, TransactionType.Earn, Guid.NewGuid(), "Earn 50")
        };

        _contextMock.Setup(x => x.LoyaltyPoints).ReturnsDbSet(new List<LoyaltyPoint> { loyaltyPoint });
        _contextMock.Setup(x => x.PointTransactions).ReturnsDbSet(transactions);

        var query = new GetUserLoyaltyPointsQuery(userId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Balance.Should().Be(150);
        result.RecentTransactions.Should().HaveCount(2);
        result.RecentTransactions[0].Amount.Should().Be(50); // OrderDescending
    }
}
