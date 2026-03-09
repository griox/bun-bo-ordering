namespace OrderService.Domain.Enums;

public enum OrderStatus
{
    Created,
    PendingPayment,
    Paid,
    Cooking,
    Served,
    Closed,
    Cancelled
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed,
    Refunded
}
