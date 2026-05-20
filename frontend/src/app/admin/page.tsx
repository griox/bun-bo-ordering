'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DollarSign,
    ShoppingCart,
    Users,
    UtensilsCrossed,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    CalendarDays,
    ArrowRight
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper to calculate percentage change
function calcTrend(current: number, previous: number): { value: string; type: 'up' | 'down' | 'neutral' } {
    if (previous === 0 && current === 0) return { value: '0%', type: 'neutral' };
    if (previous === 0) return { value: '+100%', type: 'up' };
    const pct = ((current - previous) / previous) * 100;
    if (pct > 0) return { value: `+${pct.toFixed(1)}%`, type: 'up' };
    if (pct < 0) return { value: `${pct.toFixed(1)}%`, type: 'down' };
    return { value: '0%', type: 'neutral' };
}

function calcDiff(current: number, previous: number): { value: string; type: 'up' | 'down' | 'neutral' } {
    const diff = current - previous;
    if (diff > 0) return { value: `+${diff}`, type: 'up' };
    if (diff < 0) return { value: `${diff}`, type: 'down' };
    return { value: '0', type: 'neutral' };
}

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

    const revenueTrend = calcTrend(statsData?.dailyRevenue || 0, statsData?.yesterdayRevenue || 0);
    const ordersDiff = calcDiff(statsData?.totalOrdersToday || 0, statsData?.totalOrdersYesterday || 0);
    const customersDiff = calcDiff(statsData?.newCustomersToday || 0, statsData?.newCustomersYesterday || 0);

    const stats = [
        {
            title: 'Doanh thu ngày',
            value: `${statsData?.dailyRevenue?.toLocaleString('vi-VN') || 0}đ`,
            icon: DollarSign,
            trend: revenueTrend.value,
            trendType: revenueTrend.type,
            trendLabel: 'so với hôm qua'
        },
        {
            title: 'Đơn hàng hôm nay',
            value: statsData?.totalOrdersToday?.toString() || '0',
            icon: ShoppingCart,
            trend: ordersDiff.value,
            trendType: ordersDiff.type,
            trendLabel: `so với hôm qua (${statsData?.totalOrdersYesterday || 0})`
        },
        {
            title: 'Khách hàng mới',
            value: statsData?.newCustomersToday?.toString() || '0',
            icon: Users,
            trend: customersDiff.value,
            trendType: customersDiff.type,
            trendLabel: `so với hôm qua (${statsData?.newCustomersYesterday || 0})`
        },
        {
            title: 'Món bán chạy nhất',
            value: statsData?.bestSellingItem || '---',
            icon: UtensilsCrossed,
            trend: statsData?.bestSellingItem && statsData.bestSellingItem !== 'N/A' ? 'HOT' : '---',
            trendType: statsData?.bestSellingItem && statsData.bestSellingItem !== 'N/A' ? 'up' as const : 'neutral' as const,
            trendLabel: '30 ngày qua'
        },
    ];

    const chartData = statsData?.weeklyRevenue?.map(d => ({
        name: d.dayOfWeek.toUpperCase(),
        revenue: d.revenue,
        fullDate: d.date
    })) || [];

    const TrendIcon = ({ type }: { type: 'up' | 'down' | 'neutral' }) => {
        if (type === 'up') return <TrendingUp className="size-3" />;
        if (type === 'down') return <TrendingDown className="size-3" />;
        return <Minus className="size-3" />;
    };

    const trendColor = (type: 'up' | 'down' | 'neutral') => {
        if (type === 'up') return 'text-green-600 bg-green-50';
        if (type === 'down') return 'text-red-500 bg-red-50';
        return 'text-gray-500 bg-gray-100';
    };

    return (
        <div className="space-y-6 md:space-y-10 pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Bảng điều khiển</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Hệ thống: <span className="text-red-500 font-semibold underline decoration-1 underline-offset-4">Trực tuyến</span> • Chào, {user?.username}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 p-2 px-4 rounded-xl w-full md:w-auto">
                    <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-gray-600">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 space-y-0 p-4 md:p-6">
                            <span className="text-[11px] md:text-xs font-medium text-gray-500">{stat.title}</span>
                            <div className="size-8 md:size-10 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                            <div className="text-lg md:text-2xl font-bold text-gray-900 leading-none mb-2 md:mb-3 truncate">{stat.value}</div>
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                                <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg inline-flex items-center gap-0.5 md:gap-1 ${trendColor(stat.trendType)}`}>
                                    <TrendIcon type={stat.trendType} />
                                    {stat.trend}
                                </span>
                                <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">{stat.trendLabel}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly Summary Bar */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <CalendarDays className="size-4 text-red-500" />
                        <span className="text-sm font-bold text-gray-900">Tổng kết tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-6">
                        <div className="flex flex-col gap-0.5 md:gap-1 p-3 md:p-4 rounded-xl bg-red-50/50 border border-red-100/50">
                            <span className="text-[8px] md:text-[10px] font-bold text-red-400 uppercase tracking-wider">Doanh thu</span>
                            <span className="text-sm md:text-xl font-bold text-gray-900 truncate">
                                {(statsData?.monthlyRevenue || 0).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5 md:gap-1 p-3 md:p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                            <span className="text-[8px] md:text-[10px] font-bold text-blue-400 uppercase tracking-wider">Đơn hàng</span>
                            <span className="text-sm md:text-xl font-bold text-gray-900">
                                {(statsData?.totalOrdersMonth || 0).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5 md:gap-1 p-3 md:p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                            <span className="text-[8px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Khách hàng</span>
                            <span className="text-sm md:text-xl font-bold text-gray-900">
                                {(statsData?.totalCustomersMonth || 0).toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
                {/* Revenue Chart */}
                <Card className="xl:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-white border-b border-gray-50 p-4 md:p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-sm md:text-base font-bold text-red-500 flex items-center gap-2">
                                    <div className="size-2 bg-red-500 rounded-full" />
                                    Doanh thu tuần này
                                </CardTitle>
                                <CardDescription className="text-[11px] md:text-xs text-gray-400 mt-1">Hiệu suất tài chính 7 ngày qua</CardDescription>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 px-2 md:px-3 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-gray-400">VNĐ</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[280px] md:h-[400px] p-4 md:p-8">
                        {chartData.every(d => d.revenue === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 md:gap-4 opacity-30">
                                <BarChart className="size-12 md:size-16 text-gray-300" />
                                <p className="text-xs md:text-sm font-bold text-gray-500 text-center">Chưa có doanh thu trong tuần này</p>
                                <p className="text-[11px] md:text-xs text-gray-400">Dữ liệu sẽ hiển thị khi có đơn hàng đã thanh toán</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8', dy: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 8, fontWeight: 600, fill: '#94a3b8' }}
                                        tickFormatter={(value) => `${value / 1000}K`}
                                        width={35}
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
                                        barSize={24}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
                    <CardHeader className="bg-white border-b border-gray-50 p-4 md:p-6">
                        <CardTitle className="text-sm md:text-base font-bold text-gray-900">Đơn hàng gần đây</CardTitle>
                        <CardDescription className="text-[11px] md:text-xs text-gray-400 mt-1">Dữ liệu cập nhật theo thời gian thực</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-y-auto max-h-[350px] md:max-h-[450px] custom-scrollbar">
                        <div className="divide-y-2 divide-gray-100">
                            {isLoading ? (
                                <div className="p-10 flex items-center justify-center">
                                    <Loader2 className="size-6 animate-spin text-gray-900" />
                                </div>
                            ) : !statsData?.recentOrders || statsData.recentOrders.length === 0 ? (
                                <div className="p-10 text-center text-gray-300 font-black uppercase text-xs">Chưa có đơn hàng</div>
                            ) : (
                                statsData.recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 hover:bg-gray-50/50 transition-all cursor-pointer group min-h-[56px]">
                                        <div className="size-10 md:size-11 lg:size-10 rounded-xl bg-gray-900 flex items-center justify-center font-bold text-[10px] lg:text-[10px] text-white shrink-0">
                                            #{order.tableCode}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">Bàn {order.tableName}</p>
                                            <p className="text-xs text-gray-400 font-medium">
                                                {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • 
                                                <span className={order.status === 2 ? "text-green-500 ml-1" : order.status === 1 ? "text-blue-500 ml-1" : "text-orange-500 ml-1"}>
                                                    {order.status === 2 ? "Đã thanh toán" : order.status === 1 ? "Đã xác nhận" : "Chờ xử lý"}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-sm font-bold text-gray-900 shrink-0">
                                            {order.totalAmount.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <div className="p-3 md:p-4 bg-gray-50/50 border-t border-gray-50">
                        <Link href="/admin/orders">
                            <Button variant="ghost" className="w-full min-h-[44px] text-xs font-bold text-gray-500 hover:text-gray-900 transition-all rounded-xl gap-2">
                                Xem tất cả đơn hàng
                                <ArrowRight className="size-3" />
                            </Button>
                        </Link>
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
