'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Receipt, Clock, User as UserIcon, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Order, useCustomerOrders } from "@/hooks/useOrders";
import { User } from "@/hooks/useUsers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

interface UserHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onViewOrder: (order: Order) => void;
}

export function UserHistoryModal({ isOpen, onClose, user, onViewOrder }: UserHistoryModalProps) {
    const [page, setPage] = useState(0);

    // Reset to first page when user changes
    React.useEffect(() => { setPage(0); }, [user?.id]);

    const { data: pagedData, isLoading } = useCustomerOrders(
        user?.id,
        page * PAGE_SIZE,
        PAGE_SIZE,
    );

    const orders     = pagedData?.items     ?? [];
    const totalCount = pagedData?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (!user) return null;

    const getStatusBadge = (status: string | number) => {
        const isPaid = status === 'Paid' || status === 1;
        if (isPaid) {
            return <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold text-[10px] uppercase px-2 py-0.5">Đã TT</Badge>;
        }
        if (status === 4 || status === 'Completed') {
            return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] uppercase px-2 py-0.5">Hoàn thành</Badge>;
        }
        return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[10px] uppercase px-2 py-0.5 animate-pulse">Chưa TT</Badge>;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[760px] border-none shadow-2xl rounded-2xl p-0 overflow-hidden bg-white gap-0">
                <DialogDescription className="sr-only">Lịch sử đơn hàng của người dùng</DialogDescription>

                {/* Header */}
                <DialogHeader className="p-6 border-b border-gray-100 m-0 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white rounded-2xl flex flex-shrink-0 items-center justify-center border border-gray-200 shadow-sm text-primary">
                                <UserIcon className="size-7" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
                                    {user.username}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                        <Calendar className="size-3" />
                                        {format(new Date(user.createdAt), "dd/MM/yyyy")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tổng đơn hàng</p>
                            <p className="text-2xl font-bold text-primary">{totalCount.toLocaleString()}</p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Order list — fixed height, no virtualization needed (max 20 items/page) */}
                <div className="p-5 h-[440px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {/* Pagination info */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Lịch sử giao dịch
                        </h3>
                        <span className="text-[11px] font-bold text-gray-400">
                            Trang {page + 1}/{totalPages || 1} · {totalCount} đơn
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <Loader2 className="size-8 animate-spin text-primary/40" />
                            <p className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Đang tải...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-2xl">
                            <Receipt className="size-10 text-gray-300 mb-2" />
                            <p className="text-gray-400 font-bold text-xs uppercase">Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="group bg-white rounded-xl p-3.5 border border-gray-100 transition-all hover:border-primary/20 hover:bg-primary/[0.02] flex items-center justify-between gap-4 cursor-pointer"
                                    onClick={() => onViewOrder(order)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="size-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                            <Receipt size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm tracking-tight">
                                                    #{order.id.split('-')[0].toUpperCase()}
                                                </span>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mt-0.5">
                                                <Clock className="size-3 shrink-0" />
                                                <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                                <span>·</span>
                                                <span className="truncate">{order.tableName || 'Mang đi'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-900 text-sm">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{order.paymentMethod || 'Tiền mặt'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer: pagination controls */}
                <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        className="border-gray-200 font-bold text-xs rounded-xl h-9 px-6 bg-white hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Đóng
                    </Button>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="size-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="size-4 text-gray-600" />
                            </button>
                            <span className="text-xs font-bold text-gray-500 px-2">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="size-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="size-4 text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
