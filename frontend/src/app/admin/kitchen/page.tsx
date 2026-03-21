'use client';

import React from 'react';
import { useKitchenStore } from '@/store/useKitchenStore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat, Timer, CheckCircle, XCircle, CookingPot, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUpdateOrderStatusMutation } from '@/hooks/useOrders';

const STATUS_MAP = {
    'Created': 0,
    'Cooking': 3,
    'Served': 4,
    'Cancelled': 6
};

export default function KitchenPage() {
    const { orders, updateOrderStatus } = useKitchenStore();
    const updateStatusMutation = useUpdateOrderStatusMutation();

    const handleUpdateStatus = (orderId: string, newStatus: string) => {
        const statusInt = (STATUS_MAP as any)[newStatus];

        updateStatusMutation.mutate({ orderId, statusInt }, {
            onSuccess: () => {
                updateOrderStatus(orderId, newStatus as any);
                toast.success(`Đã cập nhật trạng thái đơn hàng`);
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Created': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'Cooking': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'Served': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'Cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-text/5 text-text/60 border-text/10';
        }
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#2D2D2D] border-2 border-text rotate-3">
                        <ChefHat className="size-8 text-white -rotate-3" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-display font-bold text-text mb-1 uppercase tracking-tight">ĐIỀU PHỐI BẾP</h2>
                        <p className="text-text/60 font-medium">Quản lý các đơn hàng đang được chế biến.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-paper border-2 border-text p-4 rounded-3xl shadow-[6px_6px_0px_rgba(0,0,0,0.05)]">
                    <div className="text-center px-4">
                        <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest mb-1">ĐANG CHỜ</p>
                        <p className="text-3xl font-display font-bold text-text">{orders.filter(o => o.status === 'Created').length}</p>
                    </div>
                    <div className="w-0.5 bg-text/5 h-10 rounded-full" />
                    <div className="text-center px-4">
                        <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest mb-1">ĐANG NẤU</p>
                        <p className="text-3xl font-display font-bold text-blue-600">{orders.filter(o => o.status === 'Cooking').length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 bg-paper/50 border-4 border-dashed border-text/10 rounded-[3rem]">
                            <div className="size-24 bg-text/5 rounded-full flex items-center justify-center">
                                <CookingPot className="size-12 text-text/20" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-display font-bold text-text/40 uppercase">Bếp đang trống</p>
                                <p className="text-text/30 font-medium">Hiện tại không có đơn hàng nào cần xử lý</p>
                            </div>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                key={order.orderId}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            >
                                <Card className="h-full flex flex-col border-2 border-text shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.08)] transition-all duration-300 bg-paper">
                                    <div className={`h-3 w-full transition-colors ${order.status === 'Created' ? 'bg-yellow-400' :
                                        order.status === 'Cooking' ? 'bg-blue-500' :
                                            'bg-green-500'
                                        }`} />

                                    <CardHeader className="pb-4 px-6 pt-6 flex flex-row items-center justify-between border-b-2 border-text/5">
                                        <div>
                                            <CardTitle className="text-2xl font-display font-bold text-text">BÀN #{order.tableNumber}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Timer className="size-3 text-text/40" />
                                                <p className="text-[10px] text-text/40 font-bold uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={`${getStatusColor(order.status)} border-2 font-bold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider`}>
                                            {order.status === 'Created' ? 'Đang chờ' :
                                                order.status === 'Cooking' ? 'Đang nấu' :
                                                    order.status === 'Served' ? 'Đã xong' :
                                                        order.status === 'Cancelled' ? 'Đã hủy' : order.status}
                                        </Badge>
                                    </CardHeader>

                                    <CardContent className="flex-1 py-6 px-6 bg-background/5">
                                        <div className="space-y-4">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-start gap-4 p-3 bg-paper border-2 border-text/5 rounded-2x; group-hover:border-primary/20 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className="size-8 rounded-lg bg-background border-2 border-text flex items-center justify-center font-display font-bold text-sm shadow-[2px_2px_0px_#2D2D2D] shrink-0">
                                                            {item.quantity}
                                                        </div>
                                                        <div className="pt-0.5">
                                                            <p className="font-bold text-sm tracking-tight text-text leading-tight uppercase">{item.productName}</p>
                                                            {item.note && (
                                                                <div className="mt-1.5 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-lg w-fit">
                                                                    <p className="text-[9px] text-red-600 font-bold uppercase tracking-tighter">Lưu ý: {item.note}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex-col gap-4 p-6 border-t-2 border-text/5 bg-background/10">
                                        <div className="flex gap-3 w-full">
                                            {order.status === 'Created' && (
                                                <Button
                                                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold text-sm gap-2 rounded-2xl border-2 border-text shadow-[4px_4px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2D2D2D] transition-all"
                                                    disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                    onClick={() => handleUpdateStatus(order.orderId, 'Cooking')}
                                                >
                                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="size-5 animate-spin" /> : <CookingPot className="size-5" />}
                                                    CHẾ BIẾN
                                                </Button>
                                            )}
                                            {order.status === 'Cooking' && (
                                                <Button
                                                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-display font-bold text-sm gap-2 rounded-2xl border-2 border-text shadow-[4px_4px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2D2D2D] transition-all"
                                                    disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                    onClick={() => handleUpdateStatus(order.orderId, 'Served')}
                                                >
                                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                                                    XONG
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="size-12 rounded-2xl border-2 border-text text-text/40 hover:text-red-500 hover:bg-red-50 shadow-[4px_4px_0px_#2D2D2D] active:translate-y-[1px] active:shadow-[2px_2px_0px_#2D2D2D] transition-all shrink-0 p-0"
                                                disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                onClick={() => handleUpdateStatus(order.orderId, 'Cancelled')}
                                            >
                                                {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="size-5 animate-spin" /> : <XCircle className="size-6" />}
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
