using Amazon.S3;
using Amazon.S3.Model;
using CatalogService.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Text.RegularExpressions;

namespace CatalogService.Infrastructure.Services;

public class S3StorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _serviceUrl;
    private readonly string _publicUrl;

    public S3StorageService(IConfiguration configuration)
    {
        var accessKey = configuration["S3Settings:AccessKey"] ?? "minioadmin";
        var secretKey = configuration["S3Settings:SecretKey"] ?? "minioadminpassword";
        _serviceUrl = configuration["S3Settings:ServiceUrl"] ?? "http://localhost:9000";
        _publicUrl = configuration["S3Settings:PublicUrl"] ?? _serviceUrl;
        _bucketName = configuration["S3Settings:BucketName"] ?? "catalog-images";
        var region = configuration["S3Settings:Region"];

        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
            ForcePathStyle = _serviceUrl.Contains("localhost") || _serviceUrl.Contains("minio")
        };

        if (!string.IsNullOrEmpty(region))
        {
            config.AuthenticationRegion = region;
        }

        _s3Client = new AmazonS3Client(accessKey, secretKey, config);
    }

    public async Task<string> UploadFileAsync(IFormFile file, string prefix)
    {
        // 1. Validate File
        ValidateFile(file);

        // 2. Format Name: ten-mon-so-thu-tu (Dùng timestamp làm số thứ tự để đảm bảo unique)
        string extension = Path.GetExtension(file.FileName).ToLower();
        string cleanPrefix = FriendlyUrl(prefix);
        string sequence = DateTime.Now.ToString("yyyyMMddHHmmss"); 
        string fileName = $"{cleanPrefix}-{sequence}{extension}";

        // 3. Ensure Bucket exists
        await EnsureBucketExistsAsync();

        // 4. Upload
        using var newStream = new MemoryStream();
        await file.CopyToAsync(newStream);

        var uploadRequest = new PutObjectRequest
        {
            InputStream = newStream,
            BucketName = _bucketName,
            Key = fileName,
            ContentType = file.ContentType
        };

        await _s3Client.PutObjectAsync(uploadRequest);

        // Trả về URL để truy cập ảnh (Sử dụng PublicUrl)
        return $"{_publicUrl.TrimEnd('/')}/{_bucketName}/{fileName}";
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return;

        try
        {
            var uri = new Uri(fileUrl);
            var key = uri.Segments.Last();

            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            });
        }
        catch
        {
            // Log error or ignore if file doesn't exist
        }
    }

    private void ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new Exception("File is empty");

        // Max 5MB
        if (file.Length > 5 * 1024 * 1024)
            throw new Exception("File size exceeds 5MB limit");

        // Allowed extensions
        string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        string extension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(extension))
            throw new Exception("Invalid file format. Only JPG, PNG and WebP are allowed.");
    }

    private async Task EnsureBucketExistsAsync()
    {
        var bucketExists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
        if (!bucketExists)
        {
            await _s3Client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });
            
            // Set public policy for the bucket so we can view images via URL
            var policy = @"{
                ""Version"": ""2012-10-17"",
                ""Statement"": [
                    {
                        ""Effect"": ""Allow"",
                        ""Principal"": ""*"",
                        ""Action"": [""s3:GetObject""],
                        ""Resource"": [""arn:aws:s3:::" + _bucketName + @"/*""]
                    }
                ]
            }";
            await _s3Client.PutBucketPolicyAsync(_bucketName, policy);
        }
    }

    private string FriendlyUrl(string text)
    {
        if (string.IsNullOrEmpty(text)) return "image";
        text = text.ToLower();
        // Loại bỏ dấu tiếng Việt và ký tự đặc biệt
        text = Regex.Replace(text, @"[áàảãạâấầẩẫậăắằẳẵặ]", "a");
        text = Regex.Replace(text, @"[éèẻẽẹêếềểễệ]", "e");
        text = Regex.Replace(text, @"[íìỉĩị]", "i");
        text = Regex.Replace(text, @"[óòỏõọôốồổỗộơớờởỡợ]", "o");
        text = Regex.Replace(text, @"[úùủũụưứừửữự]", "u");
        text = Regex.Replace(text, @"[ýỳỷỹỵ]", "y");
        text = Regex.Replace(text, @"đ", "d");
        text = Regex.Replace(text, @"[^a-z0-9\s-]", "");
        text = Regex.Replace(text, @"[\s-]+", "-").Trim('-');
        return text;
    }
}
