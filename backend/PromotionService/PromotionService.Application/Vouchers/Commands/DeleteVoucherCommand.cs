using MediatR;
using PromotionService.Application.Interfaces;

namespace PromotionService.Application.Vouchers.Commands;

public record DeleteVoucherCommand(Guid Id) : IRequest<bool>;

public class DeleteVoucherCommandHandler : IRequestHandler<DeleteVoucherCommand, bool>
{
    private readonly IAppDbContext _context;

    public DeleteVoucherCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucher = await _context.Vouchers.FindAsync(new object[] { request.Id }, cancellationToken);
        if (voucher == null) return false;

        _context.Vouchers.Remove(voucher);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
