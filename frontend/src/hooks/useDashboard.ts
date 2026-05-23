'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface WeeklyRevenue {
    date: string;
    dayOfWeek: string;
    revenueCash: number;
    revenueTransfer: number;
}

export interface OrderSummary {
    id: string;
    tableCode: string;
    tableName: string;
    createdAt: string;
    totalAmount: number;
    status: number;
    note: string | null;
    paymentMethod: string;
}

export interface DashboardStats {
    dailyRevenue: number;
    totalOrdersToday: number;
    newCustomersToday: number;
    bestSellingItem: string;
    weeklyRevenue: WeeklyRevenue[];
    recentOrders: OrderSummary[];
    // Trend data
    yesterdayRevenue: number;
    totalOrdersYesterday: number;
    newCustomersYesterday: number;
    monthlyRevenue: number;
    totalOrdersMonth: number;
    totalCustomersMonth: number;
}

export const useDashboardStats = (weekOffset: number = 0) => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', weekOffset],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/orders/stats?weekOffset=${weekOffset}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute — matches backend Redis cache TTL
    placeholderData: keepPreviousData,
  });
};
