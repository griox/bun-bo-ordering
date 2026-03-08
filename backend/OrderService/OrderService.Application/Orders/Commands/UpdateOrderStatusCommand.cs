using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus NewStatus) : IRequest<bool>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly IAppDbContext _context;

    public UpdateOrderStatusCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FindAsync(new object[] { request.OrderId }, cancellationToken);
        if (order == null) return false;

        order.UpdateStatus(request.NewStatus);
        await _context.SaveChangesAsync(cancellationToken);

        // TODO: Publish OrderStatusUpdatedEvent via RabbitMQ

        return true;
    }
}
