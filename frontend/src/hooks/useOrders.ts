'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

export interface OrderItem {
  id: string;
  orderId?: string;
  dishId?: string;
  foodId?: string;
  dishName?: string;
  productName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  note?: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableCode?: string;
  tableName?: string;
  totalAmount: number;
  status: 'Unpaid' | 'Paid' | 'Confirmed' | 'Completed' | 'Cancelled' | number | string;
  orderItems: OrderItem[];
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

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
  return useQuery<Order[]>({
    queryKey: ['orders', status, skip, take],
    queryFn: async () => {
      let url = `/api/orders?skip=${skip}&take=${take}`;
      if (status && status !== 'All') {
        const statuses: Record<string, number> = { 'Unpaid': 0, 'Paid': 1 };
        const statusValue = statuses[status] !== undefined ? statuses[status] : status;
        url += `&status=${statusValue}`;
      }
      const response = await axiosInstance.get(url);
      return response.data;
    },
  });
};

export const useSessionOrders = (sessionId?: string) => {
  return useQuery<Order[]>({
    queryKey: ['sessionData', sessionId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/orders/tablesession/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });
};

export const useOrder = (orderId?: string) => {
  return useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/orders/${orderId}`);
      return response.data;
    },
    enabled: !!orderId,
  });
};

export const useCustomerOrders = (customerId?: string) => {
  return useQuery<Order[]>({
    queryKey: ['customerOrders', customerId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/orders/customer/${customerId}`);
      return response.data;
    },
    enabled: !!customerId,
  });
};
