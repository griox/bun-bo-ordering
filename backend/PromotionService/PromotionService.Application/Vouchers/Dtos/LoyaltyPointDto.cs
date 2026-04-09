using PromotionService.Domain.Enums;

namespace PromotionService.Application.Vouchers.Dtos;

public record PointTransactionDto(
    Guid Id,
    int Amount,
    TransactionType TransactionType,
    string Description,
    DateTime CreatedAt,
    Guid? OrderId
);

public record LoyaltyPointDto(
    Guid UserId,
    int Balance,
    List<PointTransactionDto> RecentTransactions
);
