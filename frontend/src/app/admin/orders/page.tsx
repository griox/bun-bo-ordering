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
import { useOrders } from '@/hooks/useOrders';

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
    const { data: orders = [], isLoading } = useOrders();

    const filteredOrders = statusFilter === 'All'
        ? (orders as OrderSummary[])
        : (orders as OrderSummary[]).filter(o => o.status === statusFilter);

    const getStatusBadge = (status: string) => {
        const baseClass = "font-display font-bold uppercase text-[9px] px-3 py-1 rounded-xl border-2 transition-all";
        switch (status) {
            case 'Served': return <Badge className={`${baseClass} bg-green-500/10 text-green-700 border-green-500/20`}>HOÀN TẤT</Badge>;
            case 'Cooking': return <Badge className={`${baseClass} bg-blue-500/10 text-blue-700 border-blue-500/20`}>ĐANG NẤU</Badge>;
            case 'Created': return <Badge className={`${baseClass} bg-yellow-500/10 text-yellow-700 border-yellow-500/20`}>CHỜ XỬ LÝ</Badge>;
            case 'Cancelled': return <Badge className={`${baseClass} bg-red-500/10 text-red-700 border-red-500/20`}>ĐÃ HỦY</Badge>;
            default: return <Badge variant="outline" className={baseClass}>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#2D2D2D] border-2 border-text -rotate-3">
                        <Receipt className="size-8 text-white rotate-3" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-display font-bold text-text mb-1 uppercase tracking-tight">HÓA ĐƠN</h2>
                        <p className="text-text/60 font-medium">Lịch sử giao dịch và quản lý trạng thái thanh toán.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-12 border-2 border-text font-display font-bold rounded-xl shadow-[4px_4px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2D2D2D] transition-all uppercase px-6 gap-2">
                        <Calendar className="size-4" />
                        Lọc theo ngày
                    </Button>
                    <Button variant="outline" className="h-12 border-2 border-text font-display font-bold rounded-xl shadow-[4px_4px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2D2D2D] transition-all uppercase px-6 gap-2">
                        <Download className="size-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            <Card className="border-4 border-text shadow-[12px_12px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-paper">
                <div className="p-6 bg-background/20 border-b-4 border-text flex flex-col lg:flex-row gap-6 justify-between items-center">
                    <Tabs defaultValue="All" onValueChange={setStatusFilter} className="w-full lg:w-auto">
                        <TabsList className="bg-text/5 p-1 h-auto rounded-2xl border-2 border-text/5">
                            <TabsTrigger value="All" className="rounded-xl px-6 py-2.5 font-display font-bold text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_#2D2D2D] data-[state=active]:border-2 data-[state=active]:border-text transition-all">Tất cả</TabsTrigger>
                            <TabsTrigger value="Created" className="rounded-xl px-6 py-2.5 font-display font-bold text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_#2D2D2D] data-[state=active]:border-2 data-[state=active]:border-text transition-all">Chờ xử lý</TabsTrigger>
                            <TabsTrigger value="Cooking" className="rounded-xl px-6 py-2.5 font-display font-bold text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_#2D2D2D] data-[state=active]:border-2 data-[state=active]:border-text transition-all">Đang nấu</TabsTrigger>
                            <TabsTrigger value="Served" className="rounded-xl px-6 py-2.5 font-display font-bold text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_#2D2D2D] data-[state=active]:border-2 data-[state=active]:border-text transition-all">Hoàn tất</TabsTrigger>
                            <TabsTrigger value="Cancelled" className="rounded-xl px-6 py-2.5 font-display font-bold text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_#2D2D2D] data-[state=active]:border-2 data-[state=active]:border-text transition-all">Đã hủy</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text/30" />
                        <Input
                            placeholder="TÌM MÃ ĐƠN, SỐ BÀN..."
                            className="h-14 pl-12 pr-6 border-2 border-text/10 rounded-2xl bg-paper font-bold focus:border-primary transition-all uppercase text-xs tracking-wider"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-text/5">
                            <TableRow className="hover:bg-transparent border-b-2 border-text/5">
                                <TableHead className="font-display font-bold text-text uppercase p-6">Mã đơn hàng</TableHead>
                                <TableHead className="font-display font-bold text-text uppercase p-6">Thông tin bàn</TableHead>
                                <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Thời gian</TableHead>
                                <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Tổng thanh toán</TableHead>
                                <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Trạng thái</TableHead>
                                <TableHead className="text-right font-display font-bold text-text uppercase p-6">Thao tác</TableHead>
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
                                    <TableRow key={order.id} className="hover:bg-background/20 transition-colors border-b-2 border-text/5 last:border-0 group">
                                        <TableCell className="p-6">
                                            <div className="font-mono font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border-2 border-primary/10 inline-block">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6">
                                            <div className="font-display font-bold text-text text-lg uppercase tracking-tight">BÀN {order.tableCode}</div>
                                            <div className="text-[10px] text-text/40 font-bold uppercase tracking-widest">{order.tableName}</div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="font-display font-bold text-text mb-0.5">{format(new Date(order.createdAt), 'HH:mm')}</div>
                                            <div className="text-[10px] text-text/40 font-bold uppercase tracking-tighter">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="font-display font-bold text-primary text-xl tracking-tight">
                                                {order.totalAmount.toLocaleString('vi-VN')}
                                                <span className="text-[10px] ml-1 uppercase">vnđ</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="inline-block scale-90">
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Button variant="ghost" className="size-12 rounded-xl border-2 border-transparent hover:border-text hover:bg-background/50 text-text/60 hover:text-text transition-all">
                                                    <Eye className="size-5" />
                                                </Button>
                                                <Button variant="ghost" className="size-12 rounded-xl border-2 border-transparent hover:border-text hover:bg-background/50 text-text/60 hover:text-text transition-all">
                                                    <Download className="size-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-8 bg-background/30 border-t-4 border-text flex items-center justify-between">
                    <p className="font-display font-bold text-[10px] text-text/40 uppercase tracking-widest">Hiển thị <b>{filteredOrders.length > 0 ? 1 : 0}-{filteredOrders.length}</b> trong tổng số <b>{filteredOrders.length}</b> đơn hàng</p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="h-10 border-2 border-text rounded-xl font-display font-bold text-[10px] uppercase shadow-[3px_3px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2D2D2D] transition-all" disabled>Trang trước</Button>
                        <Button variant="outline" className="h-10 border-2 border-text rounded-xl font-display font-bold text-[10px] uppercase shadow-[3px_3px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[1px_1px_0px_#2D2D2D] transition-all" disabled>Trang sau</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
