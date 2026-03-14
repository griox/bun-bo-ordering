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
            case 'Created': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cooking': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Served': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-neutral-800 flex items-center gap-3">
                    <ChefHat className="w-8 h-8 text-primary" />
                    Điều phối Nhà bếp
                </h2>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-sm text-neutral-500">Đang chờ</p>
                        <p className="text-2xl font-bold">{orders.filter(o => o.status === 'Created').length}</p>
                    </div>
                    <div className="w-px bg-neutral-200 h-10" />
                    <div className="text-right">
                        <p className="text-sm text-neutral-500">Đang nấu</p>
                        <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'Cooking').length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {orders.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 bg-white rounded-2xl border-2 border-dashed border-neutral-200">
                            <CookingPot className="w-16 h-16 text-neutral-200" />
                            <p className="text-neutral-400 font-medium">Hiện tại không có đơn hàng nào cần xử lý</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                key={order.orderId}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="h-full flex flex-col shadow-lg border-none ring-1 ring-neutral-200 overflow-hidden group hover:ring-primary transition-all duration-300">
                                    <div className={`h-2 w-full transition-colors ${
                                        order.status === 'Created' ? 'bg-yellow-400' : 
                                        order.status === 'Cooking' ? 'bg-blue-500' : 
                                        'bg-green-500'
                                    }`} />
                                    
                                    <CardHeader className="pb-3 px-5 py-4 flex flex-row items-center justify-between bg-neutral-50/50">
                                        <div>
                                            <CardTitle className="text-xl font-bold">Bàn #{order.tableNumber}</CardTitle>
                                            <p className="text-[10px] text-neutral-400 font-mono mt-1">ID: {order.orderId.slice(0, 8)}</p>
                                        </div>
                                        <Badge className={`${getStatusColor(order.status)} border px-2 py-0.5`}>
                                            {order.status === 'Created' ? 'Đang chờ' : 
                                             order.status === 'Cooking' ? 'Đang nấu' : 
                                             order.status === 'Served' ? 'Đã phục vụ' : 
                                             order.status === 'Cancelled' ? 'Đã hủy' : order.status}
                                        </Badge>
                                    </CardHeader>
                                    
                                    <CardContent className="flex-1 py-4 px-5">
                                        <div className="space-y-3">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-start gap-3">
                                                    <div className="flex gap-2">
                                                        <span className="font-bold text-primary font-mono bg-neutral-100 px-1.5 rounded h-6 flex items-center">{item.quantity}x</span>
                                                        <div>
                                                            <p className="font-medium text-sm leading-tight">{item.productName}</p>
                                                            {item.note && <p className="text-[10px] text-red-500 font-medium italic mt-0.5">Note: {item.note}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex-col gap-4 pt-4 px-5 pb-5">
                                        <div className="flex items-center justify-between w-full text-xs text-neutral-500">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Timer className="w-3.5 h-3.5" />
                                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                            </div>
                                            <span className="font-bold text-neutral-800">
                                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} món
                                            </span>
                                        </div>

                                        <div className="flex gap-2 w-full">
                                            {order.status === 'Created' && (
                                                <Button 
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                                                    disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                    onClick={() => handleUpdateStatus(order.orderId, 'Cooking')}
                                                >
                                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CookingPot className="w-4 h-4" />}
                                                    CHẾ BIẾN
                                                </Button>
                                            )}
                                            {order.status === 'Cooking' && (
                                                <Button 
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                                                    disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                    onClick={() => handleUpdateStatus(order.orderId, 'Served')}
                                                >
                                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    PHỤC VỤ
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-500"
                                                disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId}
                                                onClick={() => handleUpdateStatus(order.orderId, 'Cancelled')}
                                            >
                                                {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
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
