using BunBo.SharedKernel;

namespace PromotionService.Domain.Entities;

public class LoyaltyPoint : BaseEntity
{
    public Guid UserId { get; private set; }
    public int TotalPoints { get; private set; }
    public string Tier { get; private set; }

    protected LoyaltyPoint() { }

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

    private void UpdateTier()
    {
        if (TotalPoints >= 2000) Tier = "Diamond";
        else if (TotalPoints >= 1000) Tier = "Gold";
        else Tier = "Silver";
    }
}
