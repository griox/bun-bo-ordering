'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useOrderStore, CartItem } from '@/store/useOrderStore';
import { usePlaceOrderMutation, useCart } from '@/hooks/useCart';
import { usePromotions } from '@/hooks/usePromotions';
import { Button } from '@/components/ui/button';
import {
    ShoppingBag, ArrowRight, Loader2, Trash2, MessageSquare,
    Plus, QrCode, Receipt, ChevronLeft, CheckCircle2, Ticket,
    Minus
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
import { SePayCheckout } from '@/components/payment/SePayCheckout';
import { ScannerModal } from '@/components/landing/ScannerModal';

type PaymentMethod = 'Cash' | 'Transfer' | null;
type Step = 'cart' | 'payment-qr';

export function OrderBar() {
    const {
        cart, getCartTotal, getCartCount,
        updateQuantity, updateNote, removeFromCart,
        session, table,
        paymentSuccessOrderId, setPaymentSuccess, clearCart,
        extendSession,
        _hasHydrated,
    } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [step, setStep] = useState<Step>('cart');
    const [checkoutData, setCheckoutData] = useState<{ checkoutUrl: string, qrCode: string } | null>(null);

    const { validateVoucherMutation, useActiveVouchers } = usePromotions();
    const { data: availableVouchers } = useActiveVouchers();
    const [voucherCode, setVoucherCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
    const [isVoucherListOpen, setIsVoucherListOpen] = useState(false);
    const isClient = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );

    const { useMyVouchers } = usePromotions();
    const { data: myVouchers } = useMyVouchers();

    const displayVouchers = React.useMemo(() => {
        const list: any[] = [];
        
        if (availableVouchers) {
            // Add active Standard vouchers (Handle both string and integer enum serialization)
            list.push(...availableVouchers.filter(v => v.isActive && (v.type === 'Standard' || String(v.type) === '0')));
        }

        if (myVouchers) {
            const unusedVouchers = myVouchers.filter(v => v.status === 'Unused');
            for (const myV of unusedVouchers) {
                if (!list.find(v => v.code === myV.code)) {
                    const fullDetails = availableVouchers?.find(v => v.code === myV.code);
                    if (fullDetails) {
                        list.push(fullDetails);
                    } else {
                        list.push({
                            id: myV.voucherId,
                            code: myV.code,
                            description: myV.description,
                            minOrderValue: 0,
                            isActive: true,
                        });
                    }
                }
            }
        }
        return list;
    }, [availableVouchers, myVouchers]);


    const subtotal = getCartTotal();
    const total = Math.max(0, subtotal - discountAmount);
    const count = getCartCount();

    // Listen for SignalR payment success
    useEffect(() => {
        if (paymentOrderId && paymentSuccessOrderId) {
            const isMatch = paymentOrderId.toLowerCase() === paymentSuccessOrderId.toLowerCase();
            if (isMatch) {
                toast.success('🎉 Thanh toán thành công! Nhà bếp đang chuẩn bị món.');
                clearCart();
                extendSession();
                Promise.resolve().then(() => {
                    setPaymentSuccess(null);
                    setPaymentOrderId(null);
                    setCheckoutData(null);
                    setStep('cart');
                    setIsSheetOpen(false);
                });
            }
        }
    }, [paymentSuccessOrderId, paymentOrderId, setPaymentSuccess, clearCart, extendSession]);

    const resetState = () => {
        setPaymentMethod(null);
        setPaymentOrderId(null);
        setCheckoutData(null);
        setStep('cart');
    };

    const handleSheetChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) resetState();
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;

        try {
            const result = await validateVoucherMutation.mutateAsync({
                code: voucherCode,
                orderValue: subtotal
            });

            if (result.isValid) {
                setDiscountAmount(result.discountAmount);
                setAppliedVoucher(voucherCode);
                toast.success('Áp dụng mã giảm giá thành công!');
            } else {
                toast.error(result.message || 'Mã giảm giá không hợp lệ');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi áp dụng mã giảm giá');
        }
    };

    const handlePlaceOrder = async () => {
        if (!paymentMethod && total > 0) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            return;
        }

        const finalPaymentMethod = total === 0 ? 'Cash' : (paymentMethod || 'Cash');

        try {
            // 1. Sync cart to backend
            const cartItems = cart.map((item: CartItem) => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity,
                note: item.note
            }));
            await syncCart(cartItems);

            // 2. Place order
            const result = await placeOrderMutation.mutateAsync({
                paymentMethod: finalPaymentMethod === 'Transfer' ? 'Transfer' : 'Cash',
                voucherCode: appliedVoucher || undefined,
                discountAmount: discountAmount > 0 ? discountAmount : undefined
            });

            const finalOrderId = result?.id || result?.Id || result?.ID || (typeof result === 'string' ? result : null);

            if (!finalOrderId) {
                toast.error('Lỗi hệ thống: Không nhận được mã đơn hàng từ server.');
                return;
            }

            if (finalPaymentMethod === 'Transfer') {
                setPaymentOrderId(finalOrderId);
                setStep('payment-qr');

                // 3a. Init payment record and get checkout URL
                try {
                    const payResult = await axiosInstance.post('/api/payments', { 
                        orderId: finalOrderId, 
                        amount: total,
                        tableSessionId: session?.id,
                        tableNumber: table?.name
                    });
                    setCheckoutData({
                        checkoutUrl: payResult.data.checkoutUrl,
                        qrCode: payResult.data.qrCode
                    });
                } catch (err) {
                    console.error('Failed to create payment record:', err);
                    toast.error('Không thể khởi tạo cổng thanh toán SePay.');
                }
            } else {
                // 3b. Cash or 0 VND: close and clear
                if (total === 0) {
                    toast.success("Đặt món thành công! Nhà bếp đang chuẩn bị món ăn.");
                } else {
                    toast.success('Đơn hàng đã ghi nhận! Vui lòng thanh toán tại quầy.');
                }
                clearCart();
                extendSession();
                setIsSheetOpen(false);
                resetState();
            }
        } catch {
            // Error handled by mutation
        }
    };

    if (!isClient || count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            <Sheet open={isSheetOpen} onOpenChange={handleSheetChange}>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="mb-4"
                >
                    <SheetTrigger asChild>
                        <button className="relative w-full flex items-center justify-between bg-neutral-900 text-white rounded-2xl shadow-2xl shadow-black/40 px-4 py-3.5 active:scale-[0.98] transition-transform">
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

                            <div className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 font-black text-sm">
                                XEM ĐƠN <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>
                    </SheetTrigger>
                </motion.div>

                <SheetContent
                    side="bottom"
                    className="h-[88vh] rounded-t-[32px] px-0 pb-0 border-none shadow-2xl flex flex-col bg-white overflow-hidden"
                >
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

                                <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-4">
                                    {cart.map((item) => (
                                        <div key={item.foodId} className="flex flex-col gap-2 bg-neutral-50 p-3 rounded-2xl">
                                            <div className="flex items-center gap-3">
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
                                                        <Minus className="w-3.5 h-3.5" />
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
                                            <div className="flex items-center gap-2 group/note bg-white/50 hover:bg-white p-2 rounded-xl border border-neutral-200/50 transition-all">
                                                <MessageSquare className="w-3 h-3 text-neutral-400 group-focus-within/note:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Ghi chú món ăn... (vd: không hành)"
                                                    value={item.note || ''}
                                                    onChange={(e) => updateNote(item.foodId, e.target.value)}
                                                    className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-bold text-neutral-700 placeholder:text-neutral-400 p-0 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}


                                    {/* Voucher Section */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setIsVoucherListOpen(!isVoucherListOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200/50 rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform">
                                                    <Ticket className="size-5 text-amber-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-amber-600 uppercase tracking-wider">Áp dụng mã giảm giá</p>
                                                    <p className="text-[11px] text-amber-700/70 font-medium italic">
                                                        {appliedVoucher ? `Đã chọn: ${appliedVoucher}` : 'Chọn hoặc nhập mã khuyến mãi'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Plus className={`size-4 text-amber-600 transition-transform ${isVoucherListOpen ? 'rotate-45' : ''}`} />
                                        </button>

                                        {isVoucherListOpen && (
                                            <div className="mt-3 p-3 bg-white border-2 border-neutral-100 rounded-2xl shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="NHẬP MÃ..."
                                                        value={voucherCode}
                                                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                        disabled={!!appliedVoucher}
                                                        className="flex-1 h-10 bg-neutral-50 border-neutral-200 rounded-xl focus-visible:ring-primary/30 text-xs font-bold uppercase disabled:opacity-50"
                                                    />
                                                    {appliedVoucher ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setAppliedVoucher(null);
                                                                setVoucherCode('');
                                                                setDiscountAmount(0);
                                                            }}
                                                            className="h-10 px-4 border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold text-[10px] uppercase"
                                                        >
                                                            Hủy
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={handleApplyVoucher}
                                                            disabled={validateVoucherMutation.isPending || !voucherCode.trim()}
                                                            className="h-10 px-4 bg-primary text-white rounded-xl font-bold text-[10px] uppercase"
                                                        >
                                                            {validateVoucherMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Áp dụng'}
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pt-2">
                                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mã có sẵn</p>
                                                    {displayVouchers.map(voucher => {
                                                        const isSelected = appliedVoucher === voucher.code;
                                                        const isEligible = subtotal >= voucher.minOrderValue;

                                                        return (
                                                            <button
                                                                key={voucher.id}
                                                                disabled={!isEligible}
                                                                onClick={async () => {
                                                                    if (isSelected) return;
                                                                    setVoucherCode(voucher.code);
                                                                    const result = await validateVoucherMutation.mutateAsync({
                                                                        code: voucher.code,
                                                                        orderValue: subtotal
                                                                    });
                                                                    if (result.isValid) {
                                                                        setDiscountAmount(result.discountAmount);
                                                                        setAppliedVoucher(voucher.code);
                                                                        toast.success(`Đã chọn ${voucher.code}`);
                                                                        setIsVoucherListOpen(false);
                                                                    } else {
                                                                        toast.error(result.message);
                                                                    }
                                                                }}
                                                                className={`w-full text-left p-3 rounded-xl border-2 transition-all flex justify-between items-center ${isSelected
                                                                    ? 'border-primary bg-primary/5'
                                                                    : isEligible
                                                                        ? 'border-neutral-100 hover:border-primary/30 bg-neutral-50'
                                                                        : 'border-neutral-50 bg-neutral-50 opacity-50 grayscale cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-black text-neutral-800">{voucher.code}</p>
                                                                    <p className="text-[10px] text-neutral-500 line-clamp-1">{voucher.description}</p>
                                                                </div>
                                                                {isSelected && <div className="size-2 bg-primary rounded-full animate-pulse" />}
                                                                {!isEligible && (
                                                                    <p className="text-[9px] font-bold text-red-500 italic">
                                                                        Thêm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.minOrderValue - subtotal)}
                                                                    </p>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                    {displayVouchers.length === 0 && (
                                                        <p className="text-[10px] text-neutral-400 italic text-center py-2">Không có mã giảm giá nào khác</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="flex-shrink-0 px-6 pt-4 pb-8 border-t border-neutral-100 bg-white">
                                    <div className="flex flex-col gap-1.5 mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tạm tính</span>
                                            <span className="text-sm font-bold text-neutral-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                                            </span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Giảm giá ({appliedVoucher})</span>
                                                <span className="text-sm font-bold text-emerald-600">
                                                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Tổng thanh toán</span>
                                            <span className="text-2xl font-black text-neutral-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                            </span>
                                        </div>
                                    </div>

                                    {!session ? (
                                        _hasHydrated && cart.length > 0 ? (
                                            // Recovery mode: cart loaded from localStorage but no session
                                            <div className="mb-4 space-y-3">
                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                                    <p className="text-amber-700 font-black text-xs uppercase tracking-wider">Phiên bàn đã hết</p>
                                                    <p className="text-amber-600 text-xs font-bold mt-0.5">Bạn còn ngồi tại bàn cũ không?</p>
                                                </div>
                                                <ScannerModal>
                                                    <button className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow shadow-primary/20 active:scale-[0.98] transition-transform">
                                                        Còn ngồi — Quét lại mã bàn
                                                    </button>
                                                </ScannerModal>
                                                <button
                                                    onClick={() => clearCart()}
                                                    className="w-full flex items-center justify-center gap-2 bg-neutral-100 text-neutral-600 font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all"
                                                >
                                                    Không còn — Xóa giỏ hàng
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-sm border border-red-100 mb-4">
                                                Vui lòng quét mã QR tại bàn để đặt món!
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            {total > 0 && (
                                                <>
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                                                        Phương thức thanh toán
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentMethod('Transfer')}
                                                            className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${paymentMethod === 'Transfer'
                                                                ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                                                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                                                                }`}
                                                        >
                                                            <QrCode className={`size-5 ${paymentMethod === 'Transfer' ? 'text-blue-600' : 'text-neutral-400'}`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'Transfer' ? 'text-blue-600' : 'text-neutral-500'}`}>
                                                                Chuyển khoản
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentMethod('Cash')}
                                                            className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all ${paymentMethod === 'Cash'
                                                                ? 'border-red-500 bg-red-50 shadow-md scale-[1.02]'
                                                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                                                                }`}
                                                        >
                                                            <Receipt className={`size-5 ${paymentMethod === 'Cash' ? 'text-red-600' : 'text-neutral-400'}`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'Cash' ? 'text-red-600' : 'text-neutral-500'}`}>
                                                                Tiền mặt
                                                            </span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            <Button
                                                onClick={handlePlaceOrder}
                                                disabled={isSyncing || placeOrderMutation.isPending || (total > 0 && !paymentMethod)}
                                                className="w-full h-14 rounded-2xl text-base font-black bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-lg shadow-neutral-900/25 gap-2 disabled:opacity-40"
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
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col items-center flex-1 overflow-y-auto no-scrollbar px-6 pb-8"
                            >
                                <button
                                    onClick={() => { setStep('cart'); setPaymentOrderId(null); setCheckoutData(null); }}
                                    className="self-start flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-neutral-800 transition-colors mb-4"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Quay lại giỏ hàng
                                </button>

                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-black text-neutral-900 mb-1">Thanh toán </h2>
                                    <p className="text-sm text-neutral-500">Hoàn tất thanh toán để bếp nhận đơn</p>
                                </div>

                                <div className="w-full">
                                    {checkoutData ? (
                                        <SePayCheckout
                                            qrCode={checkoutData.qrCode}
                                            amount={total}
                                        />
                                    ) : (
                                        <div className="py-12 flex flex-col items-center gap-4 text-neutral-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-sm">Đang khởi tạo thanh toán...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-6 text-sm font-bold text-neutral-400 animate-pulse">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang chờ xác nhận giao dịch...
                                </div>

                                <div className="flex items-center gap-2 mt-3 text-xs text-neutral-400 bg-neutral-50 rounded-xl px-4 py-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span>Tự động xác nhận sau khi bạn chuyển khoản thành công</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SheetContent>
            </Sheet>
        </div>
    );
}
