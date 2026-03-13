'use client';

import React, { useState } from 'react';
import { 
    Search, 
    Calendar,
    Download,
    Eye,
    Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Backend OrderStatus: Created, PendingPayment, Paid, Cooking, Served, Closed, Cancelled

const mockOrders = [
    { id: '11111111', table: '05', total: 145000, status: 'Served', time: '10:24 AM', date: '13/03/2026' },
    { id: '22222222', table: '01', total: 65000, status: 'Cooking', time: '10:30 AM', date: '13/03/2026' },
    { id: '33333333', table: '08', total: 220000, status: 'Created', time: '10:45 AM', date: '13/03/2026' },
    { id: '44444444', table: '03', total: 85000, status: 'Cancelled', time: '09:15 AM', date: '13/03/2026' },
    { id: '55555555', table: '02', total: 110000, status: 'Served', time: '08:40 AM', date: '13/03/2026' },
];

export default function OrdersPage() {
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredOrders = statusFilter === 'All' 
        ? mockOrders 
        : mockOrders.filter(o => o.status === statusFilter);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Served': return <Badge className="bg-green-100 text-green-700 border-green-200">Hoàn tất</Badge>;
            case 'Cooking': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Đang nấu</Badge>;
            case 'Created': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Chờ xử lý</Badge>;
            case 'Cancelled': return <Badge className="bg-red-100 text-red-700 border-red-200">Đã hủy</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-800 flex items-center gap-2">
                        <Receipt className="w-8 h-8 text-primary" />
                        Quản lý Hóa đơn
                    </h2>
                    <p className="text-neutral-500">Xem lịch sử và quản lý trạng thái các đơn hàng từ API</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Theo ngày
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="p-4 bg-white border-b border-neutral-100 flex flex-col md:flex-row gap-4 justify-between">
                    <Tabs defaultValue="All" onValueChange={setStatusFilter} className="w-full md:w-auto">
                        <TabsList className="bg-neutral-100">
                            <TabsTrigger value="All">Tất cả</TabsTrigger>
                            <TabsTrigger value="Created">Chờ xử lý</TabsTrigger>
                            <TabsTrigger value="Cooking">Đang nấu</TabsTrigger>
                            <TabsTrigger value="Served">Hoàn tất</TabsTrigger>
                            <TabsTrigger value="Cancelled">Đã hủy</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input 
                            placeholder="Tìm mã đơn, số bàn..." 
                            className="pl-10 border-neutral-100 bg-neutral-50"
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-neutral-50">
                        <TableRow>
                            <TableHead>Mã đơn hàng</TableHead>
                            <TableHead>Số bàn</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Tổng tiền</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-neutral-400">
                                    Không tìm thấy hóa đơn nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-neutral-50/50">
                                    <TableCell className="font-mono font-medium text-blue-600">
                                        {order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        Bàn #{order.table}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{order.time}</div>
                                        <div className="text-[10px] text-neutral-400">{order.date}</div>
                                    </TableCell>
                                    <TableCell className="font-bold text-primary">
                                        {order.total.toLocaleString()}đ
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="hover:bg-blue-50 text-blue-600">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:bg-neutral-100 text-neutral-600">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                
                <div className="p-4 bg-white border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
                    <p>Hiển thị <b>1-5</b> trong tổng số <b>{filteredOrders.length}</b> đơn hàng</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Trước</Button>
                        <Button variant="outline" size="sm" disabled>Sau</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
