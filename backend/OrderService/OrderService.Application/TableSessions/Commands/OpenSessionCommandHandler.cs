using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using BunBo.SharedKernel;
using Microsoft.Extensions.Caching.Memory;

namespace OrderService.Application.TableSessions.Commands;

public class OpenSessionCommandHandler : IRequestHandler<OpenSessionCommand, OpenSessionResponse>
{
    private readonly IAppDbContext _context;
    private readonly IMemoryCache _cache;

    public OpenSessionCommandHandler(IAppDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<OpenSessionResponse> Handle(OpenSessionCommand request, CancellationToken cancellationToken)
    {
        var cacheKey = $"table_exists_{request.TableId}";
        if (!_cache.TryGetValue(cacheKey, out bool exists))
        {
            var tableExists = await _context.RestaurantTables
                .AnyAsync(t => t.Id == request.TableId, cancellationToken);

            if (!tableExists)
                throw new DomainException("Bàn không tồn tại.");

            exists = true;
            _cache.Set(cacheKey, exists, TimeSpan.FromMinutes(30));
        }

        // Yêu cầu mới: Mỗi lần quét mã đều tạo một phiên (Session) riêng biệt
        // Không sử dụng chung giỏ hàng nữa để tiện tính tiền riêng.
        string newGroupCode = Random.Shared.Next(1000, 9999).ToString();
        var newSession = new TableSession(request.TableId, newGroupCode);
        
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
