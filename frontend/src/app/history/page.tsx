'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, ArrowLeft, Eye, Receipt, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCustomerOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/useAuthStore';
import { Order } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { usePromotions } from '@/hooks/usePromotions';
import { Star } from 'lucide-react';

export default function TransactionHistoryPage() {
    const { user } = useAuthStore();
    const customerId = user?.userId;

    const { useMyPoints } = usePromotions();
    const { data: orders, isLoading, error } = useCustomerOrders(customerId);
    const { data: points } = useMyPoints();
    
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
            case 'Completed':
            case '1':
                return 'bg-green-500 text-white border-text';
            case 'Unpaid':
            case 'Pending':
            case '0':
                return 'bg-primary text-white border-text';
            default:
                return 'bg-white text-text border-text';
        }
    };

    const formatPaymentMethod = (method?: string) => {
        if (!method) return 'Tiền mặt';
        const m = method.toLowerCase();
        if (m.includes('transfer')) return 'Chuyển khoản';
        if (m.includes('cash')) return 'Tiền mặt';
        if (m.includes('vnpay')) return 'VNPay';
        if (m.includes('momo')) return 'MoMo';
        return method;
    };

    return (
        <div className="min-h-screen bg-[#FDF6E3] font-admin relative overflow-hidden">
            {/* Background Texture - Using the official paper pattern from config */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply bg-paper-pattern"></div>
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-retro-paper"></div>
            
            {/* Decorative Floating Elements - High fidelity match with Menu/Hero */}
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-white/60 rounded-full filter blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-orange-100/40 rounded-full filter blur-[150px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/5 rounded-full filter blur-[200px] pointer-events-none"></div>

            <Header />
            
            <main className="relative z-10 container mx-auto px-4 py-12 md:py-16">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <Link 
                        href="/menu" 
                        className="inline-flex items-center gap-2 text-text/40 hover:text-primary transition-colors mb-12 group"
                    >
                        <div className="size-8 rounded-full border-2 border-text/10 flex items-center justify-center group-hover:border-primary transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="font-display text-xs tracking-widest uppercase">Quay lại thực đơn</span>
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="size-14 bg-primary rounded-xl flex items-center justify-center border-4 border-text shadow-[4px_4px_0px_#2D2D2D] transform -rotate-3 shrink-0">
                                    <Receipt className="text-white" size={28} />
                                </div>
                                <h1 className="font-display text-4xl md:text-6xl text-text drop-shadow-[2px_2px_0px_#D9381E] leading-tight uppercase tracking-tight">
                                    NHẬT KÝ <span className="text-secondary">ĂN UỐNG</span>
                                </h1>
                            </div>
                            <p className="text-lg text-text/60 leading-relaxed font-medium ml-2">
                                Xem lại những hành trình ẩm thực đáng nhớ của bạn tại <span className="text-primary font-bold">Bun Bo System</span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            {user && (
                                <div className="bg-white border-4 border-text p-6 rounded-[2rem] shadow-[8px_8px_0px_#2D2D2D] min-w-[200px] transform hover:rotate-0 transition-transform -rotate-1 relative overflow-hidden group">
                                    <div className="absolute top-[-10px] right-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                                        <Star size={80} className="text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black text-text/30 uppercase mb-1 tracking-[0.3em]">Điểm tích lũy</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-4xl font-display text-text">{points?.balance || 0}</p>
                                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                                    </div>
                                </div>
                            )}
                            
                            <div className="bg-[#FFCC99] border-4 border-text p-6 rounded-[2rem] shadow-[8px_8px_0px_#2D2D2D] min-w-[200px] transform hover:rotate-0 transition-transform rotate-1 group">
                                <p className="text-[10px] font-black text-text/30 uppercase mb-1 tracking-[0.3em]">Đơn đã đặt</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-display text-primary">{orders?.length || 0}</p>
                                    <p className="text-[10px] font-bold text-text/40 uppercase">Hóa đơn</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center border-2 border-text shadow-[4px_4px_0px_#2D2D2D]">
                            <Receipt size={24} />
                        </div>
                        <h2 className="text-3xl font-display text-text uppercase tracking-tight">LỊCH SỬ ĐƠN HÀNG</h2>
                    </div>

                    {isLoading ? (
                        <div className="py-32 text-center">
                            <div className="inline-block size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="font-display text-xl uppercase tracking-widest text-text/40 animate-pulse">Đang nêm nếm dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-4 border-red-500 shadow-[12px_12px_0px_rgba(239,68,68,0.2)] rounded-[2.5rem] overflow-hidden bg-white">
                            <CardContent className="py-24 text-center">
                                <div className="size-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 border-4 border-red-200">
                                    <FileText className="text-red-500" size={32} />
                                </div>
                                <p className="text-red-500 font-display text-2xl uppercase mb-8">Có lỗi xảy ra khi tải lịch sử!</p>
                                <Button 
                                    onClick={() => window.location.reload()} 
                                    className="px-12 py-6 rounded-full border-2 border-text shadow-[4px_4px_0px_#2D2D2D] bg-white text-text hover:bg-gray-50 font-display text-lg"
                                >
                                    THỬ LẠI NGAY
                                </Button>
                            </CardContent>
                        </Card>
                    ) : !orders || orders.length === 0 ? (
                        <Card className="border-4 border-text shadow-[16px_16px_0px_#2D2D2D] rounded-[3rem] overflow-hidden bg-white">
                            <CardContent className="flex flex-col items-center gap-10 py-32 text-center">
                                <div className="relative">
                                    <div className="size-32 rounded-full bg-gray-50 flex items-center justify-center border-4 border-dashed border-text/20">
                                        <FileText size={56} className="text-text/10" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 size-12 bg-secondary rounded-full border-4 border-text flex items-center justify-center text-text font-black text-2xl">?</div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-display uppercase tracking-tight text-text">Bàn ăn vẫn còn trống</h3>
                                    <p className="text-lg text-text/50 font-main max-w-sm mx-auto leading-relaxed">
                                        Bạn chưa thực hiện bất kỳ đơn hàng nào. Hãy để chúng tôi phục vụ bạn món bún bò ngon nhất!
                                    </p>
                                </div>
                                <Button asChild className="px-16 py-8 rounded-full border-2 border-text shadow-[4px_4px_0px_#2D2D2D] bg-primary text-white hover:translate-y-[-4px] hover:shadow-[0_8px_0_0_#2D2D2D] transition-all font-display text-2xl group">
                                    <Link href="/menu" className="flex items-center gap-3">
                                        ĐẶT MÓN NGAY
                                        <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-10">
                            {orders.map((order: Order, index: number) => (
                                <Card key={order.id} 
                                    className={`group border-4 border-text shadow-[12px_12px_0px_#2D2D2D] rounded-[2.5rem] overflow-hidden hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#2D2D2D] transition-all bg-white relative ${index % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'}`}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Order Info Section */}
                                            <div className="p-8 md:p-10 flex-1 border-b-4 md:border-b-0 md:border-r-4 border-dashed border-text/10 relative">
                                                {/* Perforation Effect Line */}
                                                <div className="hidden md:block absolute right-[-4px] top-4 bottom-4 w-[2px] bg-transparent border-r-4 border-dashed border-text/5"></div>
                                                
                                                <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mb-1 px-1">Mã vận đơn</span>
                                                        <span className="font-display text-3xl tracking-tighter text-text">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className={`px-5 py-2 text-[10px] font-black uppercase border-2 border-text rounded-full shadow-[2px_2px_0px_#2D2D2D] ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase text-text/50 bg-gray-50 border-2 border-gray-100 px-4 py-2 rounded-full">
                                                            <Clock size={14} className="text-text/30" />
                                                            {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
 
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Loại đơn hàng</p>
                                                        <p className="font-display text-sm text-text uppercase">{order.tableName || 'Mang đi'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Sản phẩm</p>
                                                        <p className="font-display text-sm text-text uppercase">{order.orderItems?.length || 0} món ăn</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Hình thức</p>
                                                        <p className="font-display text-sm text-text uppercase">{formatPaymentMethod(order.paymentMethod)}</p>
                                                    </div>
                                                </div>
                                            </div>
 
                                            {/* Price & Action Section */}
                                            <div className="p-8 md:p-10 bg-gray-50/50 flex flex-row md:flex-col items-center justify-between md:justify-center gap-8 min-w-[240px] relative">
                                                {/* Voucher Notch */}
                                                <div className="absolute top-[-20px] left-[-20px] size-10 bg-background border-4 border-text rounded-full hidden md:block"></div>
                                                <div className="absolute bottom-[-20px] left-[-20px] size-10 bg-background border-4 border-text rounded-full hidden md:block"></div>
                                                
                                                <div className="text-center md:text-right">
                                                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest mb-1">Thành tiền</p>
                                                    <p className="text-4xl font-display text-primary drop-shadow-[1px_1px_0px_#2D2D2D]">
                                                        {order.totalAmount?.toLocaleString('vi-VN')}đ
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleViewDetails(order)}
                                                    className="group/btn relative h-14 px-8 rounded-full border-2 border-text bg-white text-text shadow-[4px_4px_0px_#2D2D2D] hover:bg-text hover:text-white transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display uppercase text-sm tracking-wider">Xem biên lai</span>
                                                        <Eye size={18} className="group-hover/btn:scale-125 transition-transform" />
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Ticket Edge Decorative */}
                                    <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 bg-background border-r-4 border-text rounded-r-full hidden md:block"></div>
                                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-background border-l-4 border-text rounded-l-full hidden md:block"></div>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="mt-24 pt-16 border-t-4 border-text border-dashed flex flex-col items-center gap-6">
                        <div className="size-16 rounded-full border-4 border-text flex items-center justify-center bg-white shadow-[4px_4px_0px_#2D2D2D]">
                            <Receipt size={32} className="text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-display text-2xl uppercase tracking-tighter text-text mb-2">Hệ thống Bun Bo v1.0</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-text/30">
                                Authenticity • Tradition • Excellence
                            </p>
                        </div>
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
