'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { usePlaceOrderMutation, useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
    ShoppingBag, ArrowRight, Loader2, X, Trash2, MessageSquare,
    Plus, QrCode, Receipt, ChevronLeft, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';

type PaymentMethod = 'Cash' | 'Transfer' | null;
type Step = 'cart' | 'payment-qr';

const POPULAR_BANKS = [
    { id: 'icb', name: 'VietinBank' },
    { id: 'vcb', name: 'Vietcombank' },
    { id: 'mbbank', name: 'MB Bank' },
    { id: 'tcb', name: 'Techcombank' },
    { id: 'acb', name: 'ACB' },
    { id: 'vpbank', name: 'VPBank' }
];

const SEPAY_CONFIG = {
    BANK: 'VietinBank',
    BIN: '970415',
    APP_ID: 'icb',
    ACC: '104876858916'
};

export function OrderBar() {
    const {
        cart, getCartTotal, getCartCount,
        updateQuantity, removeFromCart,
        session, table,
        paymentSuccessOrderId, setPaymentSuccess, clearCart
    } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();

    const [note, setNote] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [step, setStep] = useState<Step>('cart');
    const [preferredBank, setPreferredBank] = useState<{ id: string, name: string } | null>(null);

    // Detect mobile for Deep Links
    useEffect(() => {
        const check = () => setIsMobile(
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth < 1024
        );
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Load preferred bank from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_bank');
            if (saved) {
                try { setPreferredBank(JSON.parse(saved)); } catch (e) { console.error(e); }
            }
        }
    }, []);

    const saveBankPreference = (id: string, name: string) => {
        const bank = { id, name };
        setPreferredBank(bank);
        localStorage.setItem('preferred_bank', JSON.stringify(bank));
        toast.success(`Đã ghi nhớ ${name} cho lần sau!`);
    };

    const total = getCartTotal();
    const count = getCartCount();

    // Listen for SignalR payment success
    useEffect(() => {
        if (paymentOrderId && paymentSuccessOrderId) {
            const isMatch = paymentOrderId.toLowerCase() === paymentSuccessOrderId.toLowerCase();
            if (isMatch) {
                toast.success('🎉 Thanh toán thành công! Nhà bếp đang chuẩn bị món.');
                clearCart();
                Promise.resolve().then(() => {
                    setPaymentSuccess(null);
                    setPaymentOrderId(null);
                    setStep('cart');
                    setIsSheetOpen(false);
                });
            }
        }
    }, [paymentSuccessOrderId, paymentOrderId, setPaymentSuccess, clearCart]);

    const resetState = () => {
        setPaymentMethod(null);
        setPaymentOrderId(null);
        setStep('cart');
        setNote('');
    };

    const handleSheetChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) resetState();
    };

    const handlePlaceOrder = async () => {
        if (!paymentMethod) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            return;
        }

        try {
            // 1. Sync cart to backend
            const cartItems = cart.map(item => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity
            }));
            await syncCart(cartItems);

            // 2. Place order
            const result = await placeOrderMutation.mutateAsync({ note });
            console.log('[DEBUG] Order created result:', JSON.stringify(result));

            // Try all possible capitalizations for ID
            const finalOrderId = result?.id || result?.Id || result?.ID || (typeof result === 'string' ? result : null);
            console.log('[DEBUG] Final Order ID extracted:', finalOrderId, 'Type:', typeof finalOrderId);

            if (!finalOrderId) {
                console.error('[CRITICAL] Order ID is missing. Full result:', result);
                toast.error('Lỗi hệ thống: Không nhận được mã đơn hàng từ server.');
                return;
            }

            if (paymentMethod === 'Transfer') {
                // 3a. Init payment record
                try {
                    await axiosInstance.post('/api/payments', { orderId: finalOrderId, amount: total });
                } catch (err) {
                    console.error('Failed to create payment record:', err);
                }
                // Switch to QR view
                setPaymentOrderId(finalOrderId);
                setStep('payment-qr');
            } else {
                // 3b. Cash: close and clear
                toast.success('Đơn hàng đã ghi nhận! Vui lòng thanh toán tại quầy.');
                clearCart();
                setIsSheetOpen(false);
                resetState();
            }
        } catch {
            // Error handled by mutation
        }
    };

    // QR generation
    const buildQrData = () => {
        if (!paymentOrderId) {
            console.warn('[DEBUG] buildQrData: paymentOrderId is EMPTY');
            return null;
        }

        try {
            const itemsSummary = cart.map(i => `${i.quantity}${i.name}`).join(' ');
            const tableName = table?.name || 'Mang ve';
            const content = `SEVQR ${paymentOrderId} ${tableName} ${itemsSummary}`.substring(0, 140);
            const encoded = encodeURIComponent(content);
            const qrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.ACC}&bank=${SEPAY_CONFIG.BANK}&amount=${total}&des=${encoded}`;

            console.log('[DEBUG] QR Code Context:', {
                orderId: paymentOrderId,
                table: tableName,
                total: total,
                summary: itemsSummary
            });
            console.log('[DEBUG] Final QR URL:', qrUrl);

            const activeAppId = preferredBank?.id || SEPAY_CONFIG.APP_ID;
            const activeBankName = preferredBank?.name || SEPAY_CONFIG.BANK;

            return {
                imgUrl: `https://img.vietqr.io/image/${SEPAY_CONFIG.BIN}-${SEPAY_CONFIG.ACC}-compact2.jpg?amount=${total}&addInfo=${encoded}&accountName=${encodeURIComponent("NGO QUANG HUY")}`,
                payUrl: `https://vietqr.co/${SEPAY_CONFIG.BIN}/${SEPAY_CONFIG.ACC}/${total}/${encoded}?accountName=${encodeURIComponent("NGO QUANG HUY")}`,
                directAppUrl: `https://dl.vietqr.io/pay?app=${activeAppId}&ba=${SEPAY_CONFIG.ACC}&am=${total}&tn=${encoded}`,
                activeBankName
            };
        } catch (err) {
            console.error('[CRITICAL] Failed to build QR data:', err);
            return null;
        }
    };



    if (count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe">
            {/* Safe area gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            <Sheet open={isSheetOpen} onOpenChange={handleSheetChange}>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="mb-4"
                >
                    <SheetTrigger
                        render={
                            <button className="relative w-full flex items-center justify-between bg-neutral-900 text-white rounded-2xl shadow-2xl shadow-black/40 px-4 py-3.5 active:scale-[0.98] transition-transform" />
                        }
                    >
                        {/* Left: Bag + count */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="bg-primary p-2.5 rounded-xl">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center shadow">
                                    {count}
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none">Giỏ hàng</p>
                                <p className="text-base font-black leading-tight">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                </p>
                            </div>
                        </div>

                        {/* Right: CTA */}
                        <div className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 font-black text-sm">
                            XEM ĐƠN <ArrowRight className="w-4 h-4" />
                        </div>
                    </SheetTrigger>
                </motion.div>

                <SheetContent
                    side="bottom"
                    className="h-[88vh] rounded-t-[32px] px-0 pb-0 border-none shadow-2xl flex flex-col bg-white overflow-hidden"
                >
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 bg-neutral-200 rounded-full" />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'cart' ? (
                            <motion.div
                                key="cart"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col flex-1 overflow-hidden"
                            >
                                <SheetHeader className="px-6 pb-3 flex-shrink-0">
                                    <SheetTitle className="text-2xl font-black text-neutral-900">
                                        Xác nhận đơn hàng
                                    </SheetTitle>
                                    {table && (
                                        <p className="text-sm font-bold text-primary">
                                            {table.name} · {table.tableCode}
                                        </p>
                                    )}
                                </SheetHeader>

                                {/* Scrollable cart items */}
                                <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-4">
                                    {cart.map((item) => (
                                        <div key={item.foodId} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-neutral-800 text-sm truncate">{item.name}</h4>
                                                <p className="text-xs font-bold text-primary">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center bg-white rounded-full px-1 py-0.5 shadow-sm border border-neutral-100 gap-1">
                                                <button
                                                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-red-500 transition-colors"
                                                    onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-6 text-center font-black text-sm text-neutral-800">{item.quantity}</span>
                                                <button
                                                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-primary transition-colors"
                                                    onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.foodId)}
                                                className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Note input */}
                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <MessageSquare className="w-3 h-3" /> Ghi chú cho bếp
                                        </label>
                                        <Input
                                            placeholder="Ví dụ: Không cay, thêm hành..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="h-11 rounded-xl bg-neutral-50 border-neutral-200 focus-visible:ring-primary/30 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Footer: fixed at bottom */}
                                <div className="flex-shrink-0 px-6 pt-4 pb-8 border-t border-neutral-100 bg-white">
                                    {/* Total */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Tổng thanh toán</span>
                                        <span className="text-2xl font-black text-neutral-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                        </span>
                                    </div>

                                    {/* Payment method selection */}
                                    {!session ? (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-sm border border-red-100 mb-4">
                                            Vui lòng quét mã QR tại bàn để đặt món!
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                                                Phương thức thanh toán
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('Transfer')}
                                                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${paymentMethod === 'Transfer'
                                                        ? 'border-primary bg-primary/8 shadow-md scale-[1.02]'
                                                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                                                        }`}
                                                >
                                                    <QrCode className={`size-5 ${paymentMethod === 'Transfer' ? 'text-primary' : 'text-neutral-400'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'Transfer' ? 'text-primary' : 'text-neutral-500'}`}>
                                                        Chuyển khoản
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('Cash')}
                                                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${paymentMethod === 'Cash'
                                                        ? 'border-primary bg-primary/8 shadow-md scale-[1.02]'
                                                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                                                        }`}
                                                >
                                                    <Receipt className={`size-5 ${paymentMethod === 'Cash' ? 'text-primary' : 'text-neutral-400'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'Cash' ? 'text-primary' : 'text-neutral-500'}`}>
                                                        Tiền mặt
                                                    </span>
                                                </button>
                                            </div>

                                            <Button
                                                onClick={handlePlaceOrder}
                                                disabled={isSyncing || placeOrderMutation.isPending || !paymentMethod}
                                                className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-primary/25 gap-2 disabled:opacity-40"
                                            >
                                                {isSyncing || placeOrderMutation.isPending ? (
                                                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                                                ) : (
                                                    <>XÁC NHẬN ĐẶT MÓN <ArrowRight className="w-5 h-5" /></>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            /* ── PAYMENT QR VIEW ── */
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col items-center flex-1 overflow-y-auto no-scrollbar px-6 pb-8"
                            >
                                {/* Back button */}
                                <button
                                    onClick={() => { setStep('cart'); setPaymentOrderId(null); }}
                                    className="self-start flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-neutral-800 transition-colors mb-4"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Quay lại
                                </button>

                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-black text-neutral-900 mb-1">Thanh toán đơn hàng</h2>
                                    <p className="text-sm text-neutral-500">Quét mã QR để thanh toán</p>
                                </div>

                                {/* Amount badge */}
                                <div className="bg-primary/10 rounded-2xl px-8 py-3 mb-6 text-center">
                                    <p className="text-xs font-bold text-neutral-500 mb-0.5">Tổng số tiền</p>
                                    <p className="text-3xl font-black text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                    </p>
                                </div>

                                {/* QR code */}
                                {(() => {
                                    const qr = buildQrData();
                                    if (!qr) return null;
                                    return (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div className="p-3 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm">
                                                <img
                                                    src={qr.imgUrl}
                                                    alt="VietQR Thanh toán"
                                                    className="w-52 h-52 object-cover"
                                                />
                                            </div>

                                            {isMobile ? (
                                                <div className="w-full flex flex-col gap-3">
                                                    <a
                                                        href={qr.directAppUrl}
                                                        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform text-sm"
                                                    >
                                                        <QrCode className="w-4 h-4" />
                                                        Mở App {qr.activeBankName}
                                                    </a>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        {POPULAR_BANKS.filter(b => b.name !== qr.activeBankName).slice(0, 3).map(bank => (
                                                            <button
                                                                key={bank.id}
                                                                onClick={() => saveBankPreference(bank.id, bank.name)}
                                                                className="py-2 px-1 text-[10px] font-bold bg-neutral-50 border border-neutral-100 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors"
                                                            >
                                                                Dùng {bank.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <a
                                                        href={qr.payUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full flex items-center justify-center gap-2 bg-white text-neutral-400 font-medium py-2 px-6 rounded-2xl active:scale-95 transition-transform text-[10px] border border-dashed border-neutral-200"
                                                    >
                                                        Ngân hàng khác...
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-neutral-400 italic text-center">
                                                    Dùng App ngân hàng để quét mã QR phía trên
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Waiting indicator */}
                                <div className="flex items-center gap-2 mt-6 text-sm font-bold text-neutral-400 animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang chờ xác nhận thanh toán...
                                </div>

                                <div className="flex items-center gap-2 mt-3 text-xs text-neutral-400 bg-neutral-50 rounded-xl px-4 py-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>Tự động xác nhận khi SePay ghi nhận giao dịch</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SheetContent>
            </Sheet>
        </div>
    );
}
