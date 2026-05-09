using CatalogService.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using FluentAssertions;

namespace CatalogService.UnitTests.Infrastructure;

public class S3StorageServiceTests
{
    private readonly Mock<IConfiguration> _configMock;
    private readonly S3StorageService _sut;

    public S3StorageServiceTests()
    {
        _configMock = new Mock<IConfiguration>();
        
        // Mock default configuration values
        _configMock.Setup(x => x["S3Settings:AccessKey"]).Returns("test");
        _configMock.Setup(x => x["S3Settings:SecretKey"]).Returns("test");
        _configMock.Setup(x => x["S3Settings:BucketName"]).Returns("test-bucket");
        _configMock.Setup(x => x["S3Settings:ServiceUrl"]).Returns("http://localhost:9000");

        _sut = new S3StorageService(_configMock.Object);
    }

    [Fact]
    public async Task UploadFileAsync_InvalidExtension_ShouldThrowException()
    {
        // Arrange
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("video.mp4");
        fileMock.Setup(f => f.Length).Returns(1024);

        // Act
        Func<Task> act = () => _sut.UploadFileAsync(fileMock.Object, "test");

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("Invalid file format. Only JPG, PNG and WebP are allowed.");
    }

    [Fact]
    public async Task UploadFileAsync_FileTooLarge_ShouldThrowException()
    {
        // Arrange
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("large.jpg");
        fileMock.Setup(f => f.Length).Returns(6 * 1024 * 1024); // 6MB

        // Act
        Func<Task> act = () => _sut.UploadFileAsync(fileMock.Object, "test");

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("File size exceeds 5MB limit");
    }

    [Fact]
    public async Task UploadFileAsync_EmptyFile_ShouldThrowException()
    {
        // Arrange
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("empty.jpg");
        fileMock.Setup(f => f.Length).Returns(0);

        // Act
        Func<Task> act = () => _sut.UploadFileAsync(fileMock.Object, "test");

        // Assert
        await act.Should().ThrowAsync<Exception>()
            .WithMessage("File is empty");
    }
}
