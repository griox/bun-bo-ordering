'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Ticket, BadgePercent, Star, ArrowRight, Receipt, Sparkles, Zap, Gift } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { usePromotions, Voucher } from '@/hooks/usePromotions';

export default function VouchersPage() {
    const { user } = useAuthStore();
    const { useActiveVouchers, useMyPoints } = usePromotions();
    const { data: vouchers, isLoading: vouchersLoading } = useActiveVouchers();
    const { data: points } = useMyPoints();

    return (
        <div className="min-h-screen bg-[#FDF6E3] font-admin relative overflow-hidden selection:bg-primary selection:text-white">
            {/* Background Texture Layers */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply bg-paper-pattern"></div>
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-retro-paper"></div>
            
            {/* Dynamic Glow Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-white/40 rounded-full filter blur-[150px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-15%] right-[-5%] w-[1200px] h-[1200px] bg-primary/5 rounded-full filter blur-[180px] pointer-events-none"></div>

            <Header />
            
            <main className="relative z-10 container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-6xl mx-auto">
                    {/* Premium Navigation Header */}
                    <div className="flex items-center justify-between mb-16">
                        <Link 
                            href="/menu" 
                            className="group flex items-center gap-3 text-text/40 hover:text-primary transition-all"
                        >
                            <div className="size-10 rounded-full border-2 border-text/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all shadow-[2px_2px_0px_transparent] group-hover:shadow-[2px_2px_0px_#2D2D2D]">
                                <ArrowLeft size={18} />
                            </div>
                            <span className="font-display text-xs font-black tracking-[0.2em] uppercase">Về Thực Đơn</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-text/30 uppercase tracking-widest">Cập nhật lúc</span>
                                <span className="text-xs font-bold text-text uppercase">12:00 PM • HÔM NAY</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border-2 border-secondary/20 rounded-full text-secondary font-black text-[10px] uppercase tracking-widest mb-6">
                                <Sparkles size={12} />
                                Ưu đãi độc quyền cho thành viên
                            </div>
                            <h1 className="font-display text-5xl md:text-8xl text-text leading-[0.85] uppercase tracking-tighter mb-8">
                                KHO <span className="text-primary block md:inline">VOUCHER</span>
                            </h1>
                            <p className="text-xl text-text/50 leading-relaxed font-medium max-w-lg border-l-4 border-primary/20 pl-6 py-2">
                                Nơi lưu trữ những đặc quyền <span className="text-text font-bold">tốt nhất</span> dành riêng cho bạn. Sử dụng điểm để đổi thêm ưu đãi ngay.
                            </p>
                        </div>

                        {user && (
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-white border-4 border-text p-8 rounded-[2.5rem] shadow-[12px_12px_0px_#2D2D2D] min-w-[300px] transition-all hover:translate-y-[-4px] hover:shadow-[16px_16px_0px_#2D2D2D]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[11px] font-black text-text/30 uppercase tracking-[0.3em] mb-1">Thành viên</p>
                                            <h3 className="font-display text-2xl text-text uppercase truncate max-w-[150px]">
                                                {user.username || 'Khách'}
                                            </h3>
                                        </div>
                                        <div className="size-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary">
                                            <Zap size={24} className="fill-primary" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t-2 border-text/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-5xl font-display text-text leading-none">{points?.balance || 0}</span>
                                            <Star size={24} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                                        </div>
                                        <p className="text-[11px] font-bold text-text/40 uppercase tracking-widest">Điểm thưởng khả dụng</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vouchers Grid with Refined Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {vouchersLoading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-white/30 animate-pulse rounded-[2.5rem] border-4 border-dashed border-text/10"></div>
                            ))
                        ) : vouchers && vouchers.length > 0 ? (
                            vouchers.map((v: Voucher) => (
                                <div key={v.id} className="group relative flex flex-col h-full transition-all duration-300">
                                    {/* The "Ticket" Card */}
                                    <div className="flex-1 bg-white border-4 border-text rounded-[2.5rem] p-8 shadow-[10px_10px_0px_#2D2D2D] group-hover:shadow-[14px_14px_0px_#2D2D2D] group-hover:translate-y-[-4px] transition-all relative overflow-hidden flex flex-col">
                                        
                                        {/* Decorative Ticket Punches */}
                                        <div className="absolute top-1/2 -left-5 -translate-y-1/2 size-8 md:size-10 bg-[#FDF6E3] border-4 border-text rounded-full z-10"></div>
                                        <div className="absolute top-1/2 -right-5 -translate-y-1/2 size-8 md:size-10 bg-[#FDF6E3] border-4 border-text rounded-full z-10"></div>
                                        
                                        {/* Background Decor */}
                                        <div className="absolute -top-10 -right-10 size-32 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                                        <div className="flex items-start justify-between mb-8 relative z-20">
                                            <div className="size-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border-2 border-secondary/20 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                                                <Ticket size={28} />
                                            </div>
                                            <div className="px-3 py-1.5 bg-primary/10 border-2 border-primary/20 rounded-full">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Khả dụng</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 mb-10 relative z-20">
                                            <div className="flex flex-col gap-1 mb-4">
                                                <span className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em]">Mã Ưu Đãi</span>
                                                <h3 className="font-display text-4xl text-text leading-none uppercase tracking-tighter group-hover:text-primary transition-colors">
                                                    {v.code}
                                                </h3>
                                            </div>
                                            <p className="text-sm font-bold text-text/60 leading-relaxed line-clamp-2 italic">
                                                "{v.description}"
                                            </p>
                                        </div>

                                        <div className="pt-8 border-t-4 border-dashed border-text/5 flex justify-between items-center relative z-20">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-text/30 uppercase tracking-widest">Hạn dùng</span>
                                                <span className="text-sm font-black text-text">31 THG 12</span>
                                            </div>
                                            <Button className="h-12 px-8 rounded-full border-4 border-text bg-secondary text-white shadow-[4px_4px_0px_#2D2D2D] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#2D2D2D] active:shadow-none active:translate-y-[2px] transition-all font-display text-base group/btn">
                                                <span className="flex items-center gap-2">
                                                    SỬ DỤNG
                                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center border-4 border-dashed border-text/10 rounded-[4rem] bg-white/20">
                                <div className="size-24 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-8 border-4 border-dashed border-text/10">
                                    <Ticket size={48} className="text-text/10" />
                                </div>
                                <h3 className="text-3xl font-display text-text/30 uppercase tracking-[0.2em]">Danh sách trống</h3>
                                <p className="text-text/20 font-bold mt-4 uppercase tracking-widest">Hãy quay lại sau khi đã tích thêm điểm!</p>
                            </div>
                        )}
                    </div>

                    {/* Elite Promotional Section */}
                    <div className="mt-32 relative rounded-[4rem] bg-text p-12 md:p-20 overflow-hidden border-4 border-text shadow-[20px_20px_0px_#2D2D2D] group">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                            <BadgePercent size={400} className="text-white" />
                        </div>
                        <div className="absolute -bottom-20 -left-20 size-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-white/60 font-black text-[10px] uppercase tracking-widest mb-8 border border-white/10">
                                    <Gift size={14} className="text-secondary" />
                                    Hội viên VIP
                                </div>
                                <h2 className="text-4xl md:text-7xl font-display text-white mb-8 uppercase leading-[0.9] tracking-tighter">
                                    ĂN CÀNG <span className="text-primary italic">SUNG</span> <br />
                                    NHẬN CÀNG <span className="text-secondary underline decoration-4 underline-offset-8">KHỦNG</span>
                                </h2>
                                <p className="text-white/40 text-lg mb-12 font-medium leading-relaxed">
                                    Đừng quên nhập số điện thoại mỗi khi thanh toán tại quầy để tự động tích điểm. <span className="text-white/80">Mỗi 1,000đ = 1 điểm.</span> Tích lũy đủ để đổi những phần quà hấp dẫn nhất.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <Button asChild className="px-10 py-8 rounded-full border-4 border-white bg-white text-text shadow-[6px_6px_0px_rgba(255,255,255,0.2)] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_rgba(255,255,255,0.3)] transition-all font-display text-xl group/cta">
                                        <Link href="/menu" className="flex items-center gap-3">
                                            VỀ THỰC ĐƠN
                                            <Zap size={20} className="fill-primary text-primary group-hover/cta:scale-125 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="hidden lg:block w-full max-w-[350px]">
                                <div className="bg-white/5 border-2 border-white/10 p-8 rounded-[3rem] backdrop-blur-md">
                                    <div className="flex flex-col gap-6">
                                        {[
                                            { icon: Sparkles, text: "Ưu đãi sinh nhật", color: "text-primary" },
                                            { icon: Zap, text: "X2 điểm ngày lễ", color: "text-secondary" },
                                            { icon: Gift, text: "Quà tặng bất ngờ", color: "text-blue-400" }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 group/item">
                                                <div className={`size-12 rounded-2xl bg-white/10 flex items-center justify-center ${item.color} group-hover/item:bg-white transition-colors`}>
                                                    <item.icon size={20} />
                                                </div>
                                                <span className="font-display text-white/80 uppercase tracking-widest text-sm">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Refined Footer Branding */}
                    <div className="mt-32 pt-20 border-t-4 border-text border-dashed flex flex-col items-center gap-8">
                        <div className="size-20 rounded-[1.5rem] border-4 border-text flex items-center justify-center bg-white shadow-[6px_6px_0px_#2D2D2D] hover:rotate-6 transition-transform cursor-help">
                            <Receipt size={36} className="text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-display text-3xl uppercase tracking-tighter text-text mb-3">Bun Bo System v1.0</p>
                            <div className="flex items-center gap-4 justify-center opacity-30">
                                <span className="h-px w-8 bg-text"></span>
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-text">
                                    Authenticity • Tradition • Excellence
                                </p>
                                <span className="h-px w-8 bg-text"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
