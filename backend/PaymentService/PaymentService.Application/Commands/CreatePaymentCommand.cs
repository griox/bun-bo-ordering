using MediatR;
using PaymentService.Application.Interfaces;

namespace PaymentService.Application.Commands;

public record CreatePaymentCommand(Guid OrderId, decimal Amount, string Provider, Guid? CustomerId = null, string? VoucherCode = null, Guid? TableSessionId = null, string? TableNumber = null, string? Note = null) : IRequest<SePayCheckoutResponse?>;
