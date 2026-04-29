/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2, Minus, Plus, X, QrCode, Receipt, Smartphone, Ticket, MessageSquare } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { useCart, usePlaceOrderMutation } from '@/hooks/useCart';
import { usePromotions } from '@/hooks/usePromotions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export function CartModal() {
    const { cart, getCartTotal, updateQuantity, updateNote, removeFromCart, session, table, paymentSuccessOrderId, setPaymentSuccess, clearCart } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();
    const { validateVoucherMutation, useActiveVouchers } = usePromotions();
    const { data: availableVouchers } = useActiveVouchers();

    const [isOpen, setIsOpen] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | null>(null);

    // Voucher states
    const [voucherCode, setVoucherCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
    const [isVoucherListOpen, setIsVoucherListOpen] = useState(false);

    const subtotal = getCartTotal();
    const total = Math.max(0, subtotal - discountAmount);
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

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
                toast.success(`Đã áp dụng mã giảm giá! Tiết kiệm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.discountAmount)}`);
            } else {
                setDiscountAmount(0);
                setAppliedVoucher(null);
                toast.error(result.message || "Mã giảm giá không hợp lệ");
            }
        } catch {
            toast.error("Lỗi khi kiểm tra mã giảm giá");
        }
    };

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
                quantity: item.quantity,
                note: item.note
            }));

            await syncCart(cartPayload);

            // Place the order
            const orderIdResult = await placeOrderMutation.mutateAsync({
                paymentMethod: paymentMethod,
                voucherCode: appliedVoucher,
                discountAmount: discountAmount
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
                    await axiosInstance.post('/api/payments', {
                        orderId: finalOrderId,
                        amount: total,
                        voucherCode: appliedVoucher,
                        tableSessionId: session?.id,
                        tableNumber: table?.name
                    });
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
            <DialogTrigger asChild>
                <div className="relative group cursor-pointer mr-2 md:mr-4 bg-transparent border-none p-0 focus:outline-none inline-block">
                    <div className="flex items-center justify-center surface-highest text-primary w-11 h-11 rounded-[1.25rem] border border-border/10 shadow-sm hover:surface-low transition-all">
                        <ShoppingCart size={18} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-border/10 shadow-sm">
                                {itemCount}
                            </span>
                        )}
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="w-[92vw] max-w-lg surface-base border-none p-8 shadow-ambient rounded-[3rem] heritage-theme">
        <DialogDescription className="sr-only">Dialog nội dung</DialogDescription>

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
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang chờ thanh toán...
                        </span>
                    </div>
                ) : (
                    // CART VIEW
                    <>
                        <DialogHeader className="mb-8">
                            <DialogTitle className="text-3xl font-black text-primary text-center uppercase tracking-tighter italic">Giỏ Hàng Của Bạn</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-2">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground font-bold opacity-60 uppercase tracking-widest text-xs">
                                    Giỏ hàng đang trống
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.foodId} className="flex flex-col gap-3 surface-low p-4 rounded-2xl border border-border/5 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h4 className="font-black text-sm text-foreground tracking-tight line-clamp-1">{item.name}</h4>
                                                <p className="text-primary font-black text-[10px] tracking-widest uppercase mt-1">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center surface-base rounded-xl p-1 border border-border/5">
                                                    <button
                                                        onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:surface-highest text-muted-foreground transition-all"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:surface-highest text-muted-foreground transition-all"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.foodId)}
                                                    className="text-muted-foreground/30 hover:text-primary transition-colors p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Per-item Note Input */}
                                        <div className="flex items-center gap-2 group/note surface-base p-2.5 rounded-xl border border-border/10 transition-all">
                                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground group-focus-within/note:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Ghi chú món này..."
                                                value={item.note || ''}
                                                onChange={(e) => updateNote(item.foodId, e.target.value)}
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold text-foreground placeholder:text-muted-foreground p-0 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="mt-4 p-4 border-t-2 border-dashed border-neutral-100">
                                {/* Select Voucher Button */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => setIsVoucherListOpen(!isVoucherListOpen)}
                                        className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border-2 border-primary/20 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                                <Ticket className="size-5 text-primary" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-primary uppercase tracking-wider">Ưu đãi / Mã giảm giá</p>
                                                <p className="text-[11px] text-primary/70 font-medium italic">
                                                    {appliedVoucher ? `Đã chọn: ${appliedVoucher}` : 'Chọn hoặc nhập mã khuyến mãi'}
                                                </p>
                                            </div>
                                        </div>
                                        <Plus className={`size-4 text-primary transition-transform ${isVoucherListOpen ? 'rotate-45' : ''}`} />
                                    </button>

                                    {/* Voucher List Expandable */}
                                    {isVoucherListOpen && (
                                        <div className="mt-3 p-3 bg-white border-2 border-neutral-100 rounded-2xl shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="NHẬP MÃ..."
                                                    value={voucherCode}
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    disabled={!!appliedVoucher}
                                                    className="flex-1 h-10 px-4 bg-neutral-50 border-2 border-neutral-200 rounded-xl focus:border-primary focus:outline-none text-xs font-bold uppercase disabled:opacity-50"
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
                                                        className="h-10 px-4 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold text-[10px] uppercase"
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
                                                        Áp dụng
                                                    </Button>
                                                )}
                                            </div>

                                            {/* List of Available Vouchers */}
                                            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pt-2">
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Mã có sẵn</p>
                                                {availableVouchers?.filter(v => v.isActive).map(voucher => {
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
                                                {(!availableVouchers || availableVouchers.length === 0) && (
                                                    <p className="text-[10px] text-neutral-400 italic text-center py-2">Không có mã giảm giá nào khác</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>



                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between items-center text-sm font-bold text-neutral-500">
                                        <span>Tạm tính:</span>
                                        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                                            <span>Giảm giá:</span>
                                            <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-100">
                                        <span className="font-bold text-neutral-600 tracking-wider text-sm uppercase">Tổng cộng:</span>
                                        <span className="font-display text-2xl font-black text-primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                        </span>
                                    </div>
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
