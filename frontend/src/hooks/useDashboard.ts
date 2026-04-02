'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';

export interface WeeklyRevenue {
    date: string;
    dayOfWeek: string;
    revenue: number;
}

export interface DashboardStats {
    dailyRevenue: number;
    totalOrdersToday: number;
    newCustomersToday: number;
    bestSellingItem: string;
    weeklyRevenue: WeeklyRevenue[];
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/orders/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
