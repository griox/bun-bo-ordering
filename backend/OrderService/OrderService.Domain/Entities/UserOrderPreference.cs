using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class UserOrderPreference : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid PreferredOrderId { get; private set; }

    protected UserOrderPreference() { }

    public UserOrderPreference(Guid userId, Guid preferredOrderId)
    {
        UserId = userId;
        PreferredOrderId = preferredOrderId;
    }

    public void UpdatePreferredOrder(Guid orderId)
    {
        PreferredOrderId = orderId;
    }
}
