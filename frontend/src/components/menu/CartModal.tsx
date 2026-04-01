/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2, Minus, Plus, X, QrCode, Receipt, Smartphone } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useCart, usePlaceOrderMutation } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function CartModal() {
    const { cart, getCartTotal, updateQuantity, removeFromCart, session, table, paymentSuccessOrderId, setPaymentSuccess, clearCart } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | null>(null);

    const total = getCartTotal();
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

    useEffect(() => {
        if (paymentOrderId && paymentSuccessOrderId) {
            const isMatch = paymentOrderId.toLowerCase() === paymentSuccessOrderId.toLowerCase();
            console.log("CartModal: Payment check", { paymentOrderId, paymentSuccessOrderId, isMatch });

            if (isMatch) {
                toast.success("Thanh toán thành công! Nhà bếp đang chuẩn bị món ăn.");

                // Clear the cart on payment success
                clearCart();

                // Defer these to next tick to avoid "cascading render" lint warning
                Promise.resolve().then(() => {
                    setPaymentSuccess(null);
                    setPaymentOrderId(null);
                    setIsOpen(false);
                });
            }
        }
    }, [paymentSuccessOrderId, paymentOrderId, setPaymentSuccess, setIsOpen, clearCart]);

    const handleConfirm = async () => {
        if (!paymentMethod) {
            toast.error("Vui lòng chọn phương thức thanh toán");
            return;
        }

        try {
            // Sync the local cart state to the backend Redis session first
            const cartPayload = cart.map(item => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity
            }));

            await syncCart(cartPayload);

            // Place the order
            const orderIdResult = await placeOrderMutation.mutateAsync({
                note,
                paymentMethod: paymentMethod
            });
            const finalOrderId = orderIdResult.id || orderIdResult.Id;

            if (!finalOrderId) {
                console.error("Critical: Order ID missing in response", orderIdResult);
                toast.error("Lỗi hệ thống: Không xác định được mã đơn hàng.");
                return;
            }

            if (paymentMethod === 'Transfer') {
                try {
                    console.log("Creating pending payment for order:", finalOrderId);
                    await axiosInstance.post('/api/payments', { orderId: finalOrderId, amount: total });
                } catch (err) {
                    console.error('Failed to initialize payment transaction', err);
                }
                // Switch to Payment QR View
                setPaymentOrderId(finalOrderId);
            } else {
                // CASH FLOW: Just clear cart and close
                toast.success("Đơn hàng đã được ghi nhận. Vui lòng thanh toán tại quầy!");
                clearCart();
                setIsOpen(false);
            }
        } catch (error) {
            console.error("Order failed:", error);
        }
    };

    const SEPAY_CONFIG = {
        BANK: 'ICB',
        BIN: '970415',
        ACC: '104876858916'
    };

    // URI schemes for each bank app - triggers the transfer screen directly
    const BANK_SCHEMES: Record<string, (acc: string, amount: number, note: string) => string> = {
        icb: (acc, am, tn) => `icbapp://transfer?ben_account=${acc}&amount=${am}&content=${encodeURIComponent(tn)}`,
        vcb: (acc, am, tn) => `vcbdirect://qrpay?account=${acc}&amount=${am}&remark=${encodeURIComponent(tn)}`,
        mbbank: (acc, am, tn) => `mbmobile://transfer?toAccNo=${acc}&amount=${am}&memo=${encodeURIComponent(tn)}`,
        tcb: (acc, am, tn) => `techcombank://payment?beneficiaryAccount=${acc}&amount=${am}&description=${encodeURIComponent(tn)}`,
        acb: (acc, am, tn) => `acbmobile://transfer?toAccount=${acc}&amount=${am}&note=${encodeURIComponent(tn)}`,
        vpbank: (acc, am, tn) => `vpbanknexgen://transfer?toAcc=${acc}&amount=${am}&note=${encodeURIComponent(tn)}`,
    };

    // Reset state when modal is fully closed manually
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setPaymentOrderId(null);
            setPaymentSuccess(null);
            setPaymentMethod(null);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger nativeButton={false} render={
                <div className="relative group cursor-pointer mr-2 md:mr-4 bg-transparent border-none p-0 focus:outline-none inline-block">
                    <div className="flex items-center justify-center bg-primary text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all">
                        <ShoppingCart size={18} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-text shadow-sm">
                                {itemCount}
                            </span>
                        )}
                    </div>
                </div>
            } />
            <DialogContent className="w-[92vw] max-w-lg bg-background border-4 border-text p-6 shadow-[10px_10px_0px_rgba(0,0,0,0.15)] rounded-[2rem]">

                {paymentOrderId ? (
                    // PAYMENT QR VIEW
                    <div className="flex flex-col items-center py-4 text-center">
                        <DialogHeader className="mb-2">
                            <DialogTitle className="font-display text-2xl uppercase tracking-wider text-text">Thanh toán đơn hàng</DialogTitle>
                        </DialogHeader>

                        <div className="bg-primary/10 p-4 rounded-xl mb-4 w-full">
                            <p className="text-sm font-bold text-neutral-600 mb-1">Tổng số tiền</p>
                            <p className="text-3xl font-black text-primary">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                            </p>
                        </div>

                        <div className="p-4 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm mb-6 flex flex-col items-center justify-center relative min-h-[250px] w-[250px]">
                            {/* VietQR Implementation with SEVQR prefix for VietinBank/SePay */}
                            {(() => {
                                // Mandatory SEVQR prefix for VietinBank/SePay auto-recognition
                                // Put paymentOrderId FIRST to avoid bank truncation of long strings!
                                const itemsSummary = cart.map(i => `${i.quantity}${i.name}`).join(' ');
                                const tableName = table?.name || 'Mang ve';

                                // Full note for visual QR
                                const fullNote = `SEVQR ${paymentOrderId} ${tableName} ${itemsSummary}`.substring(0, 140);

                                // Tiny note for Deep Link (NO SPACES & SHORT for pre-filling!)
                                const shortId = paymentOrderId.split('-')[0].toUpperCase();
                                const tinyNote = `SEVQR${shortId}`;

                                const vietQrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.ACC}&bank=${SEPAY_CONFIG.BANK}&amount=${total}&des=${encodeURIComponent(fullNote)}`;

                                // Detect preferred bank for scheme lookup
                                const preferredBankId = typeof window !== 'undefined' ? localStorage.getItem('preferred_bank_id') || 'icb' : 'icb';
                                const preferredBankName = typeof window !== 'undefined' ? localStorage.getItem('preferred_bank_name') || 'VietinBank' : 'VietinBank';

                                const schemeFn = BANK_SCHEMES[preferredBankId];
                                const appSchemeUrl = schemeFn
                                    ? schemeFn(SEPAY_CONFIG.ACC, total, tinyNote)
                                    : `vietqr://a=${SEPAY_CONFIG.BIN}&ac=${SEPAY_CONFIG.ACC}&am=${total}&tn=${tinyNote}`;

                                const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

                                return (
                                    <div className="flex flex-col items-center gap-4">
                                        <img
                                            src={vietQrUrl}
                                            alt="VietQR Code"
                                            className="w-[200px] h-[200px] object-cover"
                                        />

                                        {isMobile && (
                                            <a
                                                href={appSchemeUrl}
                                                onClick={() => {
                                                    // Fallback check: if the app doesn't open within 1.5s, show a hint
                                                    setTimeout(() => {
                                                        if (document.hasFocus()) {
                                                            toast.info('Nếu App không tự mở, hãy quét mã QR phía trên nhé!', { duration: 5000 });
                                                        }
                                                    }, 1500);
                                                }}
                                                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                                            >
                                                <Smartphone className="w-5 h-5" />
                                                Mở App {preferredBankName}
                                            </a>
                                        )}

                                        {!isMobile && (
                                            <p className="text-[10px] text-neutral-400 italic">
                                                Dùng App ngân hàng để quét mã QR
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <span className="flex items-center text-sm font-bold text-neutral-500 animate-pulse">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang chờ thanh toán (SePay)...
                        </span>
                    </div>
                ) : (
                    // CART VIEW
                    <>
                        <DialogHeader className="mb-4">
                            <DialogTitle className="font-display text-2xl text-center uppercase tracking-wider text-text">Giỏ Hàng Của Bạn</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500 font-main">
                                    Giỏ hàng đang trống. Hãy chọn món nhé!
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.foodId} className="flex justify-between items-center bg-white p-3 rounded-2xl border-2 border-neutral-100 shadow-sm">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-neutral-800 line-clamp-1">{item.name}</h4>
                                            <p className="text-primary font-display font-medium text-sm">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-neutral-100 rounded-full p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-neutral-500 transition-colors"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-neutral-500 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.foodId)}
                                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="mt-4 pt-4 border-t-2 border-dashed border-neutral-200">
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ghi chú cho bếp (vd: không hành, ít cay...)"
                                    className="w-full text-sm font-main p-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none mb-4 resize-none h-20"
                                />

                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-neutral-600 tracking-wider text-sm uppercase">Tổng cộng:</span>
                                    <span className="font-display text-2xl font-black text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('Transfer')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Transfer'
                                            ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                                            }`}
                                    >
                                        <QrCode className={`size-6 ${paymentMethod === 'Transfer' ? 'text-primary' : 'text-neutral-400'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${paymentMethod === 'Transfer' ? 'text-primary' : 'text-neutral-500'}`}>
                                            Chuyển khoản
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('Cash')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Cash'
                                            ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                                            }`}
                                    >
                                        <Receipt className={`size-6 ${paymentMethod === 'Cash' ? 'text-primary' : 'text-neutral-400'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${paymentMethod === 'Cash' ? 'text-primary' : 'text-neutral-500'}`}>
                                            Tiền mặt
                                        </span>
                                    </button>
                                </div>

                                <Button
                                    onClick={handleConfirm}
                                    disabled={placeOrderMutation.isPending || isSyncing || !paymentMethod}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-display text-lg uppercase tracking-widest rounded-2xl border-2 border-text shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    {placeOrderMutation.isPending || isSyncing ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> ĐANG TẠO ĐƠN...</>
                                    ) : (
                                        <>XÁC NHẬN ĐẶT MÓN</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
