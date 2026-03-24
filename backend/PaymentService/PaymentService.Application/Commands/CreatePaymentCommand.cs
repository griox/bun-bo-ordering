using MediatR;
using System;

namespace PaymentService.Application.Commands;

public record CreatePaymentCommand(Guid OrderId, decimal Amount, string Provider) : IRequest<string>;
