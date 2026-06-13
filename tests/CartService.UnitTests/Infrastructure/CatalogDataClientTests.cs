using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CartService.Application.Interfaces;
using CartService.Infrastructure.SyncDataServices.Grpc;
using CatalogService.Api.Protos;
using FluentAssertions;
using Grpc.Core;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CartService.UnitTests.Infrastructure;

public class CatalogDataClientTests
{
    private readonly Mock<CatalogGrpc.CatalogGrpcClient> _grpcClientMock;
    private readonly IMemoryCache _cache;
    private readonly Mock<ILogger<CatalogDataClient>> _loggerMock;

    public CatalogDataClientTests()
    {
        _grpcClientMock = new Mock<CatalogGrpc.CatalogGrpcClient>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _loggerMock = new Mock<ILogger<CatalogDataClient>>();
    }

    [Fact]
    public async Task GetFoodPricesManyAsync_ConcurrentRequests_SameKey_ShouldQueryGrpcOnce()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var foodIds = new List<Guid> { foodId };

        var grpcResponse = new GetFoodPricesResponse();
        grpcResponse.FoodPrices.Add(foodId.ToString(), new GetFoodPriceResponse { Price = 50000, IsAvailable = true, Name = "Pho Bo" });

        // Mock gRPC to simulate a slow network call (200ms delay)
        _grpcClientMock.Setup(x => x.GetFoodPricesAsync(
            It.IsAny<GetFoodPricesRequest>(),
            It.IsAny<Metadata>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var responseTask = Task.Delay(200).ContinueWith(_ => grpcResponse);
                return new AsyncUnaryCall<GetFoodPricesResponse>(
                    responseTask,
                    Task.FromResult(new Metadata()),
                    () => Status.DefaultSuccess,
                    () => new Metadata(),
                    () => { });
            });

        var client = new CatalogDataClient(_grpcClientMock.Object, _cache, _loggerMock.Object);

        // Act
        // Send 5 concurrent requests for the exact same foodId
        var tasks = Enumerable.Range(0, 5)
            .Select(_ => client.GetFoodPricesManyAsync(foodIds))
            .ToList();

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Length.Should().Be(5);
        foreach (var result in results)
        {
            result.Should().ContainKey(foodId);
            result[foodId].Name.Should().Be("Pho Bo");
            result[foodId].Price.Should().Be(50000);
        }

        // gRPC client must be called exactly once
        _grpcClientMock.Verify(x => x.GetFoodPricesAsync(
            It.IsAny<GetFoodPricesRequest>(),
            It.IsAny<Metadata>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetFoodPricesManyAsync_ConcurrentRequests_DifferentKeys_ShouldQueryGrpcConcurrently()
    {
        // Arrange
        var foodId1 = Guid.NewGuid();
        var foodId2 = Guid.NewGuid();

        var grpcResponse1 = new GetFoodPricesResponse();
        grpcResponse1.FoodPrices.Add(foodId1.ToString(), new GetFoodPriceResponse { Price = 50000, IsAvailable = true, Name = "Pho Bo" });

        var grpcResponse2 = new GetFoodPricesResponse();
        grpcResponse2.FoodPrices.Add(foodId2.ToString(), new GetFoodPriceResponse { Price = 60000, IsAvailable = true, Name = "Pho Ga" });

        // Setup mock gRPC calls to return separate responses depending on the requested food IDs
        _grpcClientMock.Setup(x => x.GetFoodPricesAsync(
            It.Is<GetFoodPricesRequest>(r => r.FoodIds.Contains(foodId1.ToString())),
            It.IsAny<Metadata>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var responseTask = Task.Delay(100).ContinueWith(_ => grpcResponse1);
                return new AsyncUnaryCall<GetFoodPricesResponse>(
                    responseTask,
                    Task.FromResult(new Metadata()),
                    () => Status.DefaultSuccess,
                    () => new Metadata(),
                    () => { });
            });

        _grpcClientMock.Setup(x => x.GetFoodPricesAsync(
            It.Is<GetFoodPricesRequest>(r => r.FoodIds.Contains(foodId2.ToString())),
            It.IsAny<Metadata>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var responseTask = Task.Delay(100).ContinueWith(_ => grpcResponse2);
                return new AsyncUnaryCall<GetFoodPricesResponse>(
                    responseTask,
                    Task.FromResult(new Metadata()),
                    () => Status.DefaultSuccess,
                    () => new Metadata(),
                    () => { });
            });

        var client = new CatalogDataClient(_grpcClientMock.Object, _cache, _loggerMock.Object);

        // Act
        // Send 2 concurrent requests for different foodIds
        var task1 = client.GetFoodPricesManyAsync(new List<Guid> { foodId1 });
        var task2 = client.GetFoodPricesManyAsync(new List<Guid> { foodId2 });

        var results = await Task.WhenAll(task1, task2);

        // Assert
        results[0].Should().ContainKey(foodId1);
        results[0][foodId1].Name.Should().Be("Pho Bo");

        results[1].Should().ContainKey(foodId2);
        results[1][foodId2].Name.Should().Be("Pho Ga");

        // gRPC should have been called twice (once for each distinct request)
        _grpcClientMock.Verify(x => x.GetFoodPricesAsync(
            It.IsAny<GetFoodPricesRequest>(),
            It.IsAny<Metadata>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
