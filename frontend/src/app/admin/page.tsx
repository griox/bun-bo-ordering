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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-black/40 tracking-[0.2em] uppercase">System Status: Operational</span>
                    </div>
                    <h2 className="text-5xl font-bold text-black tracking-tighter mb-2 uppercase">Core Dashboard</h2>
                    <p className="text-black/50 font-bold text-xs tracking-widest uppercase">Admin Session: {user?.username?.toUpperCase() || 'ROOT_ACCESS'}</p>
                </div>
                <div className="flex items-center gap-3 bg-white border-2 border-black px-6 py-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all cursor-default">
                    <Calendar className="w-4 h-4 text-black" />
                    <span className="text-xs font-bold tracking-widest uppercase">{new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-4px] transition-all rounded-2xl overflow-hidden bg-white group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                            <div className={`${stat.bg} size-10 rounded-xl flex items-center justify-center border-2 border-black/5 group-hover:bg-black group-hover:text-white transition-all`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-black mb-3 tracking-tighter">{stat.value}</div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 w-fit rounded-lg border border-black/5">
                                <TrendingUp className="w-3 h-3 text-black/60" />
                                <span className="text-[9px] text-black/60 font-bold uppercase tracking-widest">+12.5% Delta</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="border-b-2 border-black/5 pb-6 bg-black/[0.01]">
                        <CardTitle className="text-xs font-bold text-black tracking-widest uppercase">Revenue Stream / Weekly Analytics</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em]">Statistical data for the last 7 cycles</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#000000', opacity: 0.4 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#000000', opacity: 0.4 }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="bg-black text-white p-5 border-2 border-white shadow-[10px_10px_0px_rgba(0,0,0,0.2)] rounded-2xl font-mono">
                                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">{p.payload?.fullDate}</p>
                                                    <p className="text-xl font-bold tracking-tight">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden bg-white flex flex-col">
                    <CardHeader className="border-b-2 border-black/5 pb-6 bg-black/[0.01]">
                        <CardTitle className="text-xs font-bold text-black tracking-widest uppercase">Real-Time Event Log</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em]">Live order stream monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="divide-y-2 divide-black/5">
                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                <div key={i} className="flex items-center gap-5 p-5 group cursor-pointer hover:bg-black/[0.02] transition-colors">
                                    <div className="size-12 rounded-xl bg-white border-2 border-black flex items-center justify-center font-bold text-xs shadow-[4px_4px_0px_rgba(0,0,0,0.1)] group-hover:bg-black group-hover:text-white transition-all">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-black mb-1 uppercase tracking-tight">STATION / TABLE {i + 1}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-green-500" />
                                            <p className="text-[9px] text-black/40 font-bold uppercase tracking-wider">3 ITEMS • {10 + i}:24 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-black tracking-tighter">145,000</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-6 bg-black/[0.02] border-t-2 border-black/5">
                        <Button variant="outline" className="w-full font-bold text-[10px] tracking-[0.2em] rounded-xl py-6 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none bg-white">
                            ACCESS ALL LOGS
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
