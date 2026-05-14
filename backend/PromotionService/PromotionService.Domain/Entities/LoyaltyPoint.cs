using BunBo.SharedKernel;

namespace PromotionService.Domain.Entities;

public class LoyaltyPoint : BaseEntity
{
    public Guid UserId { get; private set; }
    public int TotalPoints { get; private set; }
    public string Tier { get; private set; }

    protected LoyaltyPoint() { Tier = null!; }

    public LoyaltyPoint(Guid userId)
    {
        UserId = userId;
        TotalPoints = 0;
        Tier = "Silver";
    }

    public void AddPoints(int points)
    {
        TotalPoints += points;
        if (TotalPoints < 0) TotalPoints = 0;
        UpdateTier();
    }

    public void RedeemPoints(int points)
    {
        if (TotalPoints < points) throw new DomainException("Không đủ điểm để đổi voucher này.");
        TotalPoints -= points;
        UpdateTier();
    }

    private void UpdateTier()
    {
        if (TotalPoints >= 2000) Tier = "Diamond";
        else if (TotalPoints >= 1000) Tier = "Gold";
        else Tier = "Silver";
    }
}
