using CartService.Application.Interfaces;
using CartService.Domain.Entities;
using MediatR;

namespace CartService.Application.Cart.Queries;

public record GetCartQuery(string CustomerUsername) : IRequest<ShoppingCart?>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, ShoppingCart?>
{
    private readonly ICartRepository _repository;

    public GetCartQueryHandler(ICartRepository repository)
    {
        _repository = repository;
    }

    public async Task<ShoppingCart?> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetCartAsync(request.CustomerUsername);
    }
}
