'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Info, CheckCircle2, History, Gift, Tag, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromotions } from '@/hooks/usePromotions';
import { cn } from '@/lib/utils';
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

    // Filter logic using real status from backend + public standard vouchers
    const filteredVouchers = React.useMemo(() => {
        let results: any[] = [];
        
        if (activeTab === 'unused') {
            // 1. Get unused vouchers from user inventory
            if (myVouchers) {
                results = myVouchers.filter(v => v.status === 'Unused');
            }
            // 2. Add public "Standard" vouchers that anyone can use
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
                
                // Avoid duplicates if a standard voucher somehow got into inventory
                standardVouchers.forEach(sv => {
                    if (!results.find(rv => rv.voucherId === sv.id)) {
                        results.push(sv);
                    }
                });
            }
        } else {
            if (!myVouchers) return [];
            const statusMap: Record<string, string> = {
                'used': 'Used',
                'expired': 'Expired'
            };
            results = myVouchers.filter(v => v.status === statusMap[activeTab]);
        }
        
        return results;
    }, [myVouchers, activeVouchers, activeTab]);

    const handleRedeem = async (voucherId: string) => {
        try {
            await redeemMutation.mutateAsync(voucherId);
            toast.success('Đổi ưu đãi thành công!');
            setIsRedeemModalOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.Message || 'Đổi ưu đãi thất bại');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FE] text-[#2D2D2D] selection:bg-black selection:text-white pb-20">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
                    <button onClick={() => window.history.back()} className="size-10 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-base font-black uppercase tracking-widest">Kho quà</h1>
                    <div className="size-10" />
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 pt-6">
                {/* Points Card */}
                <div className="bg-black rounded-[32px] p-6 text-white mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Tag size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Điểm hiện có</span>
                            <div className="size-1 bg-primary rounded-full animate-pulse" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{pointsData?.balance?.toLocaleString() || 0}</span>
                            <span className="text-xs font-bold text-white/40 mb-1.5 uppercase">Bún Bò Points</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-2xl">
                    {['unused', 'used', 'expired'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600'
                            )}
                        >
                            {tab === 'unused' ? 'Chưa dùng' : tab === 'used' ? 'Đã dùng' : 'Hết hạn'}
                        </button>
                    ))}
                </div>

                {/* Vouchers List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
                            ))
                        ) : filteredVouchers.length > 0 ? (
                            filteredVouchers.map((v: any, idx) => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    className="group bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-gray-50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="size-16 rounded-2xl bg-[#FFF5F5] flex items-center justify-center p-2 flex-shrink-0 border border-red-50">
                                        <div className="relative size-full flex items-center justify-center">
                                            <div className="size-12 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-[8px] text-center leading-tight">
                                                BÚN BÒ<br/>CHUNG CƯ
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 size-3 bg-white rounded-full border border-gray-100" />
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
                                {activeVouchers?.filter(v => v.type === 'PointRedemption').length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Gift size={24} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 text-sm">Hiện không có ưu đãi nào để đổi</p>
                                    </div>
                                ) : (
                                    activeVouchers?.filter(v => v.type === 'PointRedemption').map((v) => (
                                        <div key={v.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Tag className="text-primary" size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-gray-800 mb-0.5 uppercase truncate">{v.code}</h4>
                                                <p className="text-[11px] text-gray-500 line-clamp-1">{v.description}</p>
                                                <div className="flex items-center gap-1 mt-1 text-primary font-black text-xs uppercase tracking-wider">
                                                    <span>{v.pointCost} ĐIỂM</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRedeem(v.id)}
                                                disabled={redeemMutation.isPending || (pointsData?.balance || 0) < (v.pointCost || 0)}
                                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    (pointsData?.balance || 0) >= (v.pointCost || 0)
                                                    ? 'bg-black text-white hover:bg-primary active:scale-95 disabled:opacity-50'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {redeemMutation.isPending ? 'Đang đổi...' : 'Đổi ngay'}
                                            </button>
                                        </div>
                                    ))
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
        </div>
    );
}
