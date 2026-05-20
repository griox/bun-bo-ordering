'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface WeeklyRevenue {
    date: string;
    dayOfWeek: string;
    revenue: number;
}

export interface OrderSummary {
    id: string;
    tableCode: string;
    tableName: string;
    createdAt: string;
    totalAmount: number;
    status: number;
    note: string | null;
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

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/orders/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — matches backend Redis cache TTL
  });
};
