'use client';

import { useOrderStore } from '@/store/useOrderStore';
import { useEffect, useState } from 'react';

export function StickyCart() {
    const { getCartCount, getCartTotal } = useOrderStore();
    const count = getCartCount();
    const total = getCartTotal();

    // Hydration fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pb-8">
            <button className="w-full bg-orange-600 text-white rounded-xl py-3 px-4 shadow-lg shadow-orange-200 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                    <div className="bg-white text-orange-600 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {count}
                    </div>
                    <span className="font-medium">Xem giỏ hàng</span>
                </div>
                <span className="font-bold text-lg">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                </span>
            </button>
        </div>
    );
}
