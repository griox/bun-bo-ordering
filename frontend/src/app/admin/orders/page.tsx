'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
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

interface OrderSummary {
    id: string;
    tableCode: string;
    tableName: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    note: string | null;
}

export default function OrdersPage() {
    const [statusFilter, setStatusFilter] = useState('All');
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axiosInstance.get('/api/orders');
                setOrders(response.data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = statusFilter === 'All' 
        ? orders 
        : orders.filter(o => o.status === statusFilter);

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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span>Đang tải danh sách...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
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
                                        Bàn #{order.tableCode}
                                        <div className="text-[10px] text-neutral-400 font-normal">{order.tableName}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">{format(new Date(order.createdAt), 'HH:mm')}</div>
                                        <div className="text-[10px] text-neutral-400">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</div>
                                    </TableCell>
                                    <TableCell className="font-bold text-primary">
                                        {order.totalAmount.toLocaleString()}đ
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
