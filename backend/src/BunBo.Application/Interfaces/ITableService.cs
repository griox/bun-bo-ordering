using BunBo.Domain.Entities;

namespace BunBo.Application.Interfaces
{
    public interface ITableService
    {
        // Returns Table Info (for validity check)
        Task<RestaurantTable> VerifyTableAsync(string tableCode);
        
        // Always creates a NEW session (Client manages the ID in LocalStorage)
        Task<TableSession> OpenSessionAsync(Guid tableId);
        
        Task<TableSession?> GetSessionByIdAsync(Guid sessionId);
    }
}
