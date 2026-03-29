'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ReceiptCent, Clock, StickyNote, Activity, Info } from "lucide-react";

export function OrderDetailModal({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: any }) {
    if (!order) return null;

    const getStatusBadge = (status: string) => {
        const baseClass = "font-black uppercase text-[9px] px-3 py-1.5 rounded-xl border transition-all bg-white shadow-sm tracking-widest";
        const isPaid = status === 'Completed' || status === 'Paid';

        if (isPaid) {
            return <span className={`${baseClass} text-green-500 border-green-100 bg-green-50/50`}>ĐÃ THANH TOÁN</span>;
        }
        if (status === 'Cancelled') {
            return <span className={`${baseClass} text-gray-500 border-gray-200 bg-gray-50`}>{status}</span>;
        }
        return <span className={`${baseClass} text-orange-500 border-orange-100 bg-orange-50/50 animate-pulse`}>CHƯA THANH TOÁN</span>;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[700px] border border-gray-100 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-white gap-0">
                <DialogHeader className="p-8 border-b border-gray-100 bg-white m-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff4d4f] to-transparent opacity-50"></div>
                    <div className="flex items-center gap-5">
                        <div className="size-16 bg-[#ff4d4f]/10 rounded-2xl flex flex-shrink-0 items-center justify-center border border-[#ff4d4f]/20 shadow-sm">
                            <ReceiptCent className="size-8 text-[#ff4d4f]" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-3xl font-black text-black uppercase tracking-tighter">
                                Hóa Đơn Chi Tiết
                            </DialogTitle>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                                Mã đơn: #{order.id.split('-')[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar bg-gray-50/40">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-6">
                            <Info className="size-4 text-gray-400" />
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Danh sách món tương ứng</h3>
                        </div>

                        {order.orderItems?.map((item: any) => (
                            <div key={item.id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:border-[#ff4d4f]/30 hover:shadow-md flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <h4 className="font-extrabold text-black text-lg transition-colors group-hover:text-[#ff4d4f]">
                                            {item.productName || item.dishName || 'Món ăn'}
                                        </h4>
                                        {item.note && (
                                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-orange-500 bg-orange-50/50 px-2.5 py-1 rounded inline-flex">
                                                <StickyNote className="size-3" />
                                                <span className="uppercase tracking-wider">{item.note}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-black text-lg text-black">
                                            {item.totalPrice?.toLocaleString('vi-VN')}
                                            <span className="text-xs ml-0.5 text-gray-500">đ</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-1">
                                            {item.quantity} x {item.unitPrice?.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/80 flex flex-col items-start gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Clock className="size-3" /> Thời gian order
                            </div>
                            <span className="font-black text-black">
                                {format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy")}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/80 flex flex-col items-start gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Activity className="size-3" /> Trạng thái
                            </div>
                            <div className="mt-[-2px]">
                                {getStatusBadge(order.status)}
                            </div>
                        </div>
                    </div>

                    {order.note && (
                        <div className="mb-6 bg-red-50/50 border border-red-100 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#ff4d4f] uppercase tracking-widest mb-1.5">
                                <StickyNote className="size-3" /> Ghi chú tổng
                            </div>
                            <span className="font-bold text-sm text-black">{order.note}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-end bg-[#ff4d4f] text-white p-6 rounded-[1.5rem] shadow-lg shadow-[#ff4d4f]/20">
                        <div>
                            <span className="block font-bold text-[10px] text-white/80 uppercase tracking-widest mb-1">
                                Tổng thanh toán
                            </span>
                            <span className="font-black uppercase text-sm opacity-90">
                                Đã bao gồm VAT
                            </span>
                        </div>
                        <div className="font-black text-4xl tracking-tighter">
                            {order.totalAmount?.toLocaleString('vi-VN')}
                            <span className="text-xl ml-1 font-bold opacity-80">đ</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
