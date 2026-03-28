namespace OrderService.Domain.Enums;

public enum OrderStatus
{
    Unpaid,
    Paid
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed,
    Refunded
}
