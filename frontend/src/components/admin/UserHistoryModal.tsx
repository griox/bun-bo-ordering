'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Receipt, Clock, User as UserIcon, Calendar, ArrowRight } from "lucide-react";
import { Order, useUpdateOrderStatusMutation } from "@/hooks/useOrders";
import { User } from "@/hooks/useUsers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    orders: Order[] | null;
    isLoading: boolean;
    onViewOrder: (order: Order) => void;
}

export function UserHistoryModal({ isOpen, onClose, user, orders, isLoading, onViewOrder }: UserHistoryModalProps) {
    const updateStatusMutation = useUpdateOrderStatusMutation();

    if (!user) return null;

    const handleUpdateStatus = async (orderId: string, statusText: string) => {
        const statusMap: Record<string, number> = {
            'Unpaid': 0,
            'Paid': 1
        };

        const statusInt = statusMap[statusText];
        if (statusInt === undefined) return;

        try {
            await updateStatusMutation.mutateAsync({ orderId, statusInt });
            toast.success(`Đã cập nhật trạng thái đơn thành ${statusText}`);
        } catch {
            // Error handled by mutation
        }
    };

    const getStatusBadge = (status: string | number) => {
        const isPaid = status === 'Paid' || status === 1;

        if (isPaid) {
            return <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold text-[10px] uppercase px-2 py-0.5">ĐÃ THANH TOÁN</Badge>;
        }
        return <Badge variant="secondary" className="bg-red-50 text-red-600 border-none font-bold text-[10px] uppercase px-2 py-0.5 animate-pulse">CHƯA THANH TOÁN</Badge>;
    };

    const totalSpent = orders?.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[800px] border-none shadow-2xl rounded-2xl p-0 overflow-hidden bg-white gap-0">
                <DialogDescription className="sr-only">Chi tiết hồ sơ và lịch sử giao dịch của người dùng</DialogDescription>
                
                <DialogHeader className="p-8 border-b border-gray-100 m-0 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="size-16 bg-white rounded-2xl flex flex-shrink-0 items-center justify-center border border-gray-200 shadow-sm text-primary">
                                <UserIcon className="size-8" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Chi tiết hồ sơ
                                </DialogTitle>
                                <div className="flex flex-col mt-1">
                                    <span className="text-sm font-bold text-gray-900">{user.username}</span>
                                    <div className="flex items-center gap-4 mt-0.5">
                                        <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                                        <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                                            <Calendar className="size-3.5" /> 
                                            Tham gia {format(new Date(user.createdAt), "dd/MM/yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm min-w-[160px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TỔNG CHI TIÊU</p>
                                <p className="text-2xl font-bold text-primary tracking-tight">{totalSpent.toLocaleString('vi-VN')}đ</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lịch sử giao dịch</h3>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{orders?.length || 0} đơn hàng</span>
                        </div>

                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <Clock className="size-8 animate-spin text-primary/40" />
                                <p className="font-bold text-[11px] uppercase tracking-wider text-gray-400">Đang tải dữ liệu...</p>
                            </div>
                        ) : !orders || orders.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                <p className="text-gray-400 font-bold text-xs uppercase">Chưa có giao dịch nào</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="group bg-white rounded-xl p-4 border border-gray-100 transition-all hover:border-primary/20 hover:bg-primary/[0.02] flex items-center justify-between gap-4 cursor-pointer"
                                        onClick={() => onViewOrder(order)}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="size-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                <Receipt size={18} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm tracking-tight">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                                                    <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                                    <span>•</span>
                                                    <span>{order.tableName || 'Mang đi'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900 tracking-tight">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.paymentMethod || 'Tiền mặt'}</p>
                                            </div>

                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="size-8 p-0 hover:bg-gray-100 rounded-lg">
                                                            <ArrowRight className="size-4 rotate-90 text-gray-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-gray-200">
                                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trạng thái</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-xs font-bold py-2 cursor-pointer" onClick={() => handleUpdateStatus(order.id, 'Unpaid')}>Chưa thanh toán</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-xs font-bold py-2 cursor-pointer text-green-600" onClick={() => handleUpdateStatus(order.id, 'Paid')}>Đã thanh toán</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <Button variant="outline" className="border-gray-200 font-bold text-xs rounded-xl h-10 px-8 bg-white hover:bg-gray-50" onClick={onClose}>
                        ĐÓNG CỬA SỔ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
