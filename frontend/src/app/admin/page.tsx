'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DollarSign,
    ShoppingCart,
    Users,
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
            title: 'Doanh thu ngày',
            value: `${statsData?.dailyRevenue?.toLocaleString('vi-VN') || 0}đ`,
            icon: DollarSign,
            trend: '+12.5%',
            trendLabel: 'so với hôm qua'
        },
        {
            title: 'Đơn hàng hôm nay',
            value: statsData?.totalOrdersToday?.toString() || '0',
            icon: ShoppingCart,
            trend: '+5',
            trendLabel: 'đơn mới'
        },
        {
            title: 'Khách hàng mới',
            value: statsData?.newCustomersToday?.toString() || '0',
            icon: Users,
            trend: '+2',
            trendLabel: 'trong 24h'
        },
        {
            title: 'Món bán chạy nhất',
            value: statsData?.bestSellingItem || '---',
            icon: UtensilsCrossed,
            trend: 'HOT',
            trendLabel: 'xu hướng'
        },
    ];

    const chartData = statsData?.weeklyRevenue?.map(d => ({
        name: d.dayOfWeek.toUpperCase(),
        revenue: d.revenue,
        fullDate: d.date
    })) || [];

    return (
        <div className="space-y-10 pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng điều khiển</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Hệ thống: <span className="text-red-500 font-semibold underline decoration-1 underline-offset-4">Trực tuyến</span> • Chào, {user?.username}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 p-2 px-4 rounded-xl">
                    <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-gray-600">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                            <span className="text-xs font-medium text-gray-500">{stat.title}</span>
                            <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                <stat.icon className="w-5 h-5 text-gray-900" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-2xl font-bold text-gray-900 leading-none mb-3">{stat.value}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                                    {stat.trend}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">{stat.trendLabel}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Revenue Chart */}
                <Card className="xl:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-white border-b border-gray-50 p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-base font-bold text-red-500 flex items-center gap-2">
                                    <div className="size-2 bg-red-500 rounded-full" />
                                    Doanh thu tuần này
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-400 mt-1">Hiệu suất tài chính 7 ngày qua</CardDescription>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-gray-400">Đơn vị: VNĐ</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8', dy: 15 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="bg-white p-3 shadow-xl rounded-xl border border-gray-100">
                                                    <p className="text-[10px] font-bold text-gray-400 mb-1">{p.payload?.fullDate}</p>
                                                    <p className="text-sm font-bold text-gray-900">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
                    <CardHeader className="bg-white border-b border-gray-50 p-6">
                        <CardTitle className="text-base font-bold text-gray-900">Đơn hàng gần đây</CardTitle>
                        <CardDescription className="text-xs text-gray-400 mt-1">Dữ liệu cập nhật theo thời gian thực</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto max-h-[450px] custom-scrollbar">
                        <div className="divide-y-2 divide-gray-100">
                            {isLoading ? (
                                <div className="p-10 flex items-center justify-center">
                                    <Loader2 className="size-6 animate-spin text-gray-900" />
                                </div>
                            ) : !statsData?.recentOrders || statsData.recentOrders.length === 0 ? (
                                <div className="p-10 text-center text-gray-300 font-black uppercase text-xs">Chưa có đơn hàng</div>
                            ) : (
                                statsData.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-all cursor-pointer group">
                                        <div className="size-10 rounded-xl bg-gray-900 flex items-center justify-center font-bold text-[10px] text-white">
                                            #{order.tableCode}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-900">Bàn {order.tableName}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • 
                                                <span className={order.status === 2 ? "text-green-500 ml-1" : "text-orange-500 ml-1"}>
                                                    {order.status === 2 ? "Đã thanh toán" : "Chờ xử lý"}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {order.totalAmount.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-gray-50/50 border-t border-gray-50">
                        <Button variant="ghost" className="w-full text-xs font-bold text-gray-500 hover:text-gray-900 transition-all rounded-xl">
                            Xem tất cả báo cáo
                        </Button>
                    </div>
                </Card>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
