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
            .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);

        if (table == null)
            throw new DomainException("Bàn không tồn tại.");

        // Yêu cầu mới: Mỗi lần quét mã đều tạo một phiên (Session) riêng biệt
        // Không sử dụng chung giỏ hàng nữa để tiện tính tiền riêng.
        string newGroupCode = new Random().Next(1000, 9999).ToString();
        var newSession = new TableSession(table.Id, newGroupCode);
        
        _context.TableSessions.Add(newSession);
        
        await _context.SaveChangesAsync(cancellationToken);

        return new OpenSessionResponse
        {
            SessionId = newSession.Id,
            GroupCode = newSession.GroupCode,
            Message = "Đã mở phiên gọi món thành công! Bạn có thể đặt món và tính tiền riêng biệt."
        };
    }
}
