'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FileText, Eye, Receipt, ArrowRight, Calendar as CalendarIcon, Banknote, CreditCard } from 'lucide-react';
import { format } from "date-fns";
import { vi } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCustomerOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/useAuthStore';
import { Order } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { Footer } from '@/components/landing/Footer';

export default function TransactionHistoryPage() {
    const { user } = useAuthStore();
    const customerId = user?.userId;

    const { data: orders, isLoading, error } = useCustomerOrders(customerId);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

    const filteredOrders = React.useMemo(() => {
        if (!orders) return [];
        return orders.filter(order => {
            let paymentMatch = true;
            if (paymentFilter !== 'all') {
                const method = (order.paymentMethod || 'cash').toLowerCase();
                if (paymentFilter === 'cash') paymentMatch = method.includes('cash') || method.includes('tiền mặt');
                else if (paymentFilter === 'transfer') paymentMatch = method.includes('transfer') || method.includes('chuyển khoản') || method.includes('chuyen_khoan');
            }

            let dateMatch = true;
            if (dateFilter) {
                const orderDate = new Date(order.createdAt);
                dateMatch = orderDate.getFullYear() === dateFilter.getFullYear() &&
                            orderDate.getMonth() === dateFilter.getMonth() &&
                            orderDate.getDate() === dateFilter.getDate();
            }

            return paymentMatch && dateMatch;
        });
    }, [orders, paymentFilter, dateFilter]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const formatPaymentMethod = (method?: string) => {
        if (!method) return 'Tiền mặt';
        const m = method.toLowerCase();
        if (m.includes('transfer') || m.includes('chuyen_khoan')) return 'Chuyển khoản';
        if (m.includes('cash')) return 'Tiền mặt';
        return method;
    };

    const getPaymentIcon = (method?: string) => {
        const m = (method || '').toLowerCase();
        if (m.includes('transfer') || m.includes('chuyen_khoan')) return CreditCard;
        return Banknote;
    };

    const PAYMENT_TABS = [
        { id: 'all', label: 'Tất cả' },
        { id: 'cash', label: 'Tiền mặt' },
        { id: 'transfer', label: 'Chuyển khoản' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#FDF8F3] text-[#450A0A] selection:bg-red-700 selection:text-white relative font-main">
            {/* Subtle texture overlay */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0"
                style={{ backgroundImage: "url('/images/parchment.png')" }}>
            </div>

            <Header />

            <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 pt-10 relative z-10 pb-32 w-full">

                {/* Page Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-sm">
                            <Receipt size={18} />
                        </div>
                        <h1 className="font-display text-3xl md:text-4xl text-[#450A0A] uppercase tracking-tight">
                            Lịch sử đơn hàng
                        </h1>
                    </div>
                    <p className="text-[#7f1d1d]/60 text-sm font-main ml-12">Xem lại các giao dịch của bạn</p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    {/* Payment Method Tabs */}
                    <div className="flex items-center gap-2 bg-red-50 rounded-xl p-1 border border-red-100">
                        {PAYMENT_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setPaymentFilter(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer",
                                    paymentFilter === tab.id
                                        ? "bg-red-600 text-white shadow-sm"
                                        : "text-[#7f1d1d]/60 hover:text-[#450A0A] hover:bg-red-100/60"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-main text-sm border border-red-200 bg-white rounded-xl h-10 min-w-[200px] hover:bg-red-50 hover:border-red-300 transition-all shadow-sm cursor-pointer",
                                    !dateFilter && "text-[#7f1d1d]/50"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-red-500 shrink-0" />
                                <span className="flex-1">
                                    {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: vi }) : "Lọc theo ngày"}
                                </span>
                                {dateFilter && (
                                    <span
                                        role="button"
                                        className="ml-2 size-5 flex items-center justify-center rounded-full hover:bg-red-100 text-[#7f1d1d]/40 hover:text-red-600 transition-colors text-base leading-none cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDateFilter(undefined);
                                        }}
                                    >
                                        ×
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border border-red-100 shadow-lg rounded-2xl overflow-hidden" align="end">
                            <Calendar
                                mode="single"
                                selected={dateFilter}
                                onSelect={setDateFilter}
                                className="p-3 pointer-events-auto bg-white font-main"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Active filter chip */}
                {dateFilter && (
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-xs text-[#7f1d1d]/60">Đang lọc:</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                            <CalendarIcon size={11} />
                            {format(dateFilter, "dd/MM/yyyy", { locale: vi })}
                        </span>
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="py-24 text-center">
                        <div className="inline-block size-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-[#7f1d1d]/50 font-main">Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="py-24 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
                        <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <FileText className="text-red-400" size={24} />
                        </div>
                        <p className="text-red-600 font-display text-xl uppercase mb-6">Có lỗi khi tải dữ liệu</p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="px-8 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm font-semibold shadow-sm transition-all cursor-pointer"
                        >
                            Thử lại
                        </Button>
                    </div>
                ) : !filteredOrders || filteredOrders.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
                        <div className="size-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
                            <FileText size={32} className="text-red-300" />
                        </div>
                        <h3 className="text-xl font-display uppercase tracking-tight text-[#450A0A] mb-2">
                            Chưa có đơn hàng nào
                        </h3>
                        <p className="text-sm text-[#7f1d1d]/50 font-main max-w-xs mx-auto mb-8 leading-relaxed">
                            {paymentFilter === 'all' && !dateFilter
                                ? 'Bạn chưa thực hiện đơn hàng nào. Hãy đặt món ngay!'
                                : 'Không tìm thấy đơn hàng với bộ lọc hiện tại.'}
                        </p>
                        {paymentFilter === 'all' && !dateFilter && (
                            <Button asChild className="px-8 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all font-semibold text-sm shadow-sm group cursor-pointer">
                                <Link href="/menu" className="flex items-center gap-2">
                                    Đặt món ngay
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredOrders.map((order: Order) => {
                            const PaymentIcon = getPaymentIcon(order.paymentMethod);
                            const orderDate = new Date(order.createdAt);
                            const isCash = !order.paymentMethod || order.paymentMethod.toLowerCase().includes('cash');

                            return (
                                <div
                                    key={order.id}
                                    className="group bg-white rounded-2xl border border-red-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200 overflow-hidden cursor-pointer"
                                    onClick={() => handleViewDetails(order)}
                                >
                                    <div className="flex items-center gap-4 p-4 md:p-5">

                                        {/* Date Block */}
                                        <div className="shrink-0 w-14 h-14 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-bold text-red-400 uppercase leading-none">
                                                {orderDate.toLocaleDateString('vi-VN', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-display text-red-700 leading-tight">
                                                {orderDate.toLocaleDateString('vi-VN', { day: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#450A0A] truncate">
                                                {orderDate.toLocaleDateString('vi-VN', { weekday: 'long' })}
                                                <span className="font-normal text-[#7f1d1d]/50 ml-1.5">
                                                    {orderDate.toLocaleDateString('vi-VN', { year: 'numeric' })}
                                                </span>
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <PaymentIcon size={12} className={cn(
                                                    "shrink-0",
                                                    isCash ? "text-amber-600" : "text-blue-500"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    isCash ? "text-amber-700" : "text-blue-600"
                                                )}>
                                                    {formatPaymentMethod(order.paymentMethod)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="shrink-0 text-right">
                                            <p className="text-lg font-display text-red-600 font-bold">
                                                {order.totalAmount?.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>

                                        {/* View Button */}
                                        <div
                                            className="shrink-0 size-9 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center group-hover:bg-red-100 group-hover:border-red-200 transition-all"
                                            onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}
                                        >
                                            <Eye size={16} className="text-red-500" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                {filteredOrders.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-red-100 flex items-center justify-between text-xs text-[#7f1d1d]/50">
                        <span>{filteredOrders.length} đơn hàng</span>
                        <span className="font-semibold text-[#450A0A]">
                            Tổng: {filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                )}
            </main>

            <div className="relative z-20 bg-[#2D2D2D]">
                <Footer />
            </div>

            <OrderDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
}
