'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OrderHistoryPage() {
    return (
        <div className="min-h-screen bg-background font-mono">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-bold mb-8 hover:text-primary transition-colors">
                        <ArrowLeft size={16} />
                        QUAY LẠI THỰC ĐƠN
                    </Link>

                    <Card className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="border-b-4 border-black p-8 bg-primary/10">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center border-4 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                    <ClipboardList size={28} />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">Lịch sử đơn hàng</CardTitle>
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-[0.2em] mt-1">Order History Tracking</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12 text-center">
                            <div className="flex flex-col items-center gap-6 py-8">
                                <div className="size-20 rounded-full bg-black/5 flex items-center justify-center border-4 border-black/10">
                                    <Clock size={40} className="text-black/20" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold uppercase tracking-tight">Tính năng đang phát triển</h3>
                                    <p className="text-sm text-black/60 font-bold max-w-sm mx-auto leading-relaxed uppercase">
                                        Chúng tôi đang tối ưu hóa hệ thống lưu trữ để bạn có thể xem lại các món đã gọi một cách chính xác nhất.
                                    </p>
                                </div>
                                <Button asChild className="mt-4 px-10 py-6 rounded-2xl border-4 border-black text-lg">
                                    <Link href="/menu">TIẾP TỤC ĐẶT MÓN</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-12 p-8 border-4 border-black border-dashed rounded-[2rem] bg-black/5">
                        <p className="text-[10px] font-bold text-black/40 text-center uppercase tracking-[0.3em]">
                            Bun Bo System v1.0 • Technical Preview
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
