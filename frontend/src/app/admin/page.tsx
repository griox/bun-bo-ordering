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
            value: `${statsData?.dailyRevenue.toLocaleString('vi-VN')}đ`,
            icon: DollarSign,
            trend: '+12.5%',
            trendLabel: 'so với hôm qua'
        },
        {
            title: 'Đơn hàng hôm nay',
            value: statsData?.totalOrdersToday.toString() || '0',
            icon: ShoppingCart,
            trend: '+5',
            trendLabel: 'đơn mới'
        },
        {
            title: 'Khách hàng mới',
            value: statsData?.newCustomersToday.toString() || '0',
            icon: Users,
            trend: '+2',
            trendLabel: 'trong 24h'
        },
        {
            title: 'Món bán chạy nhất',
            value: statsData?.bestSellingItem || 'N/A',
            icon: UtensilsCrossed,
            trend: 'HOT',
            trendLabel: 'xu hướng'
        },
    ];

    const chartData = statsData?.weeklyRevenue.map(d => ({
        name: d.dayOfWeek.toUpperCase(),
        revenue: d.revenue,
        fullDate: d.date
    })) || [];

    return (
        <div className="space-y-10 pb-20 px-4 md:px-0">
            {/* Pro Max Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Bảng điều khiển</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">
                        Hệ thống: <span className="text-red-500 underline decoration-2 underline-offset-4">Trực tuyến</span> • Chào, {user?.username}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white border-4 border-gray-900 p-2 rounded-2xl shadow-[8px_8px_0px_#000]">
                    <div className="size-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest pr-2">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid - Neo Brutalism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-4 border-gray-900 shadow-[12px_12px_0px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.title}</span>
                            <div className="size-12 rounded-2xl bg-gray-900 flex items-center justify-center border-2 border-gray-800">
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-3">{stat.value}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white bg-red-500 px-2.5 py-1 rounded-lg uppercase italic tracking-tighter">
                                    {stat.trend}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{stat.trendLabel}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Revenue Chart - Dark Pro Max Style */}
                <Card className="xl:col-span-2 border-4 border-gray-900 shadow-[20px_20px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-gray-900">
                    <CardHeader className="bg-gray-900 border-b border-gray-800 p-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                    <div className="size-2 bg-red-500 rounded-full" />
                                    Doanh thu tuần này
                                </CardTitle>
                                <CardDescription className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 ml-5">Hiệu suất tài chính 7 ngày qua</CardDescription>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Đơn vị: VNĐ</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#1f2937" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#4b5563', dy: 15 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 800, fill: '#4b5563' }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="bg-white p-4 shadow-[10px_10px_0px_#ef4444] rounded-2xl border-4 border-gray-900">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">{p.payload?.fullDate}</p>
                                                    <p className="text-lg font-black text-gray-900 italic tracking-tighter">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="#ffffff"
                                    radius={[8, 8, 8, 8]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Orders - High Contrast */}
                <Card className="border-4 border-gray-900 shadow-[20px_20px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden flex flex-col bg-white">
                    <CardHeader className="bg-white border-b-4 border-gray-900 p-8">
                        <CardTitle className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">Đơn hàng gần đây</CardTitle>
                        <CardDescription className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Dữ liệu thời gian thực</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto max-h-[450px] custom-scrollbar">
                        <div className="divide-y-2 divide-gray-100">
                            {statsData?.recentOrders.length === 0 ? (
                                <div className="p-10 text-center text-gray-300 font-black uppercase text-xs">Chưa có đơn hàng</div>
                            ) : (
                                statsData?.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="size-12 rounded-2xl bg-gray-900 flex items-center justify-center font-black text-[10px] text-white group-hover:bg-red-500 transition-colors z-10">
                                            #{order.tableCode}
                                        </div>
                                        <div className="flex-1 z-10">
                                            <p className="text-xs font-black text-gray-900 uppercase mb-0.5 tracking-tighter">BÀN {order.tableName}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • 
                                                <span className={order.status === 2 ? "text-green-500 ml-1" : "text-orange-500 ml-1"}>
                                                    {order.status === 2 ? "ĐÃ THANH TOÁN" : "CHỜ XỬ LÝ"}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-sm font-black text-gray-900 z-10">
                                            {order.totalAmount.toLocaleString('vi-VN')}đ
                                        </div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 translate-x-full group-hover:translate-x-0 transition-transform" />
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <div className="p-6 bg-gray-50 border-t-4 border-gray-900">
                        <Button variant="ghost" className="w-full text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] hover:bg-gray-900 hover:text-white transition-all py-6 rounded-2xl border-2 border-transparent hover:border-gray-900">
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
