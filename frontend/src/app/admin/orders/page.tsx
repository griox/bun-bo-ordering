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
    const pageSize = 10;

    const { data: orders = [], isLoading } = useOrders(statusFilter, page * pageSize, pageSize);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-[#ff4d4f]/10 rounded-2xl flex items-center justify-center border border-[#ff4d4f]/20 shadow-sm transition-all group-hover:bg-[#ff4d4f] group-hover:text-white transition-all">
                        <Receipt className="size-8 text-[#ff4d4f]" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-black mb-0.5 uppercase tracking-tighter">HÓA ĐƠN</h2>
                        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Quản lý giao dịch & trạng thái thanh toán</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" className="h-12 border border-gray-100 bg-white shadow-sm font-black rounded-xl transition-all uppercase px-6 gap-2 hover:bg-gray-50 text-[10px] tracking-widest">
                        <Calendar className="size-4 text-[#ff4d4f]" />
                        Lọc theo ngày
                    </Button>
                    <Button variant="ghost" className="h-12 border border-gray-100 bg-white shadow-sm font-black rounded-xl transition-all uppercase px-6 gap-2 hover:bg-gray-50 text-[10px] tracking-widest">
                        <Download className="size-4 text-[#ff4d4f]" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 bg-gray-50/30 border-b border-gray-100 flex flex-col lg:flex-row gap-6 justify-between items-center">
                    <Tabs defaultValue="Paid" onValueChange={(val) => { setStatusFilter(val); setPage(0); }} className="w-full lg:w-auto">
                        <TabsList className="bg-gray-100/50 p-1 h-auto rounded-2xl border border-gray-100">
                            <TabsTrigger value="All" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-[#ff4d4f] data-[state=active]:shadow-sm transition-all tracking-widest">Tất cả</TabsTrigger>
                            <TabsTrigger value="Unpaid" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-[#ff4d4f] data-[state=active]:shadow-sm transition-all tracking-widest">Chưa thanh toán</TabsTrigger>
                            <TabsTrigger value="Paid" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase data-[state=active]:bg-white data-[state=active]:text-[#ff4d4f] data-[state=active]:shadow-sm transition-all tracking-widest">Đã thanh toán</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-300" />
                        <Input
                            placeholder="TÌM MÃ ĐƠN, SỐ BÀN..."
                            className="h-14 pl-12 pr-6 border border-gray-100 rounded-2xl bg-white font-black focus:border-[#ff4d4f] transition-all uppercase text-[10px] tracking-[0.2em]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="hidden md:table-cell font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Mã đơn / Order ID</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Vị trí / Table</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Timestamp</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Total Amount</TableHead>
                                <TableHead className="hidden md:table-cell font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Status</TableHead>
                                <TableHead className="hidden md:table-cell text-right font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Actions</TableHead>
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
                                        <TableCell className="hidden md:table-cell p-6">
                                            <div className="font-black text-black bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 inline-block text-[11px] tracking-tighter shadow-sm">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6">
                                            <div className="font-black text-black text-lg uppercase tracking-tighter mb-0.5">BÀN {order.tableCode}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.tableName}</div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="font-black text-black mb-0.5 text-sm">{format(new Date(order.createdAt), 'HH:mm')}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="font-black text-[#ff4d4f] text-xl tracking-tighter italic">
                                                {order.totalAmount.toLocaleString('vi-VN')}
                                                <span className="text-[10px] ml-1 uppercase font-black">đ</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell p-6 text-center">
                                            <div className="inline-block scale-90">
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell p-6 text-right">
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

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest italic">
                        Trang <b>{page + 1}</b> | Hiển thị tối đa <b>{pageSize}</b> bản ghi
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50"
                            disabled={page === 0}
                            onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        >
                            PREV_CYCLE
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50"
                            disabled={filteredOrders.length < pageSize}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            NEXT_CYCLE
                        </Button>
                    </div>
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
