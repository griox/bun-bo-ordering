/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useGoogleLogin } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Controller } from 'react-hook-form';
import { useLoginMutation, useRegisterMutation, useGoogleLoginMutation, useForgotPasswordMutation, useVerifyOtpMutation, useResetPasswordMutation } from '@/hooks/useAuth';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

// Login Schema
const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

// Register Schema
const registerSchema = z.object({
  username: z.string().min(3, "Tên hiển thị phải từ 3 ký tự"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const forgotEmailSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
});

const forgotOtpSchema = z.object({
  otpCode: z.string().length(6, 'Mã OTP phải có 6 chữ số'),
});

const passwordRules = z.string()
  .min(8, 'Mật khẩu phải ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Phải có ít nhất 1 chữ số')
  .regex(/[^A-Za-z0-9]/, 'Phải có ít nhất 1 ký tự đặc biệt (!@#$%...)');

const forgotNewPasswordSchema = z.object({
  newPassword: passwordRules,
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

type ViewState = 'LOGIN' | 'REGISTER' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'FORGOT_NEW_PASSWORD';

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: () => void;
}

export function LoginForm({
  className,
  onSuccess,
  ...props
}: LoginFormProps) {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [forgotEmail, setForgotEmail] = useState('');

  // Form for Login
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' }
  });

  // Form for Register
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' }
  });

  const emailForm = useForm<z.infer<typeof forgotEmailSchema>>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<z.infer<typeof forgotOtpSchema>>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: { otpCode: '' },
  });

  const newPasswordForm = useForm<z.infer<typeof forgotNewPasswordSchema>>({
    resolver: zodResolver(forgotNewPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // TanStack Query Mutations
  const loginMutation = useLoginMutation(onSuccess, (errData) => {
    if (errData?.errors) {
      Object.keys(errData.errors).forEach((key) => {
        const fieldName = key.toLowerCase() as keyof LoginValues;
        loginForm.setError(fieldName, {
          type: 'manual',
          message: errData.errors[key][0],
        });
      });
    }
  });
  const googleLoginMutation = useGoogleLoginMutation(onSuccess);
  const registerMutation = useRegisterMutation(() => {
    setView('LOGIN');
    loginForm.setValue('username', registerForm.getValues('username'));
  }, (errData) => {
    if (errData?.errors) {
      Object.keys(errData.errors).forEach((key) => {
        const fieldName = key.toLowerCase() as keyof RegisterValues;
        registerForm.setError(fieldName, {
          type: 'manual',
          message: errData.errors[key][0],
        });
      });
    }
  });

  const forgotPasswordMutation = useForgotPasswordMutation(() => {
    setView('FORGOT_OTP');
  }, (errData: any) => {
    if (errData?.errors?.Email) {
      emailForm.setError('email', { message: errData.errors.Email[0] });
    }
  });

  const verifyOtpMutation = useVerifyOtpMutation(() => {
    setView('FORGOT_NEW_PASSWORD');
  }, (errData: any) => {
    if (errData?.errors?.OtpCode) {
      otpForm.setError('otpCode', { message: errData.errors.OtpCode[0] });
    }
  });

  const resetPasswordMutation = useResetPasswordMutation(() => {
    setView('LOGIN');
    emailForm.reset();
    otpForm.reset();
    newPasswordForm.reset();
  }, (errData: any) => {
    if (errData?.errors) {
      Object.keys(errData.errors).forEach((key) => {
        const fieldName = key.charAt(0).toLowerCase() + key.slice(1) as any;
        newPasswordForm.setError(fieldName, {
          type: 'manual',
          message: errData.errors[key][0],
        });
      });
    }
  });

  const onLoginSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterValues) => {
    registerMutation.mutate(data);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleLoginMutation.mutate(tokenResponse.access_token);
    },
    onError: () => {
      // Toast error is handled inside the hook
    },
  });

  const onEmailSubmit = (data: z.infer<typeof forgotEmailSchema>) => {
    setForgotEmail(data.email);
    forgotPasswordMutation.mutate(data);
  };

  const onOtpSubmit = (data: z.infer<typeof forgotOtpSchema>) => {
    verifyOtpMutation.mutate({
      email: forgotEmail,
      otpCode: data.otpCode,
    });
  };

  const onNewPasswordSubmit = (data: z.infer<typeof forgotNewPasswordSchema>) => {
    resetPasswordMutation.mutate({
      email: forgotEmail,
      otpCode: otpForm.getValues('otpCode'),
      newPassword: data.newPassword,
    });
  };

  // Reset forms when switching
  useEffect(() => {
    if (view === 'LOGIN') registerForm.reset();
    if (view === 'REGISTER') loginForm.reset();
  }, [view, loginForm, registerForm]);

  const loading = loginMutation.isPending || registerMutation.isPending || googleLoginMutation.isPending || forgotPasswordMutation.isPending || verifyOtpMutation.isPending || resetPasswordMutation.isPending;

  const getTitle = () => {
    if (view === 'LOGIN') return 'Đăng nhập';
    if (view === 'REGISTER') return 'Tạo tài khoản';
    return 'Khôi phục mật khẩu';
  };

  const getSubtitle = () => {
    if (view === 'LOGIN') return 'Chào mừng bạn quay lại với Bún Bò Phố';
    if (view === 'REGISTER') return 'Chào mừng đến với cộng đồng yêu bún bò';
    if (view === 'FORGOT_EMAIL') return 'Nhập email để nhận mã OTP khôi phục';
    if (view === 'FORGOT_OTP') return 'Nhập mã OTP (6 số) được gửi qua e-mail';
    if (view === 'FORGOT_NEW_PASSWORD') return 'Thiết lập mật khẩu mới cho tài khoản';
    return '';
  };

  return (
    <div className={cn("flex flex-col gap-6 md:gap-8", className)} {...props}>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-black text-primary tracking-tighter uppercase drop-shadow-[3px_3px_0px_#000000]">
          {getTitle()}
        </h1>
        <p className="italic text-secondary font-bold tracking-tight text-sm md:text-base">
          {getSubtitle()}
        </p>
      </div>

      {view === 'LOGIN' && (
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Tên đăng nhập</Label>
              <Input
                {...loginForm.register('username')}
                placeholder="Ví dụ: nva_123"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] transition-all placeholder:text-neutral-400 placeholder:italic",
                  loginForm.formState.errors.username ? "border-red-500" : "focus:border-black focus:ring-0"
                )}
              />
              {loginForm.formState.errors.username && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{loginForm.formState.errors.username.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center ml-4">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-black">Mật khẩu</Label>
                <button
                  type="button"
                  onClick={() => setView('FORGOT_EMAIL')}
                  className="ml-auto mr-4 text-[10px] font-black italic underline text-black tracking-widest hover:text-primary transition-colors"
                >
                  QUÊN?
                </button>
              </div>
              <Input
                {...loginForm.register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] transition-all placeholder:text-neutral-400 placeholder:italic",
                  loginForm.formState.errors.password ? "border-red-500" : "focus:border-black focus:ring-0"
                )}
              />
              {loginForm.formState.errors.password && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{loginForm.formState.errors.password.message}</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary text-white font-display font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none mt-4 transition-all"
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP NGAY'}
            </Button>
          </div>
        </form>
      )}

      {view === 'REGISTER' && (
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[40vh] md:max-h-none pr-1 custom-scrollbar">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Tên hiển thị</Label>
              <Input
                {...registerForm.register('username')}
                placeholder="Tên của bạn..."
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] focus:border-black focus:ring-0 transition-all placeholder:text-neutral-400 placeholder:italic",
                  registerForm.formState.errors.username ? "border-red-500" : ""
                )}
              />
              {registerForm.formState.errors.username && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{registerForm.formState.errors.username.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Email liên hệ</Label>
              <Input
                {...registerForm.register('email')}
                placeholder="vi-du@gmail.com"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] focus:border-black focus:ring-0 transition-all placeholder:text-neutral-400 placeholder:italic",
                  registerForm.formState.errors.email ? "border-red-500" : ""
                )}
              />
              {registerForm.formState.errors.email && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{registerForm.formState.errors.email.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Mật khẩu</Label>
              <Input
                {...registerForm.register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] focus:border-black focus:ring-0 transition-all placeholder:text-neutral-400 placeholder:italic",
                  registerForm.formState.errors.password ? "border-red-500" : ""
                )}
              />
              {registerForm.formState.errors.password && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{registerForm.formState.errors.password.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Xác nhận</Label>
              <Input
                {...registerForm.register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] focus:border-black focus:ring-0 transition-all placeholder:text-neutral-400 placeholder:italic",
                  registerForm.formState.errors.confirmPassword ? "border-red-500" : ""
                )}
              />
              {registerForm.formState.errors.confirmPassword && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{registerForm.formState.errors.confirmPassword.message}</span>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-primary text-white font-display font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none mt-6 transition-all"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'TẠO TÀI KHOẢN NGAY'}
          </Button>
        </form>
      )}

      {view === 'FORGOT_EMAIL' && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-black ml-4">Email đăng ký</Label>
            <Input
              {...emailForm.register('email')}
              placeholder="Ví dụ: email@domain.com"
              className={cn(
                "h-14 bg-white border-2 border-black font-bold text-sm md:text-base px-8 rounded-2xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] transition-all placeholder:text-neutral-400 placeholder:italic",
                emailForm.formState.errors.email ? "border-red-500" : "focus:border-black focus:ring-0"
              )}
            />
            {emailForm.formState.errors.email && (
              <span className="text-[10px] text-red-500 font-bold uppercase ml-6 tracking-wider italic">{emailForm.formState.errors.email.message}</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full h-16 bg-primary text-white font-display font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none mt-4 transition-all"
          >
            {forgotPasswordMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> ĐANG XỬ LÝ...</>
            ) : 'GỬI MÃ XÁC THỰC'}
          </Button>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => setView('LOGIN')}
              className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-black underline underline-offset-4 transition-colors"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      )}

      {view === 'FORGOT_OTP' && (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="flex flex-col gap-5">
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-black text-center block">Mã xác thực OTP (6 chữ số)</Label>
            <div className="flex justify-center">
              <Controller
                control={otpForm.control}
                name="otpCode"
                render={({ field }) => (
                  <InputOTP
                    maxLength={6}
                    value={field.value || ''}
                    onChange={field.onChange}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-12 h-14 bg-white border-2 border-black rounded-xl font-black text-xl shadow-[2px_2px_0px_#000000]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>
            {otpForm.formState.errors.otpCode && (
              <div className="text-center">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider italic">{otpForm.formState.errors.otpCode.message}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={verifyOtpMutation.isPending}
              className="w-full h-16 bg-primary text-white font-display font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {verifyOtpMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> ĐANG XÁC THỰC...</>
              ) : 'TIẾP TỤC'}
            </Button>
            <div className="flex justify-between px-2">
              <button
                type="button"
                onClick={() => setView('FORGOT_EMAIL')}
                className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-black underline underline-offset-4 transition-colors"
              >
                Gửi lại mã?
              </button>
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-black underline underline-offset-4 transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </form>
      )}

      {view === 'FORGOT_NEW_PASSWORD' && (
        <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-black ml-4">Mật khẩu mới</Label>
              <Input
                {...newPasswordForm.register('newPassword')}
                type="password"
                placeholder="••••••"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold rounded-xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] transition-all px-6",
                  newPasswordForm.formState.errors.newPassword ? "border-red-500" : "focus:border-black focus:ring-0"
                )}
              />
              {newPasswordForm.formState.errors.newPassword && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-4 tracking-wider italic">{newPasswordForm.formState.errors.newPassword.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-black ml-4">Xác nhận MK</Label>
              <Input
                {...newPasswordForm.register('confirmPassword')}
                type="password"
                placeholder="••••••"
                className={cn(
                  "h-14 bg-white border-2 border-black font-bold rounded-xl shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.08)] transition-all px-6",
                  newPasswordForm.formState.errors.confirmPassword ? "border-red-500" : "focus:border-black focus:ring-0"
                )}
              />
              {newPasswordForm.formState.errors.confirmPassword && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-4 tracking-wider italic">{newPasswordForm.formState.errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full h-16 bg-primary text-white font-display font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {resetPasswordMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> ĐANG CẬP NHẬT...</>
              ) : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
            </Button>
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-black underline underline-offset-4 transition-colors"
              >
                Hủy bỏ và quay lại
              </button>
            </div>
          </div>
        </form>
      )}


      {view === 'LOGIN' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mt-2">
            <span className="text-[10px] font-black text-black tracking-[0.3em]">HOẶC</span>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-16 bg-white text-black font-display font-black text-sm tracking-[0.2em] rounded-2xl border-2 border-black transition-all hover:bg-neutral-50 shadow-[3px_3px_0px_rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.15)] active:translate-y-[2px] active:shadow-none !shadow-[3px_3px_0px_rgba(0,0,0,0.12)]"
            onClick={() => handleGoogleLogin()}
          >
            <Image src="https://www.google.com/favicon.ico" alt="G" width={20} height={20} className="mr-3" />
            GOOGLE
          </Button>
        </div>
      )}

      <div className="text-center mt-auto">
        {(view === 'LOGIN' || view === 'REGISTER') && (
          <div className="text-center mt-auto pb-2">
            <p className="text-[10px] font-display font-black text-black tracking-widest uppercase">
              {view === 'LOGIN' ? "CHƯA CÓ TÀI KHOẢN? " : "ĐÃ LÀ THÀNH VIÊN? "}
              <button
                type="button"
                onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                className="text-primary font-black hover:underline transition-all ml-1"
              >
                {view === 'LOGIN' ? "ĐĂNG KÝ" : "ĐĂNG NHẬP"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
