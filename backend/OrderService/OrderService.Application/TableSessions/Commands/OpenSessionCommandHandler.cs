using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using BunBo.SharedKernel;

namespace OrderService.Application.TableSessions.Commands;

public class OpenSessionCommandHandler : IRequestHandler<OpenSessionCommand, OpenSessionResponse>
{
    private readonly IAppDbContext _context;

    public OpenSessionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<OpenSessionResponse> Handle(OpenSessionCommand request, CancellationToken cancellationToken)
    {
        var table = await _context.RestaurantTables
            .Include(t => t.Sessions)
            .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);

        if (table == null)
            throw new DomainException("Bàn không tồn tại.");

        // Luôn luôn tạo một TableSession mới tinh cho mỗi người quét QR.
        // Dù rủ bạn bè hay là người lạ ngồi chung bàn to (như foodcourt),
        // mỗi người quét mã đều sẽ cầm 1 cái điện thoại với 1 SessionId riêng để tự build Giỏ hàng và Bill riêng.
        
        string newGroupCode = new Random().Next(1000, 9999).ToString();
        var newSession = new TableSession(table.Id, newGroupCode);
        
        table.MarkAsOccupied(); // Đánh dấu bàn đã có người ngồi (dù 1 hay nhiều người)
        _context.TableSessions.Add(newSession);
        
        await _context.SaveChangesAsync(cancellationToken);

        return new OpenSessionResponse
        {
            SessionId = newSession.Id,
            GroupCode = newSession.GroupCode,
            Message = "Mở bàn thành công! Bạn có thể bắt đầu gọi món. (Giỏ hàng và hoá đơn của bạn hoàn toàn độc lập với những người khác cùng bàn)."
        };
    }
}
