using System.Linq.Expressions;
using BunBo.Domain.Common;

namespace BunBo.Application.Interfaces
{
    public interface IGenericRepository<T> where T : BaseEntity
    {
        Task<T?> GetByIdAsync(Guid id);
        Task<IReadOnlyList<T>> GetAllAsync();
        Task<T?> FindAsync(Expression<Func<T, bool>> predicate);
        Task<IReadOnlyList<T>> FindAllAsync(Expression<Func<T, bool>> predicate);
        
        Task AddAsync(T entity);
        void Update(T entity);
        void Remove(T entity);
    }
}
