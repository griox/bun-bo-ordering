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

        var activeSession = table.Sessions.FirstOrDefault(s => !s.IsClosed);

        if (activeSession != null)
        {
            return new OpenSessionResponse
            {
                SessionId = activeSession.Id,
                GroupCode = activeSession.GroupCode,
                Message = "Bàn đang có người ăn. Bạn đã tham gia vào bàn thành công! (Dùng chung giỏ hàng)"
            };
        }

        string newGroupCode = new Random().Next(1000, 9999).ToString();
        var newSession = new TableSession(table.Id, newGroupCode);
        
        _context.TableSessions.Add(newSession);
        
        await _context.SaveChangesAsync(cancellationToken);

        return new OpenSessionResponse
        {
            SessionId = newSession.Id,
            GroupCode = newSession.GroupCode,
            Message = "Bàn trống. Đã mở phiên mới thành công!"
        };
    }
}
