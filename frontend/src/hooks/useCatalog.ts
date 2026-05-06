'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/errorUtils';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Food {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
  categoryName?: string;
}

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/catalog/categories');
      return response.data;
    },
  });
};

export const useFoodsByCategory = (categoryId: number | null) => {
  return useQuery<Food[]>({
    queryKey: ['foods-category', categoryId],
    queryFn: async () => {
      if (categoryId === null) return [];
      const response = await axiosInstance.get(`/api/catalog/foods/category/${categoryId}`);
      return response.data;
    },
    enabled: categoryId !== null,
  });
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  skip: number;
  take: number;
}

export const useAllFoods = (skip: number = 0, take: number = 50) => {
  return useQuery<PagedResult<Food>>({
    queryKey: ['all-foods', skip, take],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/catalog/foods?skip=${skip}&take=${take}`);

      // Handle both raw array and PagedResult
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          totalCount: response.data.length,
          skip: skip,
          take: take
        };
      }

      return response.data;
    },
  });
};

export const useCreateFoodMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      await axiosInstance.post('/api/catalog/foods', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-foods'] });
      queryClient.invalidateQueries({ queryKey: ['foods-category'] });
      toast.success("Thêm món ăn thành công!");
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      toast.error(msg || "Có lỗi xảy ra khi tạo món");
    }
  });
};

export const useUpdateFoodMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      await axiosInstance.put(`/api/catalog/foods/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-foods'] });
      queryClient.invalidateQueries({ queryKey: ['foods-category'] });
      toast.success("Cập nhật món ăn thành công!");
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      toast.error(msg || "Có lỗi xảy ra khi cập nhật món");
    }
  });
};

export const useDeleteFoodMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/catalog/foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-foods'] });
      queryClient.invalidateQueries({ queryKey: ['foods-category'] });
      toast.success("Đã xóa món ăn");
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      toast.error(msg || "Lỗi khi xóa món ăn");
    }
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await axiosInstance.post('/api/catalog/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Thêm danh mục thành công!");
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      toast.error(msg || "Có lỗi xảy ra khi tạo danh mục");
    }
  });
};

