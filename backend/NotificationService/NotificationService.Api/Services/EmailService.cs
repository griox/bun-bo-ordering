using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NotificationService.Api.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string email, string username);
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
        var senderEmail = smtpSettings["DefaultSenderEmail"] ?? smtpSettings["SenderEmail"];
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Bún bò Chung Cư", senderEmail));
        message.To.Add(new MailboxAddress(username, email));
        message.Subject = "Chào mừng bạn đến với Hệ thống đặt món Bún bò Chung Cư!";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='background-color: #f9f9f9; padding: 40px 0; font-family: ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                        
                        <!-- Header with Brand -->
                        <div style='background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;'>
                            <h1 style='color: #ff4d4f; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;'>
                                <span style='font-weight: 300; color: #333;'>BUN BO</span> CHUNG CU
                            </h1>
                        </div>

                        <!-- Hero Image -->
                        <div style='width: 100%; height: 300px; background: url(""https://bun-bo-chung-cu.io.vn/images/Gemini_Generated_Image_w39rcaw39rcaw39r.png"") center/cover;'>
                        </div>

                        <!-- Content Body -->
                        <div style='padding: 40px; color: #444; line-height: 1.6;'>
                            <h2 style='color: #222; font-size: 24px; margin-top: 0; margin-bottom: 20px;'>Chào mừng {username}!</h2>
                            
                            <p style='margin-bottom: 20px; font-size: 16px;'>Cảm ơn bạn đã trở thành một phần của đại gia đình <strong>Bun Bo Chung Cu</strong>. Chúng tôi rất hào hứng được phục vụ bạn những tô bún bò đậm đà, chuẩn vị nhất.</p>
                            
                            <div style='background-color: #fff9f9; border-left: 4px solid #ff4d4f; padding: 15px 20px; margin: 25px 0;'>
                                <p style='margin: 5px 0; font-weight: 600;'>💡 Tại sao bạn sẽ thích chúng tôi?</p>
                                <ul style='margin: 10px 0; padding-left: 20px; font-size: 14px; color: #666;'>
                                    <li>Đặt món nhanh chóng tại bàn, không cần chờ đợi.</li>
                                    <li>Theo dõi hành trình đơn hàng thời gian thực.</li>
                                    <li>Tích điểm đổi quà cho mỗi lần đặt món.</li>
                                </ul>
                            </div>

                            <p style='margin-bottom: 30px; font-size: 16px;'>Sẵn sàng để thưởng thức chưa?</p>

                            <div style='text-align: center;'>
                                <a href='https://bun-bo-chung-cu.io.vn/' style='display: inline-block; background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 77, 79, 0.3); transition: all 0.3s ease;'>
                                    👉 KHÁM PHÁ THỰC ĐƠN NGAY
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='padding: 30px 40px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;'>
                            <p style='font-size: 12px; color: #999; margin-bottom: 10px;'>Bạn nhận được email này vì đã đăng ký tại Bun Bo Chung Cu.</p>
                            <p style='font-size: 12px; color: #999; margin: 0;'>© 2026 Bun Bo Chung Cu Team. All Rights Reserved.</p>
                        </div>
                    </div>
                    
                    <div style='text-align: center; margin-top: 25px;'>
                        <p style='font-size: 11px; color: #bbb;'>Nếu bạn không muốn nhận email này nữa, hãy <a href=""#"" style=""color: #bbb; text-decoration: underline;"">hủy đăng ký</a>.</p>
                    </div>
                </div>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            
            // For testing/development, we often skip certificate validation or use specific settings
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var host = smtpSettings["Host"];
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
            // We don't throw here to avoid message being stuck in queue if email fails, 
            // but in production you might want to use a retry policy.
        }
    }
}
