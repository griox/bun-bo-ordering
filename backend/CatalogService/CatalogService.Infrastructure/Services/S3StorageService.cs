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
    private readonly string _fileUrlFormat;

    public S3StorageService(IConfiguration configuration)
    {
        var accessKey = configuration["S3Settings:AccessKey"] ?? "minioadmin";
        var secretKey = configuration["S3Settings:SecretKey"] ?? "minioadminpassword";
        var serviceUrlFromConfig = configuration["S3Settings:ServiceUrl"];
        _bucketName = configuration["S3Settings:BucketName"] ?? "catalog-images";
        var region = configuration["S3Settings:Region"];

        var isAwsS3 = string.IsNullOrWhiteSpace(serviceUrlFromConfig) || serviceUrlFromConfig.Contains("amazonaws.com");

        var config = new AmazonS3Config();

        if (isAwsS3)
        {
            _serviceUrl = serviceUrlFromConfig ?? ""; // For AWS it might be empty
            if (!string.IsNullOrEmpty(region))
                config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region);
                
            string awsRegion = string.IsNullOrEmpty(region) ? "us-east-1" : region;
            _publicUrl = configuration["S3Settings:PublicUrl"] ?? $"https://{_bucketName}.s3.{awsRegion}.amazonaws.com";
            _fileUrlFormat = "{0}/{1}";
        }
        else
        {
            _serviceUrl = serviceUrlFromConfig ?? "http://localhost:9000";
            config.ServiceURL = _serviceUrl;
            config.ForcePathStyle = true;
            _publicUrl = configuration["S3Settings:PublicUrl"] ?? _serviceUrl;
            _fileUrlFormat = "{0}/" + _bucketName + "/{1}";
        }

        // Nếu PublicUrl đã được set cụ thể và không phải trên local (ví dụ dùng CloudFront hoặc Custom Domain), 
        // URL thường trỏ trực tiếp đến file path chứ không qua /bucketName/.
        if (!string.IsNullOrEmpty(configuration["S3Settings:PublicUrl"]) && !_publicUrl.Contains("localhost") && !_publicUrl.Contains("127.0.0.1"))
        {
            _fileUrlFormat = "{0}/{1}";
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

        // Trả về URL để truy cập ảnh
        return string.Format(_fileUrlFormat, _publicUrl.TrimEnd('/'), fileName);
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
        try
        {
            // Note: DoesS3BucketExistV2Async can sometimes return 400 Bad Request with MinIO or certain IAM policies.
            // We wrap it in a try-catch to ensure it doesn't block the entire upload process.
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
                try
                {
                    await _s3Client.PutBucketPolicyAsync(_bucketName, policy);
                }
                catch (AmazonS3Exception ex) when (ex.ErrorCode == "AccessDenied")
                {
                    Console.WriteLine($"[S3StorageService] Warning: Could not set public bucket policy. Error: {ex.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            // If checking fails, we log it and proceed to the upload; the upload itself will fail if permissions are truly missing.
            Console.WriteLine($"[S3StorageService] Warning: EnsureBucketExistsAsync check failed: {ex.Message}. Proceeding to upload...");
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
