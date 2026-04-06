'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, ArrowLeft, Eye, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCustomerOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/useAuthStore';
import { Order } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';

export default function TransactionHistoryPage() {
    const { user } = useAuthStore();
    const customerId = user?.userId;

    const { data: orders, isLoading, error } = useCustomerOrders(customerId);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string | number) => {
        const s = status.toString();
        switch (s) {
            case 'Paid':
            case '1':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Unpaid':
            case '0':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] font-mono">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-5xl mx-auto">
                    <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-bold mb-8 hover:text-primary transition-colors text-black/60">
                        <ArrowLeft size={16} />
                        QUAY LẠI THỰC ĐƠN
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                    <Receipt size={24} />
                                </div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Lịch sử giao dịch</h1>
                            </div>
                            <p className="text-sm font-bold text-black/40 uppercase tracking-[0.2em] ml-1">
                                Toàn bộ lịch sử đặt món của bạn tại hệ thống
                            </p>
                        </div>
                        <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                            <p className="text-[10px] font-bold text-black/40 uppercase mb-1">Tổng đơn hàng</p>
                            <p className="text-2xl font-black text-primary">{orders?.length || 0}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-24 text-center">
                            <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-bold uppercase tracking-widest text-black/40">Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-4 border-red-500 shadow-[8px_8px_0px_rgba(239,68,68,0.2)] rounded-3xl overflow-hidden bg-white">
                            <CardContent className="py-20 text-center">
                                <p className="text-red-500 font-bold uppercase text-lg">Có lỗi xảy ra khi tải lịch sử giao dịch.</p>
                                <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-4 border-black">THỬ LẠI</Button>
                            </CardContent>
                        </Card>
                    ) : !orders || orders.length === 0 ? (
                        <Card className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden bg-white">
                            <CardContent className="flex flex-col items-center gap-8 py-24 text-center">
                                <div className="size-24 rounded-full bg-black/5 flex items-center justify-center border-4 border-black/10">
                                    <FileText size={48} className="text-black/20" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Chưa có giao dịch nào</h3>
                                    <p className="text-sm text-black/40 font-bold max-w-sm mx-auto leading-relaxed uppercase">
                                        Bạn chưa thực hiện bất kỳ đơn hàng nào bằng tài khoản này.
                                    </p>
                                </div>
                                <Button asChild className="px-12 py-8 rounded-2xl border-4 border-black text-xl hover:translate-y-[-4px] hover:shadow-[0_8px_0_0_rgb(0,0,0)] transition-all bg-primary text-white">
                                    <Link href="/menu">KHÁM PHÁ THỰC ĐƠN</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {orders.map((order: Order) => (
                                <Card key={order.id} className="border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-white">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row md:items-center">
                                            <div className="p-6 md:p-8 flex-1 border-b-4 md:border-b-0 md:border-r-4 border-black">
                                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                                    <span className="font-black text-2xl tracking-tighter">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase border-2 border-black rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-xs font-bold text-black/40 uppercase bg-black/5 px-3 py-1.5 rounded-full">
                                                        <Clock size={12} />
                                                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-8 gap-y-2">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Loại đơn hàng</p>
                                                        <p className="text-xs font-bold uppercase">{order.tableName || 'Mang đi'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Sản phẩm</p>
                                                        <p className="text-xs font-bold uppercase">{order.orderItems?.length || 0} món</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Thanh toán</p>
                                                        <p className="text-xs font-bold uppercase">{order.paymentMethod || 'Tiền mặt'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 md:p-8 bg-black/[0.02] flex flex-row md:flex-col items-center justify-between md:justify-center gap-6 min-w-[200px]">
                                                <div className="text-center md:text-right">
                                                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">Tổng cộng</p>
                                                    <p className="text-3xl font-black text-primary">
                                                        {order.totalAmount?.toLocaleString('vi-VN')}đ
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleViewDetails(order)}
                                                    className="border-4 border-black rounded-2xl px-6 py-7 h-auto bg-white text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                                                >
                                                    <Eye size={20} className="mr-2" />
                                                    <span className="font-black uppercase text-xs tracking-wider">Chi tiết</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="mt-16 pt-12 border-t-4 border-black border-dashed flex flex-col items-center gap-4 text-black/20">
                        <div className="flex items-center gap-8">
                            <span className="font-black italic text-2xl uppercase tracking-tighter opacity-50">Antigravity Experience</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">
                            End of History • Bun Bo System v1.0
                        </p>
                    </div>
                </div>
            </main>

            <OrderDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
}
