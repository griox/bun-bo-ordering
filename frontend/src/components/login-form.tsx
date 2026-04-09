/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useGoogleLogin } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLoginMutation, useRegisterMutation, useGoogleLoginMutation } from '@/hooks/useAuth';

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

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: () => void;
}

export function LoginForm({
  className,
  onSuccess,
  ...props
}: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);

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

  // TanStack Query Mutations
  const loginMutation = useLoginMutation(onSuccess);
  const googleLoginMutation = useGoogleLoginMutation(onSuccess);
  const registerMutation = useRegisterMutation(() => {
    setIsLogin(true);
    loginForm.setValue('username', registerForm.getValues('username'));
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

  // Reset forms when switching
  useEffect(() => {
    if (isLogin) registerForm.reset();
    else loginForm.reset();
  }, [isLogin, loginForm, registerForm]);

  const loading = loginMutation.isPending || registerMutation.isPending || googleLoginMutation.isPending;

  return (
    <div className={cn("flex flex-col gap-4 md:gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl md:text-5xl font-display font-black text-primary drop-shadow-[1.5px_1.5px_0px_#2D2D2D] uppercase tracking-tight">
          {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h1>
        <p className="text-xs md:text-base font-main text-text/70 italic font-bold max-w-[280px] md:max-w-none">
          {isLogin ? 'Chào mừng bạn quay lại với Bún Bò Phố!' : 'Gia nhập cộng đồng yêu Bún Bò ngay hôm nay'}
        </p>
      </div>

      {isLogin ? (
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="flex flex-col gap-4 md:gap-5">
          <div className="gap-3 md:gap-4">
            <div className="space-y-1">
              <Label className="font-display text-[10px] md:text-xs font-black ml-1 uppercase tracking-wider text-secondary">Tên đăng nhập</Label>
              <Input
                {...loginForm.register('username')}
                placeholder="Ví dụ: nva_123"
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  loginForm.formState.errors.username ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {loginForm.formState.errors.username && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{loginForm.formState.errors.username.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center ml-1">
                <Label className="font-display text-[10px] md:text-xs font-black uppercase tracking-wider text-secondary">Mật khẩu</Label>
                <a href="#" className="ml-auto text-[10px] font-main font-bold italic underline decoration-text/40 underline-offset-2 hover:text-primary transition-colors text-text/50">Quên?</a>
              </div>
              <Input
                {...loginForm.register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  loginForm.formState.errors.password ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {loginForm.formState.errors.password && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{loginForm.formState.errors.password.message}</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 md:h-12 bg-primary text-white font-display text-base md:text-lg font-black uppercase tracking-widest rounded-2xl border-[3px] border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-[2px] active:shadow-none mt-1 md:mt-2 transition-all"
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'Đăng nhập ngay'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="flex flex-col gap-4 md:gap-5">
          <div className="gap-3 md:gap-4 overflow-y-auto max-h-[40vh] md:max-h-none pr-1">
            <div className="space-y-1">
              <Label className="font-display text-[10px] md:text-xs font-black ml-1 uppercase tracking-wider text-secondary">Tên hiển thị</Label>
              <Input
                {...registerForm.register('username')}
                placeholder="Tên của bạn..."
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  registerForm.formState.errors.username ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {registerForm.formState.errors.username && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{registerForm.formState.errors.username.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <Label className="font-display text-[10px] md:text-xs font-black ml-1 uppercase tracking-wider text-secondary">Email liên hệ</Label>
              <Input
                {...registerForm.register('email')}
                placeholder="vi-du@gmail.com"
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  registerForm.formState.errors.email ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {registerForm.formState.errors.email && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{registerForm.formState.errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <Label className="font-display text-[10px] md:text-xs font-black ml-1 uppercase tracking-wider text-secondary">Mật khẩu</Label>
              <Input
                {...registerForm.register('password')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  registerForm.formState.errors.password ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {registerForm.formState.errors.password && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{registerForm.formState.errors.password.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <Label className="font-display text-[10px] md:text-xs font-black ml-1 uppercase tracking-wider text-secondary">Xác nhận</Label>
              <Input
                {...registerForm.register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={cn(
                  "h-10 md:h-11 border-[3px] border-text bg-white font-main text-sm md:text-base px-3 md:px-4 rounded-xl shadow-[2px_2px_0px_#2D2D2D] transition-all",
                  registerForm.formState.errors.confirmPassword ? "border-red-500 shadow-[2px_2px_0px_red]" : "focus:ring-primary focus:border-primary"
                )}
              />
              {registerForm.formState.errors.confirmPassword && (
                <span className="text-[10px] text-red-500 font-bold uppercase ml-2">{registerForm.formState.errors.confirmPassword.message}</span>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 md:h-12 bg-primary text-white font-display text-base md:text-lg font-black uppercase tracking-widest rounded-2xl border-[3px] border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'Tạo tài khoản ngay'}
          </Button>
        </form>
      )}

      {isLogin && (
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 h-[2px] bg-text/10"></div>
            <span className="font-display text-[9px] md:text-[10px] font-black text-text/30 tracking-widest">HOẶC</span>
            <div className="flex-1 h-[2px] bg-text/10"></div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-10 md:h-11 bg-white text-text font-display text-xs md:text-sm font-black uppercase rounded-xl border-[3px] border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1.5px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all"
            onClick={() => handleGoogleLogin()}
          >
            <img src="https://www.google.com/favicon.ico" alt="G" className="mr-2 h-4 w-4" />
            GOOGLE
          </Button>
        </div>
      )}

      <div className="text-center mt-auto">
        <p className="font-main text-xs md:text-sm text-text/60">
          {isLogin ? "Chưa có tài khoản? " : "Đã là thành viên? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-display font-black text-primary hover:text-secondary hover:underline underline-offset-4 transition-all"
          >
            {isLogin ? "ĐĂNG KÝ" : "ĐĂNG NHẬP"}
          </button>
        </p>
      </div>
    </div>
  )
}
