'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScanTableMutation } from '@/hooks/useTables';
import { useOrderStore } from '@/store/useOrderStore';
import { Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function ScanPage() {
    const { tableId } = useParams();
    const router = useRouter();
    const scanMutation = useScanTableMutation();
    const { setSession, setTable, clearCart } = useOrderStore();

    useEffect(() => {
        if (tableId) {
            handleScan(tableId as string);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    const handleScan = async (id: string) => {
        try {
            const result = await scanMutation.mutateAsync(id);

            // Assuming the result contains sessionId and table info
            // If result only has sessionId, we might need another call to get table details
            // For now, let's assume result has { sessionId: '...', table: { id: '...', name: '...' } }

            if (result.sessionId) {
                // Clear old cart when switching tables/sessions maybe? 
                // Or just keep it. Let's clear to be safe if it's a new session.
                clearCart();

                setSession({
                    id: result.sessionId,
                    tableId: id,
                    startTime: new Date().toISOString(),
                    isActive: true
                });

                setTable({
                    id: id,
                    tableCode: '', // Would be better if API returned these
                    name: 'Bàn vừa quét'
                });

                toast.success("Quét mã thành công! Chào mừng bạn đến với BunBo.");

                // Redirect to menu/ordering page
                router.push('/menu');
            }
        } catch (error: unknown) {
            console.error("Scan error:", error);
            toast.error("Mã QR không hợp lệ hoặc đã hết hạn.");
            router.push('/menu');
        }
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6 px-10">
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-primary text-white p-8 rounded-[2.5rem] shadow-2xl">
                    <QrCode className="w-16 h-16 animate-bounce" />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-neutral-800">Đang nhận diện bàn...</h1>
                <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                    Vui lòng đợi trong giây lát, chúng tôi đang kết nối bạn với nhà bếp.
                </p>
            </div>

            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
}
