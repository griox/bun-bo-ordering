/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { getErrorMessage } from '@/lib/errorUtils';


export const useLoginMutation = (onSuccessCallback?: () => void, onErrorCallback?: (errData: any) => void) => {
  const loginAction = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await axiosInstance.post('/api/identity/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      const token = data.token || data.Token;
      const refreshToken = data.refreshToken || data.RefreshToken;
      const userId = data.userId || data.UserId;
      const username = data.username || data.Username;
      const email = data.email || data.Email;
      const role = data.role || data.Role;

      loginAction(token, refreshToken, { userId, username, email, role });
      toast.success(`Chào mừng, ${username || 'bạn'}!`);
      onSuccessCallback?.();
      router.push(role === 'Admin' ? '/admin' : '/');
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Email hoặc mật khẩu không chính xác!');
      const data = (err as any).response?.data;
      if (data) onErrorCallback?.(data);
    },
  });
};

export const useRegisterMutation = (onSuccessCallback?: () => void, onErrorCallback?: (errData: any) => void) => {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await axiosInstance.post('/api/identity/register', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Đăng ký thất bại, vui lòng thử lại!');
      const data = (err as any).response?.data;
      if (data) onErrorCallback?.(data);
    },
  });
};

export const useGoogleLoginMutation = (onSuccessCallback?: () => void) => {
  const loginAction = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (accessToken: string) => {
      const response = await axiosInstance.post('/api/identity/google-login', {
        accessToken,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const token = data.token || data.Token;
      const refreshToken = data.refreshToken || data.RefreshToken;
      const userId = data.userId || data.UserId;
      const username = data.username || data.Username;
      const email = data.email || data.Email;
      const role = data.role || data.Role;

      loginAction(token, refreshToken, { userId, username, email, role });
      toast.success(`Chào mừng, ${username || 'bạn'}!`);
      onSuccessCallback?.();
      router.push(role === 'Admin' ? '/admin' : '/');
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Đăng nhập Google thất bại!');
    },
  });
};

export const useForgotPasswordMutation = (onSuccessCallback?: () => void, onErrorCallback?: (errData: any) => void) => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await axiosInstance.post('/api/identity/forgot-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Mã OTP đã được gửi đến email của bạn.');
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Gửi mã OTP thất bại!');
      const data = (err as any).response?.data;
      if (data) onErrorCallback?.(data);
    },
  });
};

export const useVerifyOtpMutation = (onSuccessCallback?: () => void, onErrorCallback?: (errData: any) => void) => {
  return useMutation({
    mutationFn: async (data: { email: string; otpCode: string }) => {
      const response = await axiosInstance.post('/api/identity/verify-otp', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xác thực mã OTP thành công!');
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Mã OTP không hợp lệ!');
      const data = (err as any).response?.data;
      if (data) onErrorCallback?.(data);
    },
  });
};

export const useResetPasswordMutation = (onSuccessCallback?: () => void, onErrorCallback?: (errData: any) => void) => {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await axiosInstance.post('/api/identity/reset-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Mật khẩu của bạn đã được đặt lại!');
      onSuccessCallback?.();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      toast.error(msg || 'Đặt lại mật khẩu thất bại!');
      const data = (err as any).response?.data;
      if (data) onErrorCallback?.(data);
    },
  });
};
