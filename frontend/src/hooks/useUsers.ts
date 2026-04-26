'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    isBlacklisted: boolean;
    blacklistReason?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export const useUsers = (page: number = 1, pageSize: number = 10, searchTerm: string = '') => {
    return useQuery<PagedResult<User>>({
        queryKey: ['users', page, pageSize, searchTerm],
        queryFn: async () => {
            const url = `/api/identity/users?pageNumber=${page}&pageSize=${pageSize}${searchTerm ? `&searchTerm=${encodeURIComponent(searchTerm)}` : ''}`;
            const response = await axiosInstance.get(url);

            // Fallback for when backend hasn't been restarted and returns a raw array
            if (Array.isArray(response.data)) {
                let filtered = response.data;
                if (searchTerm) {
                    const lowerTerm = searchTerm.toLowerCase();
                    filtered = filtered.filter(u => u.username.toLowerCase().includes(lowerTerm) || u.email.toLowerCase().includes(lowerTerm));
                }
                const startIndex = (page - 1) * pageSize;
                const paginated = filtered.slice(startIndex, startIndex + pageSize);

                return {
                    items: paginated,
                    totalCount: filtered.length,
                    pageNumber: page,
                    pageSize: pageSize
                };
            }

            return response.data;
        },
    });
};

export const useBlacklistUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
            return await axiosInstance.post(`/api/identity/users/${userId}/blacklist?reason=${encodeURIComponent(reason)}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Đã chặn người dùng thành công');
        },
        onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const message = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Lỗi khi chặn người dùng: ${message}`);
        }
    });
};

export const useRemoveBlacklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            return await axiosInstance.delete(`/api/identity/users/${userId}/blacklist`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Đã bỏ chặn người dùng thành công');
        },
        onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const message = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Lỗi khi bỏ chặn người dùng: ${message}`);
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            return await axiosInstance.delete(`/api/identity/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Đã xóa người dùng thành công');
        },
        onError: (error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const message = error.response?.data?.message || error.response?.data || error.message;
            toast.error(`Lỗi khi xóa người dùng: ${message}`);
        }
    });
};
