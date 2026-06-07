using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NotificationService.Api.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string email, string username);
    Task SendForgotPasswordEmailAsync(string email, string username, string otpCode);
    Task SendVoucherHuntEmailAsync(string email, string username, string code, string description, decimal discountValue, int discountType, int totalUsageLimit, DateTime? validFrom, DateTime? validTo);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendWelcomeEmailAsync(string email, string username)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var senderEmail = smtpSettings["DefaultSenderEmail"] ?? smtpSettings["SenderEmail"] ?? "noreply@bun-bo-chung-cu.io.vn";
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Bún bò Chung Cư", senderEmail));
        message.To.Add(new MailboxAddress(username, email));
        message.Subject = "Chào mừng bạn đến với Bún bò Chung Cư";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Chào mừng bạn</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <div style=""padding: 40px 10px;"">
        <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"">
            <div style=""background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;"">
                <h1 style=""color: #D9381E; margin: 0; font-size: 24px; font-weight: bold;"">BÚN BÒ CHUNG CƯ</h1>
            </div>
            <img src=""https://bun-bo-chung-cu.io.vn/images/Gemini_Generated_Image_w39rcaw39rcaw39r.png"" alt=""Bún bò Chung Cư Hero Banner"" style=""width: 100%; height: auto; display: block;"">
            <div style=""padding: 30px; color: #333333; line-height: 1.6;"">
                <h2 style=""font-size: 20px; margin-top: 0;"">Xin chào {username},</h2>
                <p>Cảm ơn bạn đã đăng ký thành viên tại Bún bò Chung Cư. Chúng tôi rất hân hạnh được phục vụ bạn.</p>
                <div style=""background-color: #f8f9fa; border-left: 4px solid #D9381E; padding: 15px; margin: 20px 0;"">
                    <p style=""margin: 0 0 10px 0; font-weight: bold;"">Tiện ích dành cho thành viên:</p>
                    <ul style=""margin: 0; padding-left: 20px;"">
                        <li>Đặt món trực tuyến nhanh chóng.</li>
                        <li>Theo dõi trạng thái đơn hàng.</li>
                        <li>Tích lũy điểm thưởng.</li>
                    </ul>
                </div>
                <div style=""text-align: center; margin-top: 30px;"">
                    <a href=""https://bun-bo-chung-cu.io.vn/"" style=""display: inline-block; background-color: #D9381E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Truy cập hệ thống</a>
                </div>
            </div>
            <div style=""padding: 20px; background-color: #f4f4f4; text-align: center; font-size: 12px; color: #777777;"">
                <p style=""margin: 0 0 5px 0;""><strong>Bún bò Chung Cư Team</strong></p>
                <p style=""margin: 0 0 10px 0;"">634 Đ.2/4, Chung cư Vĩnh Phước, khu B, Bắc Nha Trang, Khánh Hòa</p>
                <p style=""margin: 0;"">Email hỗ trợ: support@bun-bo-chung-cu.io.vn</p>
            </div>
        </div>
    </div>
</body>
</html>",
            TextBody = $@"
Chào {username},

Cảm ơn bạn đã đăng ký thành viên tại Bún bò Chung Cư. Chúng tôi rất hân hạnh được phục vụ bạn.

Tiện ích dành cho thành viên:
- Đặt món trực tuyến nhanh chóng.
- Theo dõi trạng thái đơn hàng.
- Tích lũy điểm thưởng.

Truy cập hệ thống tại: https://bun-bo-chung-cu.io.vn/

---
Bún bò Chung Cư Team
634 Đ.2/4, Chung cư Vĩnh Phước, khu B, Bắc Nha Trang, Khánh Hòa
Email hỗ trợ: support@bun-bo-chung-cu.io.vn
"
        };

        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            if (_configuration["Environment"] == "Development")
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            }

            var host = smtpSettings["Host"];
            if (string.IsNullOrEmpty(host))
            {
                _logger.LogError("SMTP Host is not configured.");
                return;
            }
            var port = int.Parse(smtpSettings["Port"] ?? "587");
            var user = smtpSettings["Username"];
            var pass = smtpSettings["Password"];

            await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
            
            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await client.AuthenticateAsync(user, pass);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Welcome email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
        }
    }

    public async Task SendForgotPasswordEmailAsync(string email, string username, string otpCode)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var senderEmail = smtpSettings["SupportSenderEmail"] ?? smtpSettings["DefaultSenderEmail"] ?? smtpSettings["SenderEmail"] ?? "support@bun-bo-chung-cu.io.vn";
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Bún bò Chung Cư Support", senderEmail));
        message.To.Add(new MailboxAddress(username, email));
        message.Subject = "Mã xác thực khôi phục mật khẩu";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Khôi phục mật khẩu</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <div style=""padding: 40px 10px;"">
        <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"">
            <div style=""background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;"">
                <h1 style=""color: #D9381E; margin: 0; font-size: 24px; font-weight: bold;"">BÚN BÒ CHUNG CƯ</h1>
            </div>
            <div style=""padding: 30px; color: #333333; line-height: 1.6;"">
                <h2 style=""font-size: 20px; margin-top: 0;"">Khôi phục mật khẩu</h2>
                <p>Xin chào {username},</p>
                <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây:</p>
                <div style=""background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; text-align: center; margin: 25px 0; border-radius: 6px;"">
                    <span style=""font-size: 32px; font-weight: bold; color: #D9381E; letter-spacing: 5px;"">{otpCode}</span>
                </div>
                <p style=""font-size: 14px; color: #666666;"">Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong>.</p>
                <p style=""font-size: 14px; color: #666666;"">Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
            </div>
            <div style=""padding: 20px; background-color: #f4f4f4; text-align: center; font-size: 12px; color: #777777;"">
                <p style=""margin: 0 0 5px 0;""><strong>Bún bò Chung Cư Support Team</strong></p>
                <p style=""margin: 0;"">Đây là email tự động, vui lòng không phản hồi.</p>
            </div>
        </div>
    </div>
</body>
</html>",
            TextBody = $@"
Khôi phục mật khẩu

Xin chào {username},

Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây:

Mã xác thực: {otpCode}

Mã xác thực này có hiệu lực trong vòng 5 phút.
Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.

---
Bún bò Chung Cư Support Team
Đây là email tự động, vui lòng không phản hồi.
"
        };

        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            if (_configuration["Environment"] == "Development")
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            }

            var host = smtpSettings["Host"];
            if (string.IsNullOrEmpty(host))
            {
                _logger.LogError("SMTP Host is not configured.");
                return;
            }
            var port = int.Parse(smtpSettings["Port"] ?? "587");
            var user = smtpSettings["Username"];
            var pass = smtpSettings["Password"];

            await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
            
            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await client.AuthenticateAsync(user, pass);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Forgot password email sent successfully to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send forgot password email to {Email}", email);
        }
    }

    public async Task SendVoucherHuntEmailAsync(string email, string username, string code, string description, decimal discountValue, int discountType, int totalUsageLimit, DateTime? validFrom, DateTime? validTo)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var senderEmail = smtpSettings["DefaultSenderEmail"] ?? smtpSettings["SenderEmail"] ?? "noreply@bun-bo-chung-cu.io.vn";
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Bún bò Chung Cư", senderEmail));
        message.To.Add(new MailboxAddress(username, email));
        message.Subject = "Thông báo mã ưu đãi mới: " + code;

        string discountText = discountType == 0 ? $"{discountValue}%" : $"{discountValue:N0}đ";
        string validFromStr = validFrom.HasValue ? validFrom.Value.ToString("dd/MM/yyyy HH:mm") : "Ngay lúc này";
        string validToStr = validTo.HasValue ? validTo.Value.ToString("dd/MM/yyyy HH:mm") : "Không giới hạn";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Mã ưu đãi mới</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <div style=""padding: 40px 10px;"">
        <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"">
            <div style=""background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;"">
                <h1 style=""color: #D9381E; margin: 0; font-size: 24px; font-weight: bold;"">BÚN BÒ CHUNG CƯ</h1>
            </div>
            <div style=""background-color: #f8f9fa; padding: 30px 20px; text-align: center;"">
                <h2 style=""margin: 0; font-size: 20px; color: #333333;"">Mã Ưu Đãi Mới</h2>
            </div>
            <div style=""padding: 30px; color: #333333; line-height: 1.6;"">
                <p>Xin chào {username},</p>
                <p>Hệ thống vừa cập nhật một mã ưu đãi mới dành cho bạn. Thông tin chi tiết như sau:</p>
                
                <div style=""background-color: #ffffff; border: 1px solid #e9ecef; border-left: 4px solid #D9381E; border-radius: 6px; padding: 20px; text-align: left; margin: 25px 0;"">
                    <p style=""margin: 0 0 5px 0; font-size: 14px; color: #666666;"">Mã thanh toán:</p>
                    <div style=""font-size: 28px; font-weight: bold; color: #D9381E; margin-bottom: 10px;"">{code}</div>
                    <p style=""margin: 0 0 5px 0;""><strong>Ưu đãi:</strong> Giảm {discountText} ({description})</p>
                    <p style=""margin: 0 0 5px 0;""><strong>Giới hạn:</strong> {totalUsageLimit} lượt sử dụng</p>
                    <p style=""margin: 0;""><strong>Thời gian:</strong> Từ {validFromStr} đến {validToStr}</p>
                </div>

                <div style=""text-align: center; margin-top: 30px;"">
                    <a href=""https://bun-bo-chung-cu.io.vn/"" style=""display: inline-block; background-color: #D9381E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;"">Sử dụng ưu đãi</a>
                </div>
            </div>
            <div style=""padding: 20px; background-color: #f4f4f4; text-align: center; font-size: 12px; color: #777777;"">
                <p style=""margin: 0 0 5px 0;""><strong>Bún bò Chung Cư Team</strong></p>
                <p style=""margin: 0;"">634 Đ.2/4, Chung cư Vĩnh Phước, khu B, Bắc Nha Trang, Khánh Hòa</p>
            </div>
        </div>
    </div>
</body>
</html>",
            TextBody = $@"
Mã ưu đãi mới: {code}

Xin chào {username},

Hệ thống vừa cập nhật một mã ưu đãi mới dành cho bạn. Thông tin chi tiết như sau:

Mã thanh toán: {code}
Ưu đãi: Giảm {discountText} ({description})
Giới hạn: {totalUsageLimit} lượt sử dụng
Thời gian: Từ {validFromStr} đến {validToStr}

Truy cập hệ thống để sử dụng: https://bun-bo-chung-cu.io.vn/

---
Bún bò Chung Cư Team
634 Đ.2/4, Chung cư Vĩnh Phước, khu B, Bắc Nha Trang, Khánh Hòa
"
        };

        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            if (_configuration["Environment"] == "Development")
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            }

            var host = smtpSettings["Host"];
            if (string.IsNullOrEmpty(host))
            {
                _logger.LogError("SMTP Host is not configured.");
                return;
            }
            var port = int.Parse(smtpSettings["Port"] ?? "587");
            var user = smtpSettings["Username"];
            var pass = smtpSettings["Password"];

            await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
            
            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await client.AuthenticateAsync(user, pass);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Voucher hunt email sent successfully to {Email} for code {Code}", email, code);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send voucher hunt email to {Email}", email);
        }
    }
}
