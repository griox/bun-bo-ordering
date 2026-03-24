/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Loader2, Minus, Plus, X, QrCode } from 'lucide-react';
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
    const { cart, getCartTotal, updateQuantity, removeFromCart, setSession, session, paymentSuccessOrderId, setPaymentSuccess, clearCart } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);

    const total = getCartTotal();
    const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

    // Watch for payment success via SignalR
    useEffect(() => {
        if (paymentOrderId && paymentSuccessOrderId === paymentOrderId) {
            toast.success("Thanh toán thành công! Nhà bếp đang chuẩn bị món ăn.");
            clearCart();
            setPaymentSuccess(null);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPaymentOrderId(null);
            setIsOpen(false);
            setSession(null);
        }
    }, [paymentSuccessOrderId, paymentOrderId, clearCart, setPaymentSuccess, setIsOpen, setSession]);

    const handleConfirm = async () => {
        try {
            // Sync the local cart state to the backend Redis session first
            const cartPayload = cart.map(item => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity
            }));

            await syncCart(cartPayload);

            // Now safely place the order since the backend cart exists
            const orderIdResult = await placeOrderMutation.mutateAsync({ note });
            const finalOrderId = orderIdResult.id || orderIdResult.Id;

            if (!finalOrderId) {
                console.error("Critical: Order ID missing in response", orderIdResult);
                toast.error("Lỗi hệ thống: Không xác định được mã đơn hàng.");
                return;
            }

            try {
                // BUG FIX: Ensure we extract the ID correctly (handling casing)
                console.log("Creating pending payment for order:", finalOrderId);
                await axiosInstance.post('/api/payments', { orderId: finalOrderId, amount: total });
            } catch (err) {
                console.error('Failed to initialize payment transaction', err);
            }

            // Switch to Payment QR View
            setPaymentOrderId(finalOrderId);
            // We NO LONGER close the modal or clear session here. We wait for payment!
        } catch (error) {
            console.error("Order failed:", error);
        }
    };

    // Reset state when modal is fully closed manually
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setPaymentOrderId(null);
            setPaymentSuccess(null);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger nativeButton={true} render={
                <button className="relative group cursor-pointer mr-2 md:mr-4 bg-transparent border-none p-0 focus:outline-none">
                    <div className="flex items-center justify-center bg-primary text-white w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-text shadow-[2px_2px_0px_#2D2D2D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#2D2D2D] transition-all">
                        <ShoppingCart size={18} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-text shadow-sm">
                                {itemCount}
                            </span>
                        )}
                    </div>
                </button>
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
                            {/* VietQR Implementation */}
                            <img
                                src={`https://img.vietqr.io/image/ICB-104876858916-compact.png?amount=${total}&addInfo=THANHTOAN%20${paymentOrderId}&accountName=BUNBO`}
                                alt="VietQR Code"
                                className="w-[200px] h-[200px] object-cover"
                            />
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

                                <Button
                                    onClick={handleConfirm}
                                    disabled={placeOrderMutation.isPending || isSyncing}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-display text-lg uppercase tracking-widest rounded-2xl border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2D2D2D] transition-all"
                                >
                                    {placeOrderMutation.isPending || isSyncing ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> ĐANG TẠO ĐƠN...</>
                                    ) : (
                                        <><QrCode className="w-5 h-5 mr-2" /> THANH TOÁN QR</>
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
