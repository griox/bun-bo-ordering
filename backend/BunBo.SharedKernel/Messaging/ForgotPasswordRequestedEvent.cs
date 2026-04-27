namespace BunBo.SharedKernel.Messaging;

public record ForgotPasswordRequestedEvent
{
    public string Email { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string OtpCode { get; init; } = string.Empty;
}
