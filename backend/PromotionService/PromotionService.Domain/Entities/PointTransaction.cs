using BunBo.SharedKernel;
using PromotionService.Domain.Enums;

namespace PromotionService.Domain.Entities;

public class PointTransaction : BaseEntity
{
    public Guid UserId { get; private set; }
    public int Points { get; private set; }
    public TransactionType Type { get; private set; }
    public Guid? OrderId { get; private set; }
    public string Reason { get; private set; }

    protected PointTransaction() { Reason = null!; }

    public PointTransaction(Guid userId, int points, TransactionType type, Guid? orderId, string reason)
    {
        UserId = userId;
        Points = points;
        Type = type;
        OrderId = orderId;
        Reason = reason;
    }
}
