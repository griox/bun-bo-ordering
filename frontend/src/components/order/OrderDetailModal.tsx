'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ReceiptCent, Clock, StickyNote, Activity, Info } from "lucide-react";
import { Order, OrderItem } from "@/hooks/useOrders";

export function OrderDetailModal({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: Order | null }) {
    if (!order) return null;

    const getStatusBadge = (status: string | number) => {
        const isPaid = status === 'Completed' || status === 'Paid' || status === 1;

        if (isPaid) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <div className="size-12 bg-green-500 text-white rounded-xl flex items-center justify-center border-2 border-text shadow-[2px_2px_0px_#2D2D2D] transform -rotate-6">
                        <Activity className="size-6" />
                    </div>
                    <span className="text-[10px] font-display text-green-600 uppercase tracking-widest mt-1">ĐÃ XONG</span>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center gap-1">
                <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center border-2 border-text shadow-[2px_2px_0px_#2D2D2D] animate-pulse transform rotate-3">
                    <Clock className="size-6" />
                </div>
                <span className="text-[10px] font-display text-primary uppercase tracking-widest mt-1 text-center leading-none">ĐANG ĐỢI</span>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[550px] border-4 border-text shadow-[12px_12px_0px_#2D2D2D] rounded-[2.5rem] p-0 overflow-hidden bg-white gap-0 font-admin">
                <DialogDescription className="sr-only">Chi tiết hóa đơn đơn hàng</DialogDescription>
                
                {/* Header with Receipt Aesthetic */}
                <div className="relative p-10 pb-8 bg-paper overflow-hidden text-center">
                    {/* Ticket Edge Top */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-background" style={{ clipPath: "polygon(0% 0%, 0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%, 100% 0%)" }}></div>
                    
                    <div className="size-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border-4 border-text shadow-[4px_4px_0px_#2D2D2D] transform rotate-3">
                        <ReceiptCent className="size-10 text-primary" />
                    </div>
                    
                    <DialogTitle className="text-4xl font-display text-text uppercase tracking-tighter mb-2 drop-shadow-[1px_1px_0px_#D9381E]">
                        BIÊN LAI CHI TIẾT
                    </DialogTitle>
                    <p className="text-xs font-display text-text/40 uppercase tracking-[0.4em]">Bun Bo System x Nha Trang</p>
                    
                    <div className="mt-10 flex items-center justify-between px-4">
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-text/30 uppercase tracking-widest mb-1">Mã vận đơn</p>
                            <p className="font-display text-lg text-text">#{order.id.split('-')[0].toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-text/30 uppercase tracking-widest mb-1">Thời gian</p>
                            <p className="font-display text-lg text-text">{format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}</p>
                        </div>
                    </div>

                    <div className="mt-8 border-b-4 border-dashed border-text/10"></div>
                </div>

                {/* Items List */}
                <div className="px-10 py-6 max-h-[40vh] overflow-y-auto custom-scrollbar bg-white">
                    <div className="space-y-8">
                        {order.orderItems?.map((item: OrderItem) => (
                            <div key={item.id} className="flex justify-between items-start group">
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-display text-white bg-primary size-7 flex items-center justify-center rounded-lg border-2 border-text shadow-[2px_2px_0px_#2D2D2D] shrink-0">{item.quantity}</span>
                                        <h4 className="font-display text-text text-lg group-hover:text-primary transition-colors uppercase tracking-tight">
                                            {item.productName || item.dishName || 'Món ăn'}
                                        </h4>
                                    </div>
                                    {item.note && (
                                        <div className="mt-2 ml-10 flex items-center gap-2 text-[10px] font-bold text-secondary bg-secondary/5 px-3 py-1 rounded-full border border-secondary/20">
                                            <StickyNote className="size-3" />
                                            <span className="uppercase tracking-wider">{item.note}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="font-display text-xl text-text">
                                        {(item.totalPrice || (item.quantity * item.unitPrice))?.toLocaleString('vi-VN')}đ
                                    </div>
                                    <div className="text-[9px] font-bold text-text/30 tracking-widest uppercase">
                                        @{item.unitPrice?.toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="px-10 pb-12 bg-white">
                    <div className="my-8 border-b-4 border-dashed border-text/10"></div>
                    
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-8">
                            <div className="transform scale-110">
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="h-10 w-1 bg-text/10 rounded-full"></div>
                            <div className="flex flex-col items-start gap-1">
                                <div className="size-12 bg-gray-50 rounded-full flex items-center justify-center border-2 border-text/10 text-text/20">
                                    <Info className="size-6" />
                                </div>
                                <span className="text-[10px] font-black text-text/30 uppercase tracking-widest">Bàn {order.tableName || '---'}</span>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <span className="block text-[10px] font-bold text-text/30 uppercase tracking-widest mb-1">Tổng cộng</span>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-5xl font-display text-text tracking-tighter drop-shadow-[1px_1px_0px_#D9381E]">
                                    {order.totalAmount?.toLocaleString('vi-VN')}
                                </span>
                                <span className="text-lg font-display text-primary">đ</span>
                            </div>
                        </div>
                    </div>

                    {order.note && (
                        <div className="mb-10 p-6 bg-paper rounded-3xl border-2 border-dashed border-text/10 italic relative">
                            <div className="absolute -top-3 left-6 bg-white px-3 text-[10px] font-bold text-text/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                <StickyNote className="size-3" /> Lời nhắn từ bạn
                            </div>
                            <p className="text-sm font-main text-text/70 leading-relaxed">&quot;{order.note}&quot;</p>
                        </div>
                    )}

                    <div className="pt-10 border-t-2 border-text/5 text-center">
                        <p className="text-[10px] font-bold text-text/20 uppercase tracking-[0.8em] animate-pulse">*** END OF RECEIPT ***</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
