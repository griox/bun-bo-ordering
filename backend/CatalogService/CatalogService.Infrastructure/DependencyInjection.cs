using CatalogService.Application.Interfaces;
using CatalogService.Infrastructure.Data;
using CatalogService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace CatalogService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis");
        
        // Register ConnectionMultiplexer for pattern-based clearing
        services.AddSingleton<IConnectionMultiplexer>(sp => 
            ConnectionMultiplexer.Connect(redisConnectionString!));

        services.AddScoped<ICacheService, RedisCacheService>();

        // AddDbContextPool for Catalog
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContextPool<AppDbContext>(options =>
            options.UseNpgsql(connectionString,
                npgsqlOptionsAction: sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                }));

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        
        // Register S3 Storage
        services.AddScoped<IFileStorageService, S3StorageService>();

        // Register Redis Cache
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "Catalog_";
        });

        return services;
    }
}
