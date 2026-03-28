using System.Threading.Tasks;
using BunBo.SharedKernel.Messaging;
using MassTransit;
using MediatR;
using OrderService.Domain.Enums;
using OrderService.Application.Orders.Commands;

namespace OrderService.Application.Messaging;

public class PaymentCompletedEventConsumer : IConsumer<PaymentCompletedEvent>
{
    private readonly IMediator _mediator;

    public PaymentCompletedEventConsumer(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedEvent> context)
    {
        var message = context.Message;

        if (!message.IsSuccess) return;

        var command = new UpdateOrderStatusCommand(message.OrderId, OrderStatus.Paid);
        
        await _mediator.Send(command, context.CancellationToken);
    }
}
