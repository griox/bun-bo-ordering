using System.Threading.Tasks;
using MassTransit;
using MediatR;
using PaymentService.Application.Commands;

namespace PaymentService.Infrastructure.Consumers;

public class ProcessPaymentWebhookConsumer : IConsumer<ProcessPaymentWebhookCommand>
{
    private readonly IMediator _mediator;

    public ProcessPaymentWebhookConsumer(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task Consume(ConsumeContext<ProcessPaymentWebhookCommand> context)
    {
        await _mediator.Send(context.Message);
    }
}
