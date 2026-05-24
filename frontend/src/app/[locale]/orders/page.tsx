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
        <div className="min-h-screen bg-gray-50/50 font-sans">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <Link href="/menu" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-gray-400 hover:text-red-600 transition-colors">
                        <ArrowLeft size={14} />
                        QUAY LẠI THỰC ĐƠN
                    </Link>

                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="border-b border-gray-100 p-10 bg-white m-0">
                            <div className="flex items-center gap-6">
                                <div className="size-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm flex-shrink-0">
                                    <ClipboardList size={32} />
                                </div>
                                <div>
                                    <CardTitle className="text-4xl font-black uppercase tracking-tighter text-gray-900">Lịch sử đơn hàng</CardTitle>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1.5">Order History Tracking</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!sessionId ? (
                                <div className="flex flex-col items-center gap-8 py-24 text-center">
                                    <div className="size-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <Clock size={48} className="text-gray-200" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Chưa có phiên đặt hàng</h3>
                                        <p className="text-sm text-gray-400 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                                            Vui lòng quét mã QR tại bàn để bắt đầu gọi món.
                                        </p>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="py-24 text-center">
                                    <div className="size-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="font-black text-gray-400 uppercase text-xs tracking-widest">Đang tải lịch sử đơn hàng...</p>
                                </div>
                            ) : error ? (
                                <div className="py-24 text-center">
                                    <p className="text-red-500 font-black uppercase text-xs tracking-widest">Có lỗi xảy ra khi tải đơn hàng.</p>
                                </div>
                            ) : !orders || orders.length === 0 ? (
                                <div className="flex flex-col items-center gap-8 py-24 text-center">
                                    <div className="size-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <ClipboardList size={48} className="text-gray-200" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Chưa có đơn hàng</h3>
                                        <p className="text-sm text-gray-400 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                                            Bạn chưa gọi món nào trong phiên này.
                                        </p>
                                    </div>
                                    <Button asChild className="mt-4 px-12 h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-[0.2em] shadow-lg shadow-red-600/20 transition-all active:scale-95">
                                        <Link href="/menu">ĐẶT MÓN NGAY</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {orders.map((order: Order) => (
                                        <div key={order.id} className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group">
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className="font-black text-xl text-gray-900">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${
                                                        order.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        order.status === 'Completed' || order.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                        {order.status === 'Pending' ? 'Đang chờ' : 
                                                         order.status === 'Completed' || order.status === 'Paid' ? 'Hoàn thành' : 
                                                         order.status === 'Cancelled' ? 'Đã hủy' : order.status}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={12} />
                                                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-3xl font-black text-red-600 tracking-tighter">
                                                    {order.totalAmount?.toLocaleString('vi-VN')}<span className="text-sm ml-0.5">đ</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleViewDetails(order)}
                                                    variant="ghost"
                                                    className="size-16 rounded-2xl bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 border border-gray-100 transition-all flex items-center justify-center p-0"
                                                    title="Xem chi tiết hóa đơn"
                                                >
                                                    <Eye size={28} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-16 p-10 text-center">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
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
