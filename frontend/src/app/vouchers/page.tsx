'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gift, Tag, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/landing/Footer';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromotions } from '@/hooks/usePromotions';
import { toast } from 'react-hot-toast';

export default function VouchersPage() {
    const { user } = useAuthStore();
    const { useMyVouchers, useActiveVouchers, useRedeemVoucherMutation, useMyPoints } = usePromotions();
    const { data: myVouchers, isLoading } = useMyVouchers();
    const { data: activeVouchers } = useActiveVouchers();
    const { data: pointsData } = useMyPoints();
    const redeemMutation = useRedeemVoucherMutation();
    const [activeTab, setActiveTab] = useState('unused');
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

    // 1. Calculate how many times each voucher has been redeemed by the user
    const redemptionCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        if (myVouchers) {
            myVouchers.forEach(v => {
                counts[v.voucherId] = (counts[v.voucherId] || 0) + 1;
            });
        }
        return counts;
    }, [myVouchers]);

    // 2. Filter logic using real status from backend + public standard vouchers
    const filteredVouchers = React.useMemo(() => {
        if (activeTab === 'unused') {
            const results: { id?: string; code: string; description: string; status: string; expiryDate?: string; voucherId: string }[] = [];
            // Get unused vouchers from user inventory
            if (myVouchers) {
                results.push(...myVouchers.filter(v => v.status === 'Unused'));
            }
            // Add public "Standard" vouchers (not point-based) that anyone can use
            if (activeVouchers) {
                const standardVouchers = activeVouchers
                    .filter(v => v.type === 'Standard')
                    .map(v => ({
                        id: v.id,
                        code: v.code,
                        description: v.description,
                        status: 'Unused',
                        expiryDate: v.validTo,
                        voucherId: v.id
                    }));
                
                standardVouchers.forEach(sv => {
                    if (!results.find(rv => rv.voucherId === sv.id)) {
                        results.push(sv);
                    }
                });
            }
            return results;
        } 
        
        if (!myVouchers) return [];
        const statusMap: Record<string, string> = {
            'used': 'Used',
            'expired': 'Expired'
        };
        return myVouchers.filter(v => v.status === statusMap[activeTab]);
    }, [myVouchers, activeVouchers, activeTab]);

    // 3. Filter point-based vouchers for the redeem modal
    const redeemableVouchers = React.useMemo(() => {
        if (!activeVouchers) return [];
        return activeVouchers.filter(v => {
            if (v.type !== 'PointRedemption') return false;
            // Use maxUsagePerUser (correct field from API)
            const limit = v.maxUsagePerUser ?? 999;
            const count = redemptionCounts[v.id] || 0;
            return count < limit;
        });
    }, [activeVouchers, redemptionCounts]);

    const handleRedeem = async (voucherId: string) => {
        try {
            await redeemMutation.mutateAsync(voucherId);
            toast.success('Đổi ưu đãi thành công!');
            setIsRedeemModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { Message?: string } } };
            toast.error(err.response?.data?.Message || 'Đổi ưu đãi thất bại');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FEF9E7] text-[#2D2D2D] selection:bg-black selection:text-white relative font-main">
            {/* Background Pattern - Stronger for Paper Feel */}
            <div className="fixed inset-0 opacity-[0.15] pointer-events-none z-0"
                style={{ backgroundImage: "url('/images/parchment.png')" }}>
            </div>

            <Header />

            <main className="flex-grow max-w-7xl mx-auto px-6 pt-12 relative z-10 pb-32 w-full">
                <div className="text-center mb-8 md:mb-16">
                    <h1 className="font-display text-5xl md:text-8xl text-paper drop-shadow-[3px_3px_0px_#D9381E] mb-4 leading-tight uppercase">
                        Kho quà
                    </h1>
                    <span className="text-secondary font-display text-sm md:text-xl tracking-[0.2em] uppercase mb-4 block drop-shadow-md">
                        Tích điểm đổi ngàn ưu đãi hấp dẫn
                    </span>
                </div>
                <div className="max-w-4xl mx-auto">
                    {/* Points Card for all screen sizes */}
                    <div className="bg-black rounded-[32px] p-8 text-white mb-12 relative overflow-hidden group border-2 border-white/10 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Tag size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Điểm hiện có</span>
                                    <div className="size-1 bg-primary rounded-full animate-pulse" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black tracking-tighter">{pointsData?.balance?.toLocaleString() || 0}</span>
                                    <span className="text-xs font-bold text-white/40 mb-2 uppercase">Bún Bò Points</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Status Nav for all screen sizes */}
                    <div className="sticky top-[96px] z-30 -mx-6 px-6 py-4 bg-[#FFCC99] border-y-2 border-black/5 shadow-sm overflow-x-auto no-scrollbar flex justify-center gap-3 mb-12">
                        {[
                            { id: 'unused', label: 'Chưa dùng' },
                            { id: 'used', label: 'Đã dùng' },
                            { id: 'expired', label: 'Hết hạn' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2
                                    ${activeTab === tab.id
                                        ? "bg-primary text-white border-primary shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] translate-y-[-2px]"
                                        : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                        {/* Vouchers Grid/List */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
                            ))
                        ) : filteredVouchers.length > 0 ? (
                            filteredVouchers.map((v: { id?: string; code: string; description: string; status: string; expiryDate?: string; voucherId: string }, idx) => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    className="group bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-gray-50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="size-16 rounded-2xl bg-white flex items-center justify-center p-1 flex-shrink-0 border border-gray-100 shadow-sm">
                                        <div className="relative size-full">
                                            <Image src="/images/voucher-logo.png" alt="Bun Bo Logo" fill className="object-contain" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="text-[13px] font-black leading-tight mb-1 line-clamp-2 uppercase tracking-tight text-gray-800">
                                            {v.description}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                            <Clock size={12} className="text-gray-300" />
                                            <span>
                                                Hết hạn vào 23:59 {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center"
                            >
                                <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-gray-500 font-bold">Chưa có mã nào ở mục này</h3>
                            </motion.div>
                        )}
                    </AnimatePresence>
                        </div>
                </div>
            </main>

            {/* Bottom Floating Redeem Button */}
            {user && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button 
                        onClick={() => setIsRedeemModalOpen(true)}
                        className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl shadow-black/20 active:scale-95 transition-all"
                    >
                        <div className="size-6 bg-primary rounded-full flex items-center justify-center">
                            <Tag size={12} className="text-white fill-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Đổi thêm ưu đãi</span>
                    </button>
                </div>
            )}

            {/* Redeem Modal */}
            <AnimatePresence>
                {isRedeemModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRedeemModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-800">Đổi ưu đãi</h2>
                                    <p className="text-xs text-gray-400 font-medium">Sử dụng điểm để đổi các mã giảm giá hấp dẫn</p>
                                </div>
                                <button 
                                    onClick={() => setIsRedeemModalOpen(false)}
                                    className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {redeemableVouchers.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Gift size={24} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 text-sm">Hiện không có ưu đãi nào để đổi</p>
                                    </div>
                                ) : (
                                    redeemableVouchers.map((v) => {
                                        const userPoints = pointsData?.balance || 0;
                                        const cost = v.pointCost || 0;
                                        const canAfford = userPoints >= cost;
                                        const isPending = redeemMutation.isPending;

                                        return (
                                            <div key={v.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Tag className="text-primary" size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-black text-gray-800 mb-0.5 uppercase truncate">{v.code}</h4>
                                                    <p className="text-[11px] text-gray-500 line-clamp-1">{v.description}</p>
                                                    <div className={`flex items-center gap-1 mt-1 text-xs font-black uppercase tracking-wider ${canAfford ? 'text-primary' : 'text-gray-400'}`}>
                                                        <span>{cost.toLocaleString()} ĐIỂM</span>
                                                        {!canAfford && (
                                                            <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                                                                (cần thêm {(cost - userPoints).toLocaleString()}đ)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => canAfford && !isPending && handleRedeem(v.id)}
                                                    disabled={!canAfford || isPending}
                                                    className={`shrink-0 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        isPending
                                                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                                                            : canAfford
                                                            ? 'bg-black text-white hover:bg-primary active:scale-95 cursor-pointer'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isPending ? 'Đang đổi...' : canAfford ? 'Đổi ngay' : 'Chưa đủ'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số dư hiện tại</span>
                                    <span className="text-sm font-black text-gray-800">{pointsData?.balance?.toLocaleString()} ĐIỂM</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <div className="relative z-20 bg-[#2D2D2D]">
                <Footer />
            </div>
        </div>
    );
}
