'use client';

import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export const useLoginMutation = (onSuccessCallback?: () => void) => {
  const loginAction = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await axiosInstance.post('/api/identity/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      const { token, userId, username, email, role } = data;
      loginAction(token, { userId, username, email, role });
      toast.success(`Chào mừng, ${username}!`);
      onSuccessCallback?.();
      router.push(role === 'Admin' ? '/admin' : '/');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } | string } };
      const data = error.response?.data;
      const msg = typeof data === 'string' ? data : data?.message;
      toast.error(msg || 'Email hoặc mật khẩu không chính xác!');
    },
  });
};

export const useRegisterMutation = (onSuccessCallback?: () => void) => {
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
      const error = err as { response?: { data?: { message?: string } | string } };
      const data = error.response?.data;
      const msg = typeof data === 'string' ? data : data?.message;
      toast.error(msg || 'Đăng ký thất bại, vui lòng thử lại!');
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
      const { token, userId, username, email, role } = data;
      loginAction(token, { userId, username, email, role });
      toast.success(`Chào mừng, ${username}!`);
      onSuccessCallback?.();
      router.push(role === 'Admin' ? '/admin' : '/');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: string } };
      toast.error(error.response?.data || 'Đăng nhập Google thất bại!');
    },
  });
};
