using BunBo.Application.Interfaces;
using BunBo.Domain.Entities;
using BunBo.Domain.Enums;

namespace BunBo.Application.Services
{
    public class TableService : ITableService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TableService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<RestaurantTable> VerifyTableAsync(string tableCode)
        {
            var table = await _unitOfWork.Repository<RestaurantTable>()
                .FindAsync(t => t.TableCode == tableCode);
            
            if (table == null)
            {
                throw new Exception("Invalid Table Code");
            }
            // Occupied/Available, doesn't matter for verification. Both valid to start scanning.
            return table;
        }

        public async Task<TableSession> OpenSessionAsync(Guid tableId)
        {
            // 1. Verify existence
            var table = await _unitOfWork.Repository<RestaurantTable>().GetByIdAsync(tableId);
            if (table == null) throw new Exception("Table not found");

            // 2. Create NEW Session (Always)
            // Support multiple sessions (strangers sharing table)
            var newSession = new TableSession
            {
                TableId = table.Id,
                StartTime = DateTime.UtcNow,
                IsClosed = false
            };

            await _unitOfWork.Repository<TableSession>().AddAsync(newSession);
            
            // 3. Mark Table Occupied if needed
            if (table.Status == TableStatus.Available)
            {
                // Note: Table remains "Occupied" as long as 1 session is active.
                // We don't flip it back until ALL sessions close (Future logic).
                table.Status = TableStatus.Occupied;
                _unitOfWork.Repository<RestaurantTable>().Update(table);
            }

            await _unitOfWork.CompleteAsync();
            return newSession;
        }

        public async Task<TableSession?> GetSessionByIdAsync(Guid sessionId)
        {
             return await _unitOfWork.Repository<TableSession>().GetByIdAsync(sessionId);
        }
    }
}
