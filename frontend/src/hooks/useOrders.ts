'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

import { getErrorMessage } from '@/lib/errorUtils';

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
      const msg = getErrorMessage(error);
      toast.error(msg || "Không thể cập nhật trạng thái đơn hàng");
    }
  });
};


export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  skip: number;
  take: number;
}

export const useOrders = (
  status?: string,
  skip: number = 0,
  take: number = 20,
  fromDate?: string,
  toDate?: string,
  keyword?: string,
) => {
  const { token } = useAuthStore();
  return useQuery<PagedResult<Order>>({
    queryKey: ['orders', status, skip, take, fromDate, toDate, keyword],
    enabled: !!token,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('skip', String(skip));
      params.set('take', String(take));

      if (status && status !== 'All') {
        const statuses: Record<string, number> = { 'Unpaid': 3, 'Paid': 1, 'Completed': 4 };
        const statusValue = statuses[status] !== undefined ? statuses[status] : status;
        params.set('status', String(statusValue));
      }
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate)   params.set('toDate', toDate);
      if (keyword && keyword.trim()) params.set('keyword', keyword.trim());

      const response = await axiosInstance.get(`/api/orders?${params.toString()}`);

      // Handle both raw array and PagedResult
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          totalCount: response.data.length,
          skip,
          take,
        };
      }
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
