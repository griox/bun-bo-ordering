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
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const { data: statsData, isLoading, error } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center text-red-500 font-bold">
                Đã có lỗi xảy ra khi tải dữ liệu.
            </div>
        );
    }

    const stats = [
        {
            title: 'Doanh thu ngày',
            value: `${statsData?.dailyRevenue.toLocaleString('vi-VN')}đ`,
            icon: DollarSign,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'Tổng đơn hàng',
            value: statsData?.totalOrdersToday.toString() || '0',
            icon: ShoppingCart,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'Khách hàng mới',
            value: statsData?.newCustomersToday.toString() || '0',
            icon: Users,
            color: 'text-black',
            bg: 'bg-black/5'
        },
        {
            title: 'Món bán chạy nhất',
            value: statsData?.bestSellingItem || 'N/A',
            icon: UtensilsCrossed,
            color: 'text-black',
            bg: 'bg-black/5'
        },
    ];

    const chartData = statsData?.weeklyRevenue.map(d => ({
        name: d.dayOfWeek,
        revenue: d.revenue,
        fullDate: d.date
    })) || [];

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-display font-bold text-black mb-1">TỔNG QUAN HỆ THỐNG</h2>
                    <p className="text-black/60 font-medium">Chào mừng trở lại, quản trị viên! Đây là tình hình hôm nay.</p>
                </div>
                <div className="flex items-center gap-3 bg-white border-2 border-black px-5 py-2.5 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <Calendar className="w-4 h-4 text-black" />
                    <span className="text-sm font-bold font-display tracking-tight uppercase">{new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.05)] hover:shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] transition-all rounded-[2rem] overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold text-black/40 uppercase tracking-widest">{stat.title}</CardTitle>
                            <div className={`${stat.bg} size-10 rounded-xl flex items-center justify-center border-2 border-black/5 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-bold text-black mb-2">{stat.value}</div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 w-fit rounded-full">
                                <TrendingUp className="w-3.5 h-3.5 text-black/60" />
                                <span className="text-[10px] text-black/60 font-bold uppercase tracking-tighter">+12% vs qua</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="border-b-2 border-black/5 pb-6">
                        <CardTitle className="font-display text-xl text-black">DOANH THU TUẦN</CardTitle>
                        <CardDescription className="font-medium">Thống kê hiệu quả kinh doanh 7 ngày gần nhất</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#333333' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 700, fill: '#333333' }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as any;
                                            return (
                                                <div className="bg-white p-4 border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.1)] rounded-xl">
                                                    <p className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1">{p.payload?.name} ({p.payload?.fullDate})</p>
                                                    <p className="text-lg font-display font-bold text-black">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#000000" radius={[8, 8, 0, 0]} barSize={45} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white flex flex-col">
                    <CardHeader className="border-b-2 border-black/5 pb-6">
                        <CardTitle className="font-display text-xl text-black">ĐƠN HÀNG MỚI</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6">
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                                    <div className="size-12 rounded-xl bg-white border-2 border-black flex items-center justify-center font-display font-bold text-sm shadow-[2px_2px_0px_rgba(0,0,0,0.1)] group-hover:bg-black group-hover:text-white transition-colors">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-black mb-0.5">BÀN SỐ {i + 1}</p>
                                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-wide">3 món • {10 + i}:24 AM</p>
                                    </div>
                                    <div className="text-sm font-display font-bold text-black">145k</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 bg-black/[0.02] border-t-2 border-black/5">
                        <Button variant="outline" className="w-full border-2 border-black font-display font-bold shadow-[3px_3px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)] rounded-xl hover:bg-black hover:text-white transition-all">
                            XEM TẤT CẢ ĐƠN HÀNG
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
