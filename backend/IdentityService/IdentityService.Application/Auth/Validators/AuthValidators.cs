using FluentValidation;

namespace IdentityService.Application.Auth.Validators;

public class RegisterCommandValidator : AbstractValidator<Commands.RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(v => v.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống.")
            .MinimumLength(3).WithMessage("Tên đăng nhập phải ít nhất 3 ký tự.");

        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không hợp lệ.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu phải ít nhất 8 ký tự.")
            .Matches(@"[A-Z]").WithMessage("Mật khẩu phải có ít nhất 1 chữ hoa.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");
    }
}

public class LoginCommandValidator : AbstractValidator<Commands.LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(v => v.Username).NotEmpty().WithMessage("Tên đăng nhập không được để trống.");
        RuleFor(v => v.Password).NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}
