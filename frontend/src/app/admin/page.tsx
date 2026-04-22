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
        <div className="space-y-16 pb-20 font-sans relative">
            {/* Editorial Header with Intentional Asymmetry */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-none pb-12">
                <div className="relative">
                    <div className="absolute -left-4 -top-4 size-20 bg-primary/5 rounded-full blur-3xl" />
                    <h2 className="text-6xl font-black text-foreground tracking-tighter mb-2 uppercase leading-none opacity-90 italic">
                        Quản Trị <br /> <span className="text-primary not-italic">Hệ Thống</span>
                    </h2>
                    <p className="text-muted-foreground font-black text-[10px] tracking-[0.3em] uppercase pl-1 border-l-4 border-secondary ml-1">
                        Sổ Cái Di Sản / Phiên: {user?.username?.toUpperCase() || 'ROOT_ACCESS'}
                    </p>
                </div>
                <div className="glass px-8 py-4 rounded-2xl shadow-ambient cursor-default flex items-center gap-4 border border-border/20 self-end md:self-auto transform rotate-1 md:rotate-0">
                    <div className="size-2 rounded-full bg-tertiary animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/70">
                        {new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <Card key={i} className="group hover:translate-y-[-8px] transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                            <div className={`size-12 rounded-2xl flex items-center justify-center surface-base border border-border/10 group-hover:btn-heritage-primary transition-all shadow-sm`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-foreground mb-4 tracking-tighter">{stat.value}</div>
                            <div className="flex items-center gap-2 px-3 py-1.5 surface-low w-fit rounded-xl border border-border/5">
                                <TrendingUp className="w-3 h-3 text-tertiary" />
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">+12.5% Tăng trưởng</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <Card className="xl:col-span-2 hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="border-b border-border/5 pb-8 surface-low/30">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xs font-black text-foreground tracking-[0.2em] uppercase items-center flex gap-3">
                                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                                    Phân tích Doanh thu Tuần
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-1">Dữ liệu thống kê 7 chu kỳ gần nhất</CardDescription>
                            </div>
                            <div className="h-2 w-24 bg-surface-low rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[450px] pt-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" opacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)', letterSpacing: 1 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                                    tickFormatter={(value) => `${value / 1000}K`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface-container-low)', opacity: 0.4 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0] as { payload?: { name?: string; fullDate?: string }; value?: number };
                                            return (
                                                <div className="glass p-6 shadow-ambient rounded-2xl border border-border/20">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 border-b border-border/10 pb-2">{p.payload?.fullDate}</p>
                                                    <p className="text-2xl font-black tracking-tight text-primary">{p.value?.toLocaleString('vi-VN')} VNĐ</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="var(--primary)"
                                    radius={[12, 12, 4, 4]}
                                    barSize={40}
                                    className="filter drop-shadow-md"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="surface-low flex flex-col hover:shadow-2xl transition-all duration-500 border-none">
                    <CardHeader className="border-b border-border/10 pb-6 surface-high/50">
                        <CardTitle className="text-xs font-black text-foreground tracking-[0.2em] uppercase">Nhật ký sự kiện thời gian thực</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Theo dõi dòng đơn hàng trực tiếp</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <div className="divide-y divide-border/5">
                            {[1, 2, 3, 4, 5, 6].map((_, i) => (
                                <div key={i} className="flex items-center gap-6 p-6 group cursor-pointer hover:bg-surface-high/60 transition-colors">
                                    <div className="size-14 rounded-2xl surface-base border border-border/10 flex items-center justify-center font-black text-[10px] tracking-tighter group-hover:btn-heritage-primary transition-all shadow-sm">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-foreground mb-1 uppercase tracking-tight">VỊ TRÍ / BÀN {i + 1}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-tertiary animate-pulse" />
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">3 MÓN • {10 + i}:24 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-primary tracking-tighter italic mr-2">145k</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="p-8 surface-high/30 border-t border-border/5">
                        <Button variant="outline" className="w-full text-[10px] tracking-[0.3em] uppercase py-7 rounded-2xl bg-surface-highest hover:bg-primary hover:text-white transition-all shadow-sm border-border/10">
                            XEM TẤT CẢ LOG TERMINAL
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
