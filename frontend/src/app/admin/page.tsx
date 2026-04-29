'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    UtensilsCrossed,
    Loader2
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const { data: statsData, isLoading, error } = useDashboardStats();
    const { user } = useAuthStore();

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center text-red-500 font-bold border-2 border-red-500/20 bg-red-50 rounded-2xl p-10">
                [ERROR]: FAILED_TO_FETCH_DASHBOARD_DATA
            </div>
        );
    }

    const stats = [
        {
            title: 'Daily Revenue',
            value: `${statsData?.dailyRevenue.toLocaleString('vi-VN')}đ`,
            icon: DollarSign,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'Total Orders',
            value: statsData?.totalOrdersToday.toString() || '0',
            icon: ShoppingCart,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'New Customers',
            value: statsData?.newCustomersToday.toString() || '0',
            icon: Users,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'Top Performer',
            value: statsData?.bestSellingItem || 'N/A',
            icon: UtensilsCrossed,
            color: 'text-black',
            bg: 'bg-black/5'
        },
    ];

    const chartData = statsData?.weeklyRevenue.map(d => ({
        name: d.dayOfWeek.toUpperCase(),
        revenue: d.revenue,
        fullDate: d.date
    })) || [];

    return (
        <div className="space-y-8 pb-10">
            {/* Clean Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan hệ thống</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Xin chào, <span className="font-semibold text-gray-700">{user?.username || 'Quản trị viên'}</span>. Đây là tình hình kinh doanh hôm nay.
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Trực tuyến: {new Date().toLocaleDateString('vi-VN')}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</span>
                            <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <stat.icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12.5%</span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">so với hôm qua</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card className="xl:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-50 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Doanh thu tuần này
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500 mt-1">Thống kê doanh thu theo từng ngày</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-8 px-2 md:px-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="bg-white p-3 shadow-xl rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{p.payload?.fullDate}</p>
                                                    <p className="text-sm font-bold text-gray-900">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--primary)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Logs */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="bg-white border-b border-gray-50">
                        <CardTitle className="text-sm font-bold text-gray-900">Đơn hàng mới nhất</CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-1">Theo dõi hoạt động thời gian thực</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto max-h-[400px]">
                        <div className="divide-y divide-gray-50">
                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">BÀN {i + 1}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">3 món • {10 + i}:24 AM</p>
                                    </div>
                                    <div className="text-sm font-bold text-primary">145k</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-gray-50/50 border-t border-gray-50">
                        <Button variant="ghost" className="w-full text-xs font-bold text-gray-500 hover:text-primary transition-colors py-5">
                            Xem tất cả hoạt động
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
