'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    DollarSign, 
    ShoppingCart, 
    Users, 
    TrendingUp,
    UtensilsCrossed,
    Calendar
} from 'lucide-react';
import { 
    ChartContainer, 
    ChartTooltip, 
    ChartTooltipContent 
} from '@/components/ui/chart';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { name: 'Thứ 2', revenue: 4000 },
  { name: 'Thứ 3', revenue: 3000 },
  { name: 'Thứ 4', revenue: 2000 },
  { name: 'Thứ 5', revenue: 2780 },
  { name: 'Thứ 6', revenue: 1890 },
  { name: 'Thứ 7', revenue: 2390 },
  { name: 'Chủ Nhật', revenue: 3490 },
];

const stats = [
    { title: 'Doanh thu ngày', value: '4.500.000đ', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Tổng đơn hàng', value: '124', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Khách hàng mới', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Món bán chạy nhất', value: 'Bún Bò Đặc Biệt', icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-800">Tổng quan Dashboard</h2>
                    <p className="text-neutral-500">Chào mừng trở lại, quản trị viên!</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium">13 Tháng 3, 2026</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">{stat.title}</CardTitle>
                            <div className={`${stat.bg} p-2 rounded-lg`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="text-[10px] text-green-500 font-bold">+12% so với hôm qua</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Biểu đồ Doanh thu tuần</CardTitle>
                        <CardDescription>Thống kê từ ngày 07/03 - 13/03</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#888' }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#888' }} 
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f5f5f5' }}
                                    content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const p = payload[0] as any;
                                        return (
                                            <div className="bg-white p-3 border border-neutral-100 shadow-lg rounded-lg">
                                                <p className="text-sm font-bold">{p.payload?.name}</p>
                                                <p className="text-xs text-primary">{p.value?.toLocaleString()}đ</p>
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

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Đơn hàng gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs">
                                        #{2040 + i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-neutral-800">Bàn #{i + 1}</p>
                                        <p className="text-[10px] text-neutral-500">3 món • 10:24 AM</p>
                                    </div>
                                    <div className="text-sm font-bold">145k</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
