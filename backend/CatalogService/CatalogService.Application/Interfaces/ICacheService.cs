namespace CatalogService.Application.Interfaces;

public interface ICacheService
{
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}
