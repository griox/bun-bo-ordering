'use client';

import React, { useState } from 'react';
import { useOrderStore } from '@/store/useOrderStore';
import { usePlaceOrderMutation, useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight, Loader2, X, Trash2, MessageSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from '@/components/ui/input';

export function OrderBar() {
    const { cart, getCartTotal, getCartCount, updateQuantity, removeFromCart, session, table } = useOrderStore();
    const { syncCart, isSyncing } = useCart();
    const placeOrderMutation = usePlaceOrderMutation();
    
    const [note, setNote] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const total = getCartTotal();
    const count = getCartCount();

    if (count === 0) return null;

    const handlePlaceOrder = async () => {
        try {
            // 1. Sync cart to backend first as required by CreateOrder logic
            const cartItems = cart.map(item => ({
                foodId: item.foodId,
                foodName: item.name,
                unitPrice: item.price,
                quantity: item.quantity
            }));
            
            await syncCart(cartItems);
            
            // 2. Place order
            await placeOrderMutation.mutateAsync({ note });
            setIsSheetOpen(false);
            setNote('');
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-neutral-900 text-white rounded-3xl shadow-2xl p-4 flex items-center justify-between gap-4 border border-white/10"
                >
                    <SheetTrigger 
                        render={
                            <button className="flex items-center gap-3 flex-1 text-left">
                                <div className="relative">
                                    <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/40">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                        {count}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Giỏ hàng của bạn</p>
                                    <p className="font-display text-xl font-bold">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                                    </p>
                                </div>
                            </button>
                        }
                    />

                    <Button 
                        onClick={() => setIsSheetOpen(true)}
                        className="bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl h-14 px-6 font-black gap-2 transition-all active:scale-95 group"
                    >
                        XEM ĐƠN
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>

                <SheetContent side="bottom" className="h-[80vh] rounded-t-[40px] px-6 pb-10 border-none shadow-2xl">
                    <SheetHeader className="mb-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-1.5 bg-neutral-200 rounded-full" />
                        </div>
                        <SheetTitle className="text-3xl font-display text-center">Xác nhận đơn hàng</SheetTitle>
                        {table && (
                            <p className="text-center text-primary font-bold">{table.name} • {table.tableCode}</p>
                        )}
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                        {cart.map((item) => (
                            <div key={item.foodId} className="flex items-center gap-4 bg-neutral-50 p-4 rounded-3xl group">
                                <div className="flex-1">
                                    <h4 className="font-bold text-neutral-800">{item.name}</h4>
                                    <p className="text-sm font-bold text-primary">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                    </p>
                                </div>
                                <div className="flex items-center bg-white rounded-full p-1 shadow-sm border border-neutral-100">
                                    <button 
                                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-red-500"
                                        onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-neutral-800">{item.quantity}</span>
                                    <button 
                                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-primary"
                                        onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => removeFromCart(item.foodId)}
                                    className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        <div className="space-y-2 mt-6">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Ghi chú cho nhà bếp
                            </label>
                            <Input 
                                placeholder="Ví dụ: Không cay, thêm hành..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="h-14 rounded-2xl bg-neutral-50 border-none focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <SheetFooter className="block">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <span className="text-neutral-500 font-bold uppercase tracking-wider">Tổng thanh toán</span>
                            <span className="text-3xl font-display font-black text-neutral-900 italic">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                            </span>
                        </div>

                        {!session ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold text-sm mb-4 border border-red-100 italic">
                                Vui lòng quét mã QR tại bàn để bắt đầu đặt món!
                            </div>
                        ) : (
                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={isSyncing || placeOrderMutation.isPending}
                                className="w-full h-16 rounded-3xl text-lg font-black shadow-2xl shadow-primary/30 gap-3 group"
                            >
                                {isSyncing || placeOrderMutation.isPending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        XÁC NHẬN ĐẶT MÓN
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
