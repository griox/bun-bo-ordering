'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Edit3, ArrowRight, X, ChevronDown } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';

const TOP_ITEMS_ID = '__top_items__';

interface TopItem {
    key: string;
    item: OrderItem;
    totalQty: number;
}

interface Props {
    orders: Order[];
    preferredOrderId: string | null;
    onConfirm: (selectedId: string, saveAsDefault: boolean) => void;
    onSkip: () => void;
}

export function ReorderPrompt({ orders, preferredOrderId, onConfirm, onSkip }: Props) {
    const recentOrders = orders.slice(0, 5);

    const topItems: TopItem[] = useMemo(() => {
        const map: Record<string, TopItem> = {};
        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                const key = item.foodId ?? item.dishId ?? item.id;
                if (!map[key]) map[key] = { key, item, totalQty: 0 };
                map[key].totalQty += item.quantity;
            });
        });
        return Object.values(map)
            .sort((a, b) => b.totalQty - a.totalQty)
            .slice(0, 5);
    }, [orders]);

    const [activeTab, setActiveTab] = useState<'recent' | 'top'>('recent');
    const [selectedId, setSelectedId] = useState<string>(
        preferredOrderId ?? recentOrders[0]?.id ?? ''
    );
    const [expandedId, setExpandedId] = useState<string | null>(
        preferredOrderId ?? recentOrders[0]?.id ?? null
    );
    const [isEditingDefault, setIsEditingDefault] = useState(false);

    const handleSelectOrder = (id: string) => {
        setSelectedId(id);
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleTabChange = (tab: 'recent' | 'top') => {
        setActiveTab(tab);
        if (tab === 'top') {
            setSelectedId(TOP_ITEMS_ID);
        } else {
            const defaultId = preferredOrderId ?? recentOrders[0]?.id ?? '';
            setSelectedId(defaultId);
            setExpandedId(defaultId);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedId, isEditingDefault);
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#FDF8F3] rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col font-main"
        >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#DC2626]/20" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-4 border-b border-red-100">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#450A0A] tracking-tight">
                            Đặt như cũ? 🍜
                        </h2>
                        <p className="text-xs text-[#7f1d1d]/50 mt-0.5">
                            Chọn đơn để nạp vào giỏ hàng ngay
                        </p>
                    </div>
                    <button
                        onClick={onSkip}
                        className="size-9 rounded-full bg-white border border-red-100 flex items-center justify-center text-[#7f1d1d]/40 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    {([
                        ['recent', 'Đơn gần đây', Clock],
                        ['top', 'Hay gọi nhất', Star],
                    ] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            onClick={() => handleTabChange(id)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border',
                                activeTab === id
                                    ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm'
                                    : 'bg-white text-[#7f1d1d]/60 border-red-100 hover:bg-red-50'
                            )}
                        >
                            <Icon size={12} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {activeTab === 'recent' ? (
                    recentOrders.length === 0 ? (
                        <p className="text-center text-sm text-[#7f1d1d]/40 py-8">
                            Chưa có đơn hàng nào
                        </p>
                    ) : (
                        recentOrders.map(order => {
                            const isSelected = selectedId === order.id;
                            const isExpanded = expandedId === order.id;
                            const isDefault = preferredOrderId === order.id;

                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleSelectOrder(order.id)}
                                    className={cn(
                                        'w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white',
                                        isSelected
                                            ? 'border-[#DC2626] shadow-sm'
                                            : 'border-transparent shadow-sm hover:border-red-200'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-bold text-[#450A0A]">
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                {isDefault && (
                                                    <span className="text-[10px] bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#7f1d1d]/50 mt-0.5">
                                                {order.orderItems?.length ?? 0} món ·{' '}
                                                {order.totalAmount?.toLocaleString('vi-VN')}đ
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <div
                                                className={cn(
                                                    'size-5 rounded-full border-2 transition-all flex-shrink-0',
                                                    isSelected
                                                        ? 'bg-[#DC2626] border-[#DC2626]'
                                                        : 'border-gray-300'
                                                )}
                                            />
                                            <ChevronDown
                                                size={14}
                                                className={cn(
                                                    'text-[#7f1d1d]/30 transition-transform',
                                                    isExpanded && 'rotate-180'
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded items */}
                                    {isExpanded && (order.orderItems?.length ?? 0) > 0 && (
                                        <div className="mt-3 pt-3 border-t border-red-50 space-y-1.5">
                                            {order.orderItems?.slice(0, 4).map(item => (
                                                <div key={item.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-[#7f1d1d]/70 truncate mr-2">
                                                        {item.productName ?? item.dishName}
                                                    </span>
                                                    <span className="text-[#DC2626] font-bold flex-shrink-0">
                                                        ×{item.quantity}
                                                    </span>
                                                </div>
                                            ))}
                                            {(order.orderItems?.length ?? 0) > 4 && (
                                                <p className="text-xs text-[#7f1d1d]/30">
                                                    +{(order.orderItems?.length ?? 0) - 4} món khác
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )
                ) : (
                    /* Top items tab */
                    <button
                        onClick={() => setSelectedId(TOP_ITEMS_ID)}
                        className={cn(
                            'w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white',
                            selectedId === TOP_ITEMS_ID
                                ? 'border-[#DC2626] shadow-sm'
                                : 'border-transparent shadow-sm hover:border-red-200'
                        )}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-bold text-[#450A0A]">Combo các món hay gọi</p>
                                <p className="text-xs text-[#7f1d1d]/50 mt-0.5">
                                    Tổng hợp từ {orders.length} đơn hàng của bạn
                                </p>
                            </div>
                            <div
                                className={cn(
                                    'size-5 rounded-full border-2 transition-all flex-shrink-0',
                                    selectedId === TOP_ITEMS_ID
                                        ? 'bg-[#DC2626] border-[#DC2626]'
                                        : 'border-gray-300'
                                )}
                            />
                        </div>
                        <div className="space-y-2 pt-3 border-t border-red-50">
                            {topItems.map(({ key, item, totalQty }) => (
                                <div key={key} className="flex items-center justify-between text-xs">
                                    <span className="text-[#7f1d1d]/70 truncate mr-2">
                                        {item.productName ?? item.dishName}
                                    </span>
                                    <span className="text-[#DC2626] font-bold flex-shrink-0">
                                        {totalQty}× đã gọi
                                    </span>
                                </div>
                            ))}
                        </div>
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-3 border-t border-red-100 space-y-3 bg-[#FDF8F3]">
                <button
                    onClick={() => setIsEditingDefault(v => !v)}
                    className={cn(
                        'flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer w-full',
                        isEditingDefault ? 'text-[#DC2626]' : 'text-[#7f1d1d]/40 hover:text-[#DC2626]'
                    )}
                >
                    <Edit3 size={12} />
                    {isEditingDefault
                        ? '✓ Sẽ lưu làm mặc định sau khi đặt'
                        : 'Sửa lựa chọn mặc định'}
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className="w-full py-4 rounded-2xl bg-[#DC2626] text-white font-black text-sm hover:bg-[#B91C1C] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-red-200"
                >
                    Đặt như cũ
                    <ArrowRight size={16} />
                </button>

                <button
                    onClick={onSkip}
                    className="w-full py-2.5 rounded-2xl text-[#7f1d1d]/50 text-sm font-medium hover:text-[#450A0A] transition-colors cursor-pointer"
                >
                    Bỏ qua, tự chọn món
                </button>
            </div>
        </motion.div>
    );
}
