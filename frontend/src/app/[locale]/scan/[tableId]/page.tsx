'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { useScanTableMutation } from '@/hooks/useTables';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerOrders, Order } from '@/hooks/useOrders';
import { useReorderPreference } from '@/hooks/useReorderPreference';
import { ReorderPrompt } from '@/components/order/ReorderPrompt';
import { useCart, usePlaceOrderMutation } from '@/hooks/useCart';
import { Loader2, QrCode, Smartphone, Receipt, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';

type Phase = 'scanning' | 'reorder_prompt' | 'payment_selection' | 'payment_qr' | 'redirecting';

const TOP_ITEMS_ID = '__top_items__';

export default function ScanPage() {
    const { tableId } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { 
        setSession, 
        setTable, 
        clearCart, 
        addToCart, 
        session, 
        table, 
        paymentSuccessOrderId, 
        setPaymentSuccess, 
        extendSession 
    } = useOrderStore();
    
    const [phase, setPhase] = useState<Phase>('scanning');
    const scanMutation = useScanTableMutation();

    const isLoggedIn = !!user?.userId;
    const { data: pagedData, isLoading: ordersLoading } = useCustomerOrders(isLoggedIn ? user?.userId : undefined);
    const orders = pagedData?.items;
    const { preferredOrderId, savePreference } = useReorderPreference();

    const [scanDone, setScanDone] = useState(false);

    // Reorder state
    const [reorderItems, setReorderItems] = useState<{ foodId: string; name: string; price: number; quantity: number; note?: string }[]>([]);
    const [reorderTotal, setReorderTotal] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | null>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [isSavingPreference, setIsSavingPreference] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    // Cart and order hooks
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();

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

    // Realtime payment listener
    useEffect(() => {
        if (paymentOrderId && paymentSuccessOrderId) {
            const isMatch = paymentOrderId.toLowerCase() === paymentSuccessOrderId.toLowerCase();
            if (isMatch) {
                toast.success("Thanh toán thành công! Nhà bếp đang chuẩn bị món ăn.");
                clearCart();
                extendSession();

                Promise.resolve().then(() => {
                    setPaymentSuccess(null);
                    setPaymentOrderId(null);
                    setPhase('redirecting');
                    router.push('/history');
                });
            }
        }
    }, [paymentSuccessOrderId, paymentOrderId, setPaymentSuccess, clearCart, extendSession, router]);

    const handleReorderConfirm = async (selectedId: string, saveAsDefault: boolean) => {
        setSelectedOrderId(selectedId);
        setIsSavingPreference(saveAsDefault);

        let items: { foodId: string; name: string; price: number; quantity: number; note?: string }[] = [];

        if (selectedId === TOP_ITEMS_ID) {
            const map: Record<string, { foodId: string; name: string; price: number; quantity: number }> = {};
            (orders ?? []).forEach(order => {
                order.orderItems?.forEach(item => {
                    const key = item.foodId ?? item.dishId ?? item.id;
                    if (!map[key]) {
                        map[key] = {
                            foodId: key,
                            name: item.productName ?? item.dishName ?? '',
                            price: item.unitPrice,
                            quantity: 0,
                        };
                    }
                    map[key].quantity += item.quantity;
                });
            });
            items = Object.values(map)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
        } else {
            const selectedOrder = (orders ?? []).find((o: Order) => o.id === selectedId);
            if (selectedOrder) {
                selectedOrder.orderItems?.forEach(item => {
                    items.push({
                        foodId: item.foodId ?? item.dishId ?? item.id,
                        name: item.productName ?? item.dishName ?? '',
                        price: item.unitPrice,
                        quantity: item.quantity,
                        note: item.note,
                    });
                });
            }
        }

        if (items.length === 0) {
            toast.error("Không tìm thấy món ăn để đặt lại.");
            return;
        }

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setReorderItems(items);
        setReorderTotal(total);
        setPhase('payment_selection');
    };

    const handlePaymentConfirm = async () => {
        if (!paymentMethod) {
            toast.error("Vui lòng chọn hình thức thanh toán.");
            return;
        }

        try {
            // 1. Sync backend Redis cart
            const cartPayload = reorderItems.map(item => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity,
                note: item.note
            }));
            await syncCart(cartPayload);

            // 2. Add items to local store cart
            clearCart();
            reorderItems.forEach(item => {
                addToCart({
                    foodId: item.foodId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    note: item.note
                });
            });

            // 3. Place order
            const orderIdResult = await placeOrderMutation.mutateAsync({
                paymentMethod: paymentMethod,
            });
            const finalOrderId = orderIdResult.id || orderIdResult.Id;

            if (!finalOrderId) {
                toast.error("Lỗi tạo đơn hàng: không nhận được mã đơn.");
                return;
            }

            // 4. Save preference if selected
            if (isSavingPreference && selectedOrderId !== TOP_ITEMS_ID) {
                try {
                    await savePreference.mutateAsync(selectedOrderId);
                } catch {
                    console.error("Failed to save default preference");
                }
            }

            // 5. Handle routing and transactions
            if (paymentMethod === 'Transfer') {
                try {
                    await axiosInstance.post('/api/payments', {
                        orderId: finalOrderId,
                        amount: reorderTotal,
                        tableSessionId: session?.id,
                        tableNumber: table?.name
                    });
                } catch (err) {
                    console.error('Failed to initialize payment transaction', err);
                }
                setPaymentOrderId(finalOrderId);
                setPhase('payment_qr');
            } else {
                toast.success("Đơn hàng đã được ghi nhận. Vui lòng thanh toán tại quầy!");
                clearCart();
                extendSession();
                setPhase('redirecting');
                router.push('/history');
            }
        } catch (error) {
            console.error("Reorder submission failed:", error);
        }
    };

    const handleSkip = () => {
        setPhase('redirecting');
        router.push('/menu');
    };

    // VietQR settings
    const SEPAY_CONFIG = {
        BANK: 'ICB',
        BIN: '970415',
        ACC: '104876858916'
    };

    const BANK_SCHEMES: Record<string, (acc: string, amount: number, note: string) => string> = {
        icb: (acc, am, tn) => `icbapp://transfer?ben_account=${acc}&amount=${am}&content=${encodeURIComponent(tn)}`,
        vcb: (acc, am, tn) => `vcbdirect://qrpay?account=${acc}&amount=${am}&remark=${encodeURIComponent(tn)}`,
        mbbank: (acc, am, tn) => `mbmobile://transfer?toAccNo=${acc}&amount=${am}&memo=${encodeURIComponent(tn)}`,
        tcb: (acc, am, tn) => `techcombank://payment?beneficiaryAccount=${acc}&amount=${am}&description=${encodeURIComponent(tn)}`,
        acb: (acc, am, tn) => `acbmobile://transfer?toAccount=${acc}&amount=${am}&note=${encodeURIComponent(tn)}`,
        vpbank: (acc, am, tn) => `vpbanknexgen://transfer?toAcc=${acc}&amount=${am}&note=${encodeURIComponent(tn)}`,
    };

    // Render logic
    if (phase === 'scanning') {
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

    if (phase === 'payment_selection') {
        return (
            <div className="min-h-screen w-full bg-[#FDF8F3] px-6 py-10 flex flex-col justify-between font-main">
                <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <button 
                            onClick={() => setPhase('reorder_prompt')}
                            className="p-2 bg-white rounded-full border border-red-100 text-[#450A0A] shadow-sm active:scale-95 transition-all"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-2xl font-black text-[#450A0A] tracking-tight">Thanh toán & Đặt món</h1>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm space-y-4 mb-6">
                        <h2 className="text-xs font-black text-[#7f1d1d]/40 uppercase tracking-widest">Tóm tắt đơn đặt lại</h2>
                        <div className="max-h-[30vh] overflow-y-auto no-scrollbar space-y-3 pr-1">
                            {reorderItems.map((item) => (
                                <div key={item.foodId} className="flex justify-between items-center py-2 border-b border-red-50">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="font-bold text-sm text-[#450A0A] truncate">{item.name}</p>
                                        <p className="text-xs text-[#7f1d1d]/50 mt-0.5">
                                            {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                                        </p>
                                        {item.note && (
                                            <p className="text-[10px] text-primary italic mt-1 bg-red-50/50 px-2 py-0.5 rounded inline-block">
                                                Ghi chú: {item.note}
                                            </p>
                                        )}
                                    </div>
                                    <p className="font-black text-sm text-primary flex-shrink-0">
                                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t-2 border-dashed border-red-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-[#450A0A]/70 uppercase tracking-wider">Tổng thanh toán:</span>
                            <span className="text-2xl font-black text-primary">
                                {reorderTotal.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    {/* Payment Selector */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-black text-[#7f1d1d]/40 uppercase tracking-widest pl-1">Chọn hình thức thanh toán</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Transfer')}
                                className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all bg-white cursor-pointer ${
                                    paymentMethod === 'Transfer'
                                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                        : 'border-red-100 hover:border-red-200'
                                }`}
                            >
                                <QrCode className={`size-6 ${paymentMethod === 'Transfer' ? 'text-primary' : 'text-[#7f1d1d]/40'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                    paymentMethod === 'Transfer' ? 'text-primary' : 'text-[#7f1d1d]/60'
                                }`}>
                                    Chuyển khoản
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Cash')}
                                className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all bg-white cursor-pointer ${
                                    paymentMethod === 'Cash'
                                        ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                        : 'border-red-100 hover:border-red-200'
                                }`}
                            >
                                <Receipt className={`size-6 ${paymentMethod === 'Cash' ? 'text-primary' : 'text-[#7f1d1d]/40'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                    paymentMethod === 'Cash' ? 'text-primary' : 'text-[#7f1d1d]/60'
                                }`}>
                                    Tiền mặt
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="space-y-3 pt-6">
                    <button
                        onClick={handlePaymentConfirm}
                        disabled={placeOrderMutation.isPending || isSyncing || !paymentMethod}
                        className="w-full py-4 rounded-2xl bg-[#DC2626] text-white font-black text-sm hover:bg-[#B91C1C] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-red-200"
                    >
                        {placeOrderMutation.isPending || isSyncing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang tạo đơn...
                            </>
                        ) : (
                            <>Xác nhận đặt món</>
                        )}
                    </button>
                    <button
                        onClick={handleSkip}
                        className="w-full py-2.5 rounded-2xl text-[#7f1d1d]/50 text-sm font-medium hover:text-[#450A0A] transition-colors cursor-pointer text-center"
                    >
                        Bỏ qua, tự chọn món mới
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'payment_qr' && paymentOrderId) {
        // Compute VietQR notes
        const tableName = table?.name || 'Mang ve';
        const itemsSummary = reorderItems.map(i => `${i.quantity}${i.name}`).join(' ');
        const fullNote = `SEVQR ${paymentOrderId} ${tableName} ${itemsSummary}`.substring(0, 140);
        const shortId = paymentOrderId.split('-')[0].toUpperCase();
        const tinyNote = `SEVQR${shortId}`;

        const vietQrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.ACC}&bank=${SEPAY_CONFIG.BANK}&amount=${reorderTotal}&des=${encodeURIComponent(fullNote)}`;

        // Deep links for mobile bank app
        const preferredBankId = typeof window !== 'undefined' ? localStorage.getItem('preferred_bank_id') || 'icb' : 'icb';
        const preferredBankName = typeof window !== 'undefined' ? localStorage.getItem('preferred_bank_name') || 'VietinBank' : 'VietinBank';
        const schemeFn = BANK_SCHEMES[preferredBankId];
        const appSchemeUrl = schemeFn
            ? schemeFn(SEPAY_CONFIG.ACC, reorderTotal, tinyNote)
            : `vietqr://a=${SEPAY_CONFIG.BIN}&ac=${SEPAY_CONFIG.ACC}&am=${reorderTotal}&tn=${tinyNote}`;

        const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

        return (
            <div className="min-h-screen w-full bg-[#FDF8F3] px-6 py-10 flex flex-col items-center justify-between font-main text-center">
                <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-[#450A0A] uppercase tracking-wider">Thanh toán đơn hàng</h1>
                        <p className="text-xs text-[#7f1d1d]/50 mt-1">Đơn đặt lại của bạn đã được khởi tạo</p>
                    </div>

                    {/* Total Box */}
                    <div className="bg-primary/10 p-5 rounded-3xl mb-6 w-full max-w-xs">
                        <p className="text-xs font-bold text-neutral-600 mb-1">Tổng số tiền</p>
                        <p className="text-3xl font-black text-primary">
                            {reorderTotal.toLocaleString('vi-VN')}đ
                        </p>
                    </div>

                    {/* VietQR Card */}
                    <div className="p-6 bg-white border-2 border-red-100 rounded-3xl shadow-sm mb-6 flex flex-col items-center justify-center w-full max-w-xs">
                        <Image
                            src={vietQrUrl}
                            alt="VietQR Code"
                            width={220}
                            height={220}
                            className="object-cover rounded-xl"
                            unoptimized
                        />

                        {isMobile && (
                            <a
                                href={appSchemeUrl}
                                onClick={() => {
                                    setTimeout(() => {
                                        if (document.hasFocus()) {
                                            toast.info('Nếu App không tự mở, hãy quét mã QR phía trên nhé!', { duration: 5000 });
                                        }
                                    }, 1500);
                                }}
                                className="flex items-center justify-center gap-2 w-full mt-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md active:scale-95 text-sm"
                            >
                                <Smartphone className="w-4 h-4" />
                                Mở App {preferredBankName}
                            </a>
                        )}

                        {!isMobile && (
                            <p className="text-[10px] text-[#7f1d1d]/40 italic mt-3">
                                Dùng App ngân hàng để quét mã QR phía trên
                            </p>
                        )}
                    </div>

                    {/* Waiting Loader */}
                    <div className="flex items-center gap-2.5 text-sm font-bold text-[#7f1d1d]/60 animate-pulse bg-white px-5 py-3 rounded-full border border-red-100 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Đang chờ thanh toán tự động...
                    </div>
                </div>

                {/* Return Option */}
                <div className="w-full max-w-xs pt-6">
                    <button
                        onClick={() => {
                            clearCart();
                            extendSession();
                            router.push('/history');
                        }}
                        className="w-full py-3 rounded-2xl bg-white border border-red-200 text-[#7f1d1d]/75 font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        Xem trạng thái đơn tại trang Lịch sử
                    </button>
                </div>
            </div>
        );
    }

    // Redirect fallback view
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-neutral-500">Đang chuẩn bị menu...</p>
        </div>
    );
}
