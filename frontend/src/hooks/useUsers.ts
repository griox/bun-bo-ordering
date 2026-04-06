'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
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
