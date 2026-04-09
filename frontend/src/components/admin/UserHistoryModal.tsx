'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
        const baseClass = "font-black uppercase text-[8px] px-2.5 py-1 rounded-lg border transition-all bg-white shadow-sm tracking-widest";
        const isPaid = status === 'Paid' || status === 1;

        if (isPaid) {
            return <Badge variant="outline" className={`${baseClass} text-green-500 border-green-100 bg-green-50/50`}>ĐÃ THANH TOÁN</Badge>;
        }
        return <Badge variant="outline" className={`${baseClass} text-red-500 border-red-100 bg-red-50/50 animate-pulse`}>CHƯA THANH TOÁN</Badge>;
    };

    const totalSpent = orders?.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[800px] border border-gray-100 shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-white gap-0">
                <DialogHeader className="p-8 border-b border-gray-100 bg-gray-50/30 m-0 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="size-16 bg-primary/10 rounded-2xl flex flex-shrink-0 items-center justify-center border border-primary/20 shadow-sm text-primary">
                                <UserIcon className="size-8" />
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-3xl font-black text-black uppercase tracking-tighter">
                                    Hồ sơ & Lịch sử
                                </DialogTitle>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-4">
                                    <span>User: {user.username}</span>
                                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {format(new Date(user.createdAt), "dd/MM/yyyy")}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm min-w-[120px]">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tổng chi tiêu</p>
                                <p className="text-lg font-black text-primary leading-tight">{totalSpent.toLocaleString('vi-VN')}đ</p>
                            </div>
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm min-w-[100px]">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Số đơn hàng</p>
                                <p className="text-lg font-black text-black leading-tight">{orders?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Danh sách giao dịch</h3>
                        </div>

                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                                <Clock className="size-10 animate-spin text-primary" />
                                <p className="font-bold uppercase text-[10px] tracking-widest text-gray-400">Đang truy xuất dữ liệu...</p>
                            </div>
                        ) : !orders || orders.length === 0 ? (
                            <div className="py-20 text-center border-4 border-dashed border-gray-50 rounded-3xl opacity-30">
                                <p className="text-gray-400 font-bold uppercase text-xs">Chưa có giao dịch nào</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="group bg-gray-50/50 rounded-2xl p-4 border border-gray-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 flex items-center justify-between gap-4 cursor-pointer"
                                        onClick={() => onViewOrder(order)}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="size-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                <Receipt size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-black text-sm tracking-tighter">#{order.id.split('-')[0].toUpperCase()}</span>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                                    <span>•</span>
                                                    <span>{order.tableName || 'Mang đi'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-black tracking-tighter">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{order.paymentMethod || 'Tiền mặt'}</p>
                                            </div>

                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="inline-block">
                                                            <Button variant="ghost" className="size-8 p-0 hover:bg-gray-100 rounded-lg">
                                                                <ArrowRight className="size-4 rotate-90" />
                                                            </Button>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-gray-100 font-mono">
                                                        <DropdownMenuLabel className="text-[8px] uppercase tracking-widest opacity-50">Trạng thái</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-[10px] font-bold uppercase py-2 cursor-pointer" onClick={() => handleUpdateStatus(order.id, 'Unpaid')}>Chưa thanh toán</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-[10px] font-bold uppercase py-2 cursor-pointer text-green-600" onClick={() => handleUpdateStatus(order.id, 'Paid')}>Đã thanh toán</DropdownMenuItem>
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
                    <Button variant="outline" className="border-gray-200 font-black text-[10px] uppercase rounded-xl h-10 px-8" onClick={onClose}>
                        Đóng cửa sổ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
