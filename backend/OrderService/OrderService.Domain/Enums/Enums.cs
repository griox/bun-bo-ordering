namespace OrderService.Domain.Enums;

public enum OrderStatus
{
    Unpaid,
    Paid,
    PaymentFailed
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed,
    Refunded
}
