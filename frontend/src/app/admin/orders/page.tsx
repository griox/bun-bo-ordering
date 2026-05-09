'use client';

import React, { useState } from 'react';
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
import { AdminPagination } from '@/components/admin/pagination';
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
import { useOrders, useOrder } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';

export default function OrdersPage() {
    const [statusFilter, setStatusFilter] = useState('Paid'); // 'All', 'Unpaid', 'Paid'
    const [page, setPage] = useState(0);
    const pageSize = 6;

    const { data: pagedData, isLoading } = useOrders(statusFilter, page * pageSize, pageSize);
    const orders = pagedData?.items || [];
    const totalCount = pagedData?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: orderDetails } = useOrder(selectedOrderId || undefined);

    const handleViewDetails = (orderId: string) => {
        setSelectedOrderId(orderId);
        setIsModalOpen(true);
    };

    const filteredOrders = orders;

    const getStatusBadge = (status: number | string) => {
        const baseClass = "font-black uppercase text-[9px] px-3 py-1.5 rounded-xl border transition-all bg-white shadow-sm";
        // Convert string status (e.g. from filter) or numeric status (from data)
        const isPaid = status === 1 || status === 'Paid';

        if (isPaid) {
            return <Badge variant="outline" className={`${baseClass} text-green-500 border-green-100 bg-green-50/50`}>ĐÃ THANH TOÁN</Badge>;
        }
        return <Badge variant="outline" className={`${baseClass} text-red-500 border-red-100 bg-red-50/50 animate-pulse`}>CHƯA THANH TOÁN</Badge>;
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý hóa đơn</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý giao dịch & trạng thái thanh toán.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold border-gray-200 bg-white hover:bg-gray-50 gap-2">
                        <Calendar className="size-4 text-primary" />
                        Lọc theo ngày
                    </Button>
                    <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold border-gray-200 bg-white hover:bg-gray-50 gap-2">
                        <Download className="size-4 text-primary" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <Tabs defaultValue="Paid" onValueChange={(val) => { setStatusFilter(val); setPage(0); }} className="w-full lg:w-auto">
                        <TabsList className="bg-gray-200/40 p-1 h-9 rounded-xl border-none">
                            <TabsTrigger value="All" className="rounded-lg px-4 py-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">Tất cả</TabsTrigger>
                            <TabsTrigger value="Unpaid" className="rounded-lg px-4 py-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">Chưa thanh toán</TabsTrigger>
                            <TabsTrigger value="Paid" className="rounded-lg px-4 py-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">Đã thanh toán</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Tìm mã đơn, số bàn..."
                            className="h-9 pl-10 pr-4 border-gray-200 rounded-xl bg-white text-sm focus:border-primary focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="hidden md:table-cell font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">Mã đơn</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">Bàn</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Thời gian</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Tổng tiền</TableHead>
                                <TableHead className="hidden md:table-cell font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Trạng thái</TableHead>
                                <TableHead className="hidden md:table-cell text-right font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Loader2 className="size-12 animate-spin text-primary" />
                                            <p className="font-display font-bold uppercase text-xs">Đang truy xuất dữ liệu...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Receipt className="size-16" />
                                            <p className="text-2xl font-display font-bold uppercase">Không có đơn hàng nào</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer"
                                        onClick={() => handleViewDetails(order.id)}
                                    >
                                        <TableCell className="hidden md:table-cell p-4">
                                            <div className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 inline-block text-[10px] tracking-tight">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4">
                                            <div className="font-bold text-gray-900 text-sm mb-0.5">BÀN {order.tableCode}</div>
                                            <div className="text-[11px] text-gray-400 font-medium">{order.tableName}</div>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                            <div className="font-bold text-gray-900 text-sm mb-0.5">{format(new Date(order.createdAt), 'HH:mm')}</div>
                                            <div className="text-[11px] text-gray-400 font-medium">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</div>
                                        </TableCell>
                                        <TableCell className="p-4 text-center">
                                            <div className="font-bold text-primary text-sm">
                                                {order.totalAmount.toLocaleString('vi-VN')}
                                                <span className="text-[10px] ml-0.5 font-bold">đ</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell p-4 text-center">
                                            <div className="inline-block scale-90">
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm text-gray-400 hover:text-black"
                                                    onClick={(e) => { e.stopPropagation(); handleViewDetails(order.id); }}
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm text-gray-400 hover:text-black"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        Trang <span className="text-gray-900">{page + 1}</span> / {totalPages || 1} — Tổng <span className="text-gray-900">{totalCount}</span> đơn
                    </p>
                    <AdminPagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                    />
                </div>
            </Card>

            <OrderDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={orderDetails || null}
            />
        </div>
    );
}
