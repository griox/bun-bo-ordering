using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using BunBo.SharedKernel.Messaging;

namespace OrderService.Application.Orders.Commands;

public record OrderItemDto(Guid FoodId, int Quantity, decimal UnitPrice, string? Note);

public record CreateOrderCommand(Guid TableSessionId, Guid? CustomerId, string? Note, List<OrderItemDto> Items) : IRequest<Guid>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;

    public CreateOrderCommandHandler(IAppDbContext context, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var session = await _context.TableSessions.FindAsync(new object[] { request.TableSessionId }, cancellationToken);
        if (session == null)
        {
            throw new Exception("TableSession not found.");
        }
        if (session.IsClosed)
        {
            throw new Exception("Session is closed. Cannot place new orders.");
        }

        var order = new Order(request.TableSessionId, request.CustomerId, request.Note);

        foreach (var itemDto in request.Items)
        {
            var orderItem = new OrderItem(order.Id, itemDto.FoodId, itemDto.Quantity, itemDto.UnitPrice, itemDto.Note);
            order.AddItem(orderItem);
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Publish OrderCreatedEvent via RabbitMQ
        await _publishEndpoint.Publish(new OrderCreatedEvent
        {
            OrderId = order.Id,
            TableSessionId = order.TableSessionId,
            TotalAmount = order.TotalAmount,
            Note = order.Note,
            CreatedAt = order.CreatedAt
        }, cancellationToken);

        return order.Id;
    }
}
