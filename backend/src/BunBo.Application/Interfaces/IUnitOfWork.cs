namespace BunBo.Application.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<T> Repository<T>() where T : BunBo.Domain.Common.BaseEntity;
        Task<int> CompleteAsync();
    }
}
