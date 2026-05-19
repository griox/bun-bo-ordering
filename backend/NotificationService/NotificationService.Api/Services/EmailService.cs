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
        message.Subject = "Chào mừng bạn đến với Hệ thống đặt món Bún bò Chung Cư!";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='background-color: #f9f9f9; padding: 40px 0; font-family: ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                        
                        <!-- Header with Brand -->
                        <div style='background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;'>
                            <h1 style='color: #D9381E; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;'>
                                <span style='font-weight: 300; color: #000000;'>BUN BO</span> CHUNG CU
                            </h1>
                        </div>

                        <!-- Hero Image -->
                        <div style='width: 100%; height: 300px; background: url(""https://bun-bo-chung-cu.io.vn/images/Gemini_Generated_Image_w39rcaw39rcaw39r.png"") center/cover;'>
                        </div>

                        <!-- Content Body -->
                        <div style='padding: 40px; color: #2D2D2D; line-height: 1.6;'>
                            <h2 style='color: #000000; font-size: 24px; margin-top: 0; margin-bottom: 20px;'>Chào mừng {username}!</h2>
                            
                            <p style='margin-bottom: 20px; font-size: 16px;'>Cảm ơn bạn đã đăng ký thành viên tại <strong>Bun Bo Chung Cu</strong>. Chúng tôi rất hân hạnh được phục vụ bạn những món ăn đậm đà hương vị truyền thống.</p>
                            
                            <div style='background-color: #fff9f9; border-left: 4px solid #D9381E; padding: 15px 20px; margin: 25px 0;'>
                                <p style='margin: 5px 0; font-weight: 600;'>💡 Trải nghiệm tiện ích cùng chúng tôi:</p>
                                <ul style='margin: 10px 0; padding-left: 20px; font-size: 14px; color: #2D2D2D;'>
                                    <li>Đặt món trực tuyến dễ dàng, không cần xếp hàng.</li>
                                    <li>Cập nhật trạng thái đơn hàng thời gian thực.</li>
                                    <li>Tích lũy điểm thưởng cho mọi đơn hàng.</li>
                                </ul>
                            </div>

                            <div style='text-align: center; margin-top: 30px;'>
                                <a href='https://bun-bo-chung-cu.io.vn/' style='display: inline-block; background: linear-gradient(135deg, #D9381E 0%, #F54A2D 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(217, 56, 30, 0.3);'>
                                    TRẢI NGHIỆM NGAY
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='padding: 30px 40px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;'>
                            <p style='font-size: 12px; color: #999; margin-bottom: 8px;'>
                                <strong>Bún bò Chung Cư Team</strong><br/>
                                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa<br/>
                                Email hỗ trợ: support@bun-bo-chung-cu.io.vn
                            </p>
                            <p style='font-size: 11px; color: #aaa; margin-bottom: 5px;'>Bạn nhận được email này vì đã đăng ký tài khoản tại bun-bo-chung-cu.io.vn</p>
                            <p style='font-size: 11px; color: #aaa; margin: 0;'>© 2026 Bun Bo Chung Cu. All Rights Reserved.</p>
                            <p style='font-size: 11px; color: #bbb; margin-top: 15px;'>Nếu bạn không muốn nhận email này nữa, <a href=""mailto:support@bun-bo-chung-cu.io.vn?subject=Unsubscribe"" style=""color: #bbb; text-decoration: underline;"">hủy đăng ký tại đây</a>.</p>
                        </div>
                    </div>
                </div>",
            TextBody = $@"
                Chào mừng {username} đến với Bún bò Chung Cư!
                
                Cảm ơn bạn đã đăng ký thành viên tại Bun Bo Chung Cu. Chúng tôi rất hân hạnh được phục vụ bạn những món ăn đậm đà hương vị truyền thống.
                
                💡 Trải nghiệm tiện ích cùng chúng tôi:
                - Đặt món trực tuyến dễ dàng, không cần xếp hàng.
                - Cập nhật trạng thái đơn hàng thời gian thực.
                - Tích lũy điểm thưởng cho mọi đơn hàng.
                
                Trải nghiệm ngay tại: https://bun-bo-chung-cu.io.vn/
                
                ---
                Bún bò Chung Cư Team
                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa
                Email hỗ trợ: support@bun-bo-chung-cu.io.vn
                
                Bạn nhận được email này vì đã đăng ký tài khoản tại bun-bo-chung-cu.io.vn.
                Để hủy đăng ký, vui lòng gửi email đến: support@bun-bo-chung-cu.io.vn với tiêu đề ""Unsubscribe"".
            "
        };

        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            
            // Only skip certificate validation in development environment
            if (_configuration["Environment"] == "Development")
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            }

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
        }
    }

    public async Task SendForgotPasswordEmailAsync(string email, string username, string otpCode)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var senderEmail = smtpSettings["SupportSenderEmail"] ?? smtpSettings["DefaultSenderEmail"] ?? smtpSettings["SenderEmail"] ?? "support@bun-bo-chung-cu.io.vn";
        
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Bún bò Chung Cư Support", senderEmail));
        message.To.Add(new MailboxAddress(username, email));
        message.Subject = "Mã xác thực khôi phục mật khẩu - Bún bò Chung Cư";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='background-color: #f9f9f9; padding: 40px 0; font-family: ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                        
                        <!-- Header with Brand -->
                        <div style='background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;'>
                            <h1 style='color: #D9381E; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;'>
                                <span style='font-weight: 300; color: #000000;'>BUN BO</span> CHUNG CU
                            </h1>
                        </div>

                        <!-- Content Body -->
                        <div style='padding: 40px; color: #2D2D2D; line-height: 1.6;'>
                            <h2 style='color: #000000; font-size: 24px; margin-top: 0; margin-bottom: 20px;'>Khôi phục mật khẩu</h2>
                            
                            <p style='margin-bottom: 20px; font-size: 16px;'>Chào <strong>{username}</strong>,</p>
                            <p style='margin-bottom: 20px; font-size: 16px;'>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây để tiếp tục:</p>
                            
                            <div style='background-color: #fff9f9; border: 1px dashed #D9381E; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px;'>
                                <span style='font-size: 36px; font-weight: 800; color: #D9381E; letter-spacing: 10px;'>{otpCode}</span>
                            </div>

                            <p style='margin-bottom: 10px; font-size: 14px; color: #2D2D2D;'>Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong>.</p>
                            <p style='margin-bottom: 25px; font-size: 14px; color: #2D2D2D;'>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ nếu bạn thấy có dấu hiệu bất thường.</p>
                        </div>

                        <!-- Footer -->
                        <div style='padding: 30px 40px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;'>
                            <p style='font-size: 12px; color: #999; margin-bottom: 8px;'>
                                <strong>Bún bò Chung Cư Support Team</strong><br/>
                                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa
                            </p>
                            <p style='font-size: 11px; color: #aaa; margin-bottom: 5px;'>Đây là email tự động từ hệ thống, vui lòng không phản hồi email này.</p>
                            <p style='font-size: 11px; color: #aaa; margin: 0;'>© 2026 Bun Bo Chung Cu. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>",
            TextBody = $@"
                Khôi phục mật khẩu - Bún bò Chung Cư
                
                Chào {username},
                
                Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây để tiếp tục:
                
                Mã xác thực: {otpCode}
                
                Mã xác thực này có hiệu lực trong vòng 5 phút.
                
                Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.
                
                ---
                Bún bò Chung Cư Support Team
                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa
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
        message.Subject = "🔥 SĂN MÃ ƯU ĐÃI: " + code + " - SỐ LƯỢNG CÓ HẠN!";

        string discountText = discountType == 0 ? $"{discountValue}%" : $"{discountValue:N0}đ";
        string validFromStr = validFrom.HasValue ? validFrom.Value.ToString("dd/MM/yyyy HH:mm") : "Ngay bây giờ";
        string validToStr = validTo.HasValue ? validTo.Value.ToString("dd/MM/yyyy HH:mm") : "Không giới hạn";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style='background-color: #f9f9f9; padding: 40px 0; font-family: ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);'>
                        
                        <!-- Header with Brand -->
                        <div style='background-color: #ffffff; padding: 25px; text-align: center; border-bottom: 1px solid #f0f0f0;'>
                            <h1 style='color: #D9381E; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;'>
                                <span style='font-weight: 300; color: #000000;'>BUN BO</span> CHUNG CU
                            </h1>
                        </div>

                        <!-- Hero Banner -->
                        <div style='background-color: #D9381E; padding: 40px 20px; text-align: center; color: white;'>
                            <h2 style='margin: 0; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;'>MÃ GIẢM GIÁ MỚI!</h2>
                            <p style='margin: 10px 0 0; font-size: 18px; opacity: 0.9;'>{description}</p>
                        </div>

                        <!-- Content Body -->
                        <div style='padding: 40px; color: #2D2D2D; line-height: 1.6;'>
                            <h3 style='color: #000000; font-size: 22px; margin-top: 0; margin-bottom: 15px;'>Chào {username}!</h3>
                            
                            <p style='margin-bottom: 25px; font-size: 16px;'>Hệ thống vừa tung ra một mã ưu đãi cực sốc. Nhanh chân tới quán quét mã order để không bỏ lỡ vì số lượng có hạn!</p>
                            
                            <!-- Voucher Info Card -->
                            <div style='background-color: #fff9f9; border: 2px dashed #D9381E; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;'>
                                <p style='margin: 0 0 10px; font-size: 14px; color: #2D2D2D; text-transform: uppercase; letter-spacing: 1px;'>Nhập mã thanh toán</p>
                                <span style='display: inline-block; font-size: 42px; font-weight: 900; color: #D9381E; letter-spacing: 5px; margin-bottom: 15px;'>{code}</span>
                                <div style='font-size: 20px; font-weight: bold; color: #000000; margin-bottom: 15px;'>Giảm: <span style='color: #D9381E;'>{discountText}</span></div>
                                <div style='display: inline-block; background-color: #D9381E; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;'>
                                    Chỉ có {totalUsageLimit} lượt
                                </div>
                            </div>

                            <p style='margin-bottom: 10px; font-size: 14px; color: #2D2D2D;'><strong>⏳ Thời gian áp dụng:</strong><br>Từ {validFromStr} đến {validToStr}</p>

                            <div style='text-align: center; margin-top: 40px;'>
                                <a href='https://bun-bo-chung-cu.io.vn/' style='display: inline-block; background: linear-gradient(135deg, #D9381E 0%, #F54A2D 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(217, 56, 30, 0.4); text-transform: uppercase;'>
                                    ĐẶT MÓN NGAY
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style='padding: 30px 40px; background-color: #fdfdfd; border-top: 1px solid #f0f0f0; text-align: center;'>
                            <p style='font-size: 12px; color: #999; margin-bottom: 8px;'>
                                <strong>Bún bò Chung Cư Team</strong><br/>
                                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa
                            </p>
                            <p style='font-size: 11px; color: #aaa; margin: 0;'>© 2026 Bun Bo Chung Cu. All Rights Reserved.</p>
                            <p style='font-size: 11px; color: #bbb; margin-top: 15px;'>Nếu bạn không muốn nhận email khuyến mãi nữa, <a href=""mailto:support@bun-bo-chung-cu.io.vn?subject=Unsubscribe"" style=""color: #bbb; text-decoration: underline;"">hủy đăng ký tại đây</a>.</p>
                        </div>
                    </div>
                </div>",
            TextBody = $@"
                SĂN MÃ ƯU ĐÃI: {code} - SỐ LƯỢNG CÓ HẠN!
                
                Chào {username},
                
                Hệ thống vừa tung ra một mã ưu đãi cực sốc. Nhanh tay đặt món để không bỏ lỡ vì số lượng có hạn!
                
                MÃ: {code}
                Ưu đãi: Giảm {discountText} ({description})
                Số lượng: Chỉ có {totalUsageLimit} lượt
                Thời gian: Từ {validFromStr} đến {validToStr}
                
                ĐẶT MÓN NGAY: https://bun-bo-chung-cu.io.vn/
                
                ---
                Bún bò Chung Cư Team
                Địa chỉ: 634 Đ.2/4, Chung cư Vĩnh Phước,khu B, Bắc Nha Trang, Khánh Hòa
                
                Nếu bạn không muốn nhận email khuyến mãi nữa, vui lòng gửi email đến support@bun-bo-chung-cu.io.vn với tiêu đề ""Unsubscribe"".
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
