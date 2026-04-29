using System.Threading.Tasks;
using BunBo.SharedKernel.Messaging;
using MassTransit;
using MediatR;
using OrderService.Domain.Enums;
using OrderService.Application.Orders.Commands;
using Microsoft.Extensions.Logging;

namespace OrderService.Application.Messaging;

public class PaymentCompletedEventConsumer : IConsumer<PaymentCompletedEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<PaymentCompletedEventConsumer> _logger;

    public PaymentCompletedEventConsumer(IMediator mediator, ILogger<PaymentCompletedEventConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedEvent> context)
    {
        var message = context.Message;

        // Update order status based on payment outcome
        var newStatus = message.IsSuccess ? OrderStatus.Paid : OrderStatus.PaymentFailed;
        _logger.LogInformation(
            "[ORDER] PaymentCompleted received for Order {OrderId}. IsSuccess={IsSuccess}, updating status to {Status}.",
            message.OrderId, message.IsSuccess, newStatus);

        var command = new UpdateOrderStatusCommand(message.OrderId, newStatus);
        await _mediator.Send(command, context.CancellationToken);
    }
}
