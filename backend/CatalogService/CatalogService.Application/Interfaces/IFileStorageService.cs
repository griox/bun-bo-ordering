using Microsoft.AspNetCore.Http;

namespace CatalogService.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to S3 compatible storage
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="prefix">A prefix for the filename (e.g. food name)</param>
    /// <returns>The URL or path to the uploaded file</returns>
    Task<string> UploadFileAsync(IFormFile file, string prefix);
    
    /// <summary>
    /// Deletes a file from storage
    /// </summary>
    /// <param name="fileUrl">The URL of the file to delete</param>
    Task DeleteFileAsync(string fileUrl);
}
