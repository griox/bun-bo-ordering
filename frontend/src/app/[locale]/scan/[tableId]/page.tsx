'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useScanTableMutation } from '@/hooks/useTables';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerOrders, Order } from '@/hooks/useOrders';
import { useReorderPreference } from '@/hooks/useReorderPreference';
import { ReorderPrompt } from '@/components/order/ReorderPrompt';
import { Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

type Phase = 'scanning' | 'reorder_prompt' | 'redirecting';

const TOP_ITEMS_ID = '__top_items__';

export default function ScanPage() {
    const { tableId } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { setSession, setTable, clearCart, addToCart } = useOrderStore();
    const [phase, setPhase] = useState<Phase>('scanning');
    const scanMutation = useScanTableMutation();

    const isLoggedIn = !!user?.userId;
    const { data: pagedData, isLoading: ordersLoading } = useCustomerOrders(isLoggedIn ? user?.userId : undefined);
    const orders = pagedData?.items;
    const { preferredOrderId, savePreference } = useReorderPreference();

    const [scanDone, setScanDone] = useState(false);

    useEffect(() => {
        const doScan = async (id: string) => {
            try {
                const result = await scanMutation.mutateAsync(id);

                if (result.sessionId) {
                    clearCart();
                    setSession({
                        id: result.sessionId,
                        tableId: id,
                        startTime: new Date().toISOString(),
                        isActive: true,
                    });
                    setTable({ id, tableCode: '', name: 'Bàn vừa quét' });
                    toast.success('Quét mã thành công! Chào mừng bạn đến với BunBo.');
                    setScanDone(true);
                }
            } catch {
                toast.error('Mã QR không hợp lệ hoặc đã hết hạn.');
                router.push('/menu');
            }
        };

        if (tableId) doScan(tableId as string);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    useEffect(() => {
        if (!scanDone) return;

        // If user is logged in, wait for orders to finish loading
        if (isLoggedIn && ordersLoading) return;

        if (isLoggedIn && orders && orders.length > 0) {
            setPhase('reorder_prompt');
        } else {
            setPhase('redirecting');
            router.push('/menu');
        }
    }, [scanDone, isLoggedIn, ordersLoading, orders, router]);

    const handleReorderConfirm = async (selectedId: string, saveAsDefault: boolean) => {
        if (selectedId === TOP_ITEMS_ID) {
            // Compute top items across all orders
            const map: Record<string, { foodId: string; name: string; price: number; qty: number }> = {};
            (orders ?? []).forEach(order => {
                order.orderItems?.forEach(item => {
                    const key = item.foodId ?? item.dishId ?? item.id;
                    if (!map[key]) {
                        map[key] = {
                            foodId: key,
                            name: item.productName ?? item.dishName ?? '',
                            price: item.unitPrice,
                            qty: 0,
                        };
                    }
                    map[key].qty += item.quantity;
                });
            });
            Object.values(map)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5)
                .forEach(({ foodId, name, price, qty }) => {
                    addToCart({ foodId, name, price, quantity: qty });
                });
        } else {
            const selectedOrder = (orders ?? []).find((o: Order) => o.id === selectedId);
            if (selectedOrder) {
                selectedOrder.orderItems?.forEach(item => {
                    addToCart({
                        foodId: item.foodId ?? item.dishId ?? item.id,
                        name: item.productName ?? item.dishName ?? '',
                        price: item.unitPrice,
                        quantity: item.quantity,
                        note: item.note,
                    });
                });
                if (saveAsDefault) {
                    try {
                        await savePreference.mutateAsync(selectedId);
                    } catch {
                        toast.error('Không thể lưu lựa chọn mặc định, nhưng đơn vẫn được thêm vào giỏ.');
                    }
                }
            }
        }

        setPhase('redirecting');
        router.push('/menu');
    };

    const handleSkip = () => {
        setPhase('redirecting');
        router.push('/menu');
    };

    if (phase === 'reorder_prompt' && orders && orders.length > 0) {
        return (
            <div className="h-screen w-full bg-[#450A0A]/60 backdrop-blur-sm relative flex items-end">
                <AnimatePresence>
                    <ReorderPrompt
                        orders={orders}
                        preferredOrderId={preferredOrderId}
                        onConfirm={handleReorderConfirm}
                        onSkip={handleSkip}
                    />
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6 px-10">
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-primary text-white p-8 rounded-[2.5rem] shadow-2xl">
                    <QrCode className="w-16 h-16 animate-bounce" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-neutral-800">Đang nhận diện bàn...</h1>
                <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                    Vui lòng đợi trong giây lát, chúng tôi đang kết nối bạn với nhà bếp.
                </p>
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
}
