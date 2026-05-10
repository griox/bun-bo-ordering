'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ReceiptText, Clock, StickyNote, CheckCircle2, Banknote, CreditCard, Hash } from "lucide-react";
import { Order, OrderItem } from "@/hooks/useOrders";
import { cn } from "@/lib/utils";

export function OrderDetailModal({
    isOpen,
    onClose,
    order,
}: {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}) {
    if (!order) return null;

    const isPaid = order.status === 'Completed' || order.status === 'Paid' || order.status === 1;
    const isCash = !order.paymentMethod || order.paymentMethod.toLowerCase().includes('cash');
    const PaymentIcon = isCash ? Banknote : CreditCard;
    const paymentLabel = isCash ? 'Tiền mặt' : 'Chuyển khoản';
    const orderDate = new Date(order.createdAt);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[480px] border border-red-100 shadow-xl rounded-2xl p-0 overflow-hidden bg-white gap-0 font-main">
                <DialogDescription className="sr-only">Chi tiết hóa đơn đơn hàng</DialogDescription>

                {/* ── Header ── */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 px-6 pt-6 pb-5 border-b border-red-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                <ReceiptText size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-[#450A0A] uppercase tracking-wide leading-none mb-0.5">
                                    Chi tiết hóa đơn
                                </DialogTitle>
                                <p className="text-xs text-[#7f1d1d]/50">Bún Bò System · Nha Trang</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                            isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                        )}>
                            {isPaid
                                ? <><CheckCircle2 size={12} /> Hoàn thành</>
                                : <><Clock size={12} /> Đang xử lý</>
                            }
                        </span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-white/80 rounded-xl p-3 border border-red-100">
                            <div className="flex items-center gap-1 mb-1">
                                <Hash size={10} className="text-red-400" />
                                <span className="text-[10px] font-semibold text-[#7f1d1d]/50 uppercase tracking-wider">Mã đơn</span>
                            </div>
                            <p className="text-sm font-bold text-[#450A0A] truncate">
                                {order.id.split('-')[0].toUpperCase()}
                            </p>
                        </div>
                        <div className="bg-white/80 rounded-xl p-3 border border-red-100">
                            <div className="flex items-center gap-1 mb-1">
                                <Clock size={10} className="text-red-400" />
                                <span className="text-[10px] font-semibold text-[#7f1d1d]/50 uppercase tracking-wider">Thời gian</span>
                            </div>
                            <p className="text-sm font-bold text-[#450A0A]">
                                {format(orderDate, "HH:mm", { locale: vi })}
                            </p>
                            <p className="text-[10px] text-[#7f1d1d]/50">
                                {format(orderDate, "dd/MM/yyyy")}
                            </p>
                        </div>
                        <div className="bg-white/80 rounded-xl p-3 border border-red-100">
                            <div className="flex items-center gap-1 mb-1">
                                <PaymentIcon size={10} className="text-red-400" />
                                <span className="text-[10px] font-semibold text-[#7f1d1d]/50 uppercase tracking-wider">Hình thức</span>
                            </div>
                            <p className="text-sm font-bold text-[#450A0A]">{paymentLabel}</p>
                        </div>
                    </div>
                </div>

                {/* ── Items List ── */}
                <div className="px-6 py-4 max-h-[38vh] overflow-y-auto">
                    <p className="text-[10px] font-semibold text-[#7f1d1d]/50 uppercase tracking-widest mb-3">
                        Danh sách món ({order.orderItems?.length || 0})
                    </p>
                    <div className="space-y-3">
                        {order.orderItems?.map((item: OrderItem, idx: number) => (
                            <div
                                key={item.id ?? idx}
                                className="flex items-start justify-between gap-4 py-3 border-b border-red-50 last:border-0"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    {/* Quantity bubble */}
                                    <span className="shrink-0 size-6 rounded-lg bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center mt-0.5">
                                        {item.quantity}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#450A0A] leading-snug truncate">
                                            {item.productName || item.dishName || 'Món ăn'}
                                        </p>
                                        {item.note && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700">
                                                <StickyNote size={10} />
                                                <span>{item.note}</span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-[#7f1d1d]/40 mt-0.5">
                                            {item.unitPrice?.toLocaleString('vi-VN')}đ / món
                                        </p>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-bold text-[#450A0A]">
                                        {(item.totalPrice || item.quantity * item.unitPrice)?.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Order Note ── */}
                {order.note && (
                    <div className="px-6 pb-2">
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <StickyNote size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed italic">"{order.note}"</p>
                        </div>
                    </div>
                )}

                {/* ── Footer / Total ── */}
                <div className="px-6 py-5 bg-gradient-to-br from-red-50 to-orange-50 border-t border-red-100">
                    {order.tableName && (
                        <div className="flex items-center justify-between mb-3 text-xs text-[#7f1d1d]/60">
                            <span>Bàn</span>
                            <span className="font-semibold text-[#450A0A]">{order.tableName}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-red-100">
                        <span className="text-sm font-semibold text-[#7f1d1d]/70 uppercase tracking-wider">Tổng cộng</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-display text-red-600 font-bold tracking-tight">
                                {order.totalAmount?.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-sm font-bold text-red-500">đ</span>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-[#7f1d1d]/30 mt-4 tracking-[0.5em] uppercase">
                        ✦ Cảm ơn bạn đã tin tưởng ✦
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
