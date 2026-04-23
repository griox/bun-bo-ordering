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
    <div className={cn("flex flex-col gap-6 md:gap-8", className)} {...props}>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl md:text-5xl font-display font-black text-primary tracking-tighter uppercase drop-shadow-[3px_3px_0px_#000000]">
          {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h1>
        <p className="italic text-secondary font-bold tracking-tight text-sm md:text-base">
          {isLogin ? 'Chào mừng bạn quay lại với Bún Bò Phố' : 'Chào mừng đến với cộng đồng yêu bún bò'}
        </p>
      </div>

      {isLogin ? (
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
                <a href="#" className="ml-auto mr-4 text-[10px] font-black italic underline text-black tracking-widest">QUÊN?</a>
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
      ) : (
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

      {isLogin && (
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
            <img src="https://www.google.com/favicon.ico" alt="G" className="mr-3 h-5 w-5" />
            GOOGLE
          </Button>
        </div>
      )}

      <div className="text-center mt-auto">
        <p className="text-[10px] font-display font-black text-black tracking-widest uppercase">
          {isLogin ? "CHƯA CÓ TÀI KHOẢN? " : "ĐÃ LÀ THÀNH VIÊN? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-black hover:underline transition-all ml-1"
          >
            {isLogin ? "ĐĂNG KÝ" : "ĐĂNG NHẬP"}
          </button>
        </p>
      </div>
    </div>
  )
}
