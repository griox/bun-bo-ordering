'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    UtensilsCrossed,
    Calendar,
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
        <div className="space-y-12 pb-20 font-mono">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
                <div>

                    <h2 className="text-4xl font-black text-black tracking-tighter mb-1 uppercase">Tổng quan Dash</h2>
                    <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Phiên làm việc: {user?.username?.toUpperCase() || 'ROOT_ACCESS'}</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm cursor-default text-gray-600 hover:shadow-md transition-all">
                    <Calendar className="w-4 h-4 text-[#ff4d4f]" />
                    <span className="text-xs font-black tracking-widest uppercase">{new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all rounded-3xl overflow-hidden bg-white group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                            <div className={`${stat.bg} size-10 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-[#ff4d4f] group-hover:text-white transition-all`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-black mb-3 tracking-tighter">{stat.value}</div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 w-fit rounded-xl border border-gray-100">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">+12.5% Tăng trưởng</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border border-gray-100 shadow-sm rounded-[2rem] overflow-hidden bg-white hover:shadow-md transition-all">
                    <CardHeader className="border-b border-gray-100 pb-6 bg-gray-50/50">
                        <CardTitle className="text-xs font-black text-black tracking-widest uppercase items-center flex gap-2">
                            <div className="size-2 rounded-full bg-[#ff4d4f]" />
                            Dòng doanh thu / Phân tích tuần
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Dữ liệu thống kê 7 chu kỳ gần nhất</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 77, 79, 0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="bg-white p-5 border border-gray-100 shadow-2xl rounded-2xl font-mono">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-2">{p.payload?.fullDate}</p>
                                                    <p className="text-xl font-black tracking-tight text-[#ff4d4f]">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#ff4d4f" radius={[8, 8, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm rounded-3xl overflow-hidden bg-white flex flex-col hover:shadow-md transition-all">
                    <CardHeader className="border-b border-gray-100 pb-6 bg-gray-50/50">
                        <CardTitle className="text-xs font-black text-black tracking-widest uppercase">Nhật ký sự kiện thời gian thực</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Theo dõi dòng đơn hàng trực tiếp</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="divide-y divide-gray-100">
                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                <div key={i} className="flex items-center gap-5 p-5 group cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xs group-hover:bg-[#ff4d4f] group-hover:text-white transition-all shadow-sm">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-black mb-1 uppercase tracking-tight">VỊ TRÍ / BÀN {i + 1}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">3 MÓN • {10 + i}:24 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-[#ff4d4f] tracking-tighter italic">145k</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <Button variant="ghost" className="w-full font-black text-[10px] tracking-[0.2em] rounded-xl py-6 hover:bg-[#ff4d4f] hover:text-white transition-all bg-white border border-gray-100 shadow-sm active:translate-y-px active:shadow-none">
                            XEM TẤT CẢ LOG TERMINAL
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
