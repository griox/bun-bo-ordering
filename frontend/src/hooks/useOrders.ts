'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, statusInt }: { orderId: string, statusInt: number }) => {
      await axiosInstance.put(`/api/orders/${orderId}/status?status=${statusInt}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
    }
  });
};

export const useOrders = (status?: string, skip: number = 0, take: number = 50) => {
  return useQuery({
    queryKey: ['orders', status, skip, take],
    queryFn: async () => {
      let url = `/api/orders?skip=${skip}&take=${take}`;
      if (status && status !== 'All') {
        url += `&status=${status}`;
      }
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};
