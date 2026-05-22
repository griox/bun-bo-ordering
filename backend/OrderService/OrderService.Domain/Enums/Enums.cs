namespace OrderService.Domain.Enums;

public enum OrderStatus
{
    Unpaid, // Legacy
    Paid,
    PaymentFailed,
    Processing,
    Completed
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed,
    Refunded
}
