using BunBo.SharedKernel.Messaging;
using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus NewStatus) : IRequest<bool>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;

    public UpdateOrderStatusCommandHandler(IAppDbContext context, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FindAsync(new object[] { request.OrderId }, cancellationToken);
        if (order == null) return false;

        order.UpdateStatus(request.NewStatus);
        await _context.SaveChangesAsync(cancellationToken);

        await _publishEndpoint.Publish(new OrderStatusUpdatedEvent
        {
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            TableSessionId = order.TableSessionId,
            NewStatus = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            UpdatedAt = DateTime.UtcNow
        }, cancellationToken);

        return true;
    }
}
