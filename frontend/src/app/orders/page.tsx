'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSessionOrders } from '@/hooks/useOrders';
import { useOrderStore } from '@/store/useOrderStore';
import { Order } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';

export default function OrderHistoryPage() {
    const { session } = useOrderStore();
    const sessionId = session?.id;

    const { data: orders, isLoading, error } = useSessionOrders(sessionId);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background font-mono">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-bold mb-8 hover:text-primary transition-colors">
                        <ArrowLeft size={16} />
                        QUAY LẠI THỰC ĐƠN
                    </Link>

                    <Card className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="border-b-4 border-black p-8 bg-primary/10 m-0">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center border-4 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                    <ClipboardList size={28} />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">Lịch sử đơn hàng</CardTitle>
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-[0.2em] mt-1">Order History Tracking</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!sessionId ? (
                                <div className="flex flex-col items-center gap-6 py-16 text-center">
                                    <div className="size-20 rounded-full bg-black/5 flex items-center justify-center border-4 border-black/10">
                                        <Clock size={40} className="text-black/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold uppercase tracking-tight">Chưa có phiên đặt hàng</h3>
                                        <p className="text-sm text-black/60 font-bold max-w-sm mx-auto leading-relaxed uppercase">
                                            Vui lòng quét mã QR tại bàn để bắt đầu gọi món.
                                        </p>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="py-16 text-center font-bold animate-pulse text-lg uppercase">Đang tải lịch sử đơn hàng...</div>
                            ) : error ? (
                                <div className="py-16 text-center text-red-500 font-bold uppercase text-lg">Có lỗi xảy ra khi tải đơn hàng.</div>
                            ) : !orders || orders.length === 0 ? (
                                <div className="flex flex-col items-center gap-6 py-16 text-center">
                                    <div className="size-20 rounded-full bg-black/5 flex items-center justify-center border-4 border-black/10">
                                        <ClipboardList size={40} className="text-black/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold uppercase tracking-tight">Chưa có đơn hàng</h3>
                                        <p className="text-sm text-black/60 font-bold max-w-sm mx-auto leading-relaxed uppercase">
                                            Bạn chưa gọi món nào trong phiên này.
                                        </p>
                                    </div>
                                    <Button asChild className="mt-4 px-10 py-6 rounded-2xl border-4 border-black text-lg">
                                        <Link href="/menu">ĐẶT MÓN NGAY</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y-4 divide-black">
                                    {orders.map((order: Order) => (
                                        <div key={order.id} className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/5 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-lg">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    <span className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black rounded-lg ${order.status === 'Pending' ? 'bg-yellow-100' :
                                                        order.status === 'Completed' ? 'bg-green-100' :
                                                            order.status === 'Cancelled' ? 'bg-red-100' : 'bg-gray-100'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-black/60">
                                                    Thời gian: {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-2xl font-black text-primary">
                                                    {order.totalAmount?.toLocaleString('vi-VN')}đ
                                                </div>
                                                <Button
                                                    onClick={() => handleViewDetails(order)}
                                                    variant="outline"
                                                    className="border-4 border-black rounded-xl px-4 py-6 h-auto hover:bg-black hover:text-white transition-colors"
                                                    title="Xem chi tiết hóa đơn"
                                                >
                                                    <Eye size={24} className="mr-2" />
                                                    <span className="font-bold">CHI TIẾT</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-12 p-8 border-4 border-black border-dashed rounded-[2rem] bg-black/5">
                        <p className="text-[10px] font-bold text-black/40 text-center uppercase tracking-[0.3em]">
                            Bun Bo System v1.0 • Order History
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
