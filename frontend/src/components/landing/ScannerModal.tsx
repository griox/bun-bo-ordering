'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Camera, CameraOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export function ScannerModal({ children }: { children: React.ReactElement }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isTransitioningRef = useRef(false);
    const router = useRouter();

    const stopScanner = useCallback(async () => {
        if (isTransitioningRef.current) return;

        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                isTransitioningRef.current = true;
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Stop error:", err);
            } finally {
                isTransitioningRef.current = false;
            }
        }
    }, []);

    const handleScanSuccess = useCallback(async (decodedText: string) => {
        try {
            await stopScanner();
            setIsOpen(false);

            if (decodedText.includes('http') && decodedText.includes('/scan/')) {
                const url = new URL(decodedText);
                router.push(url.pathname);
            } else if (decodedText.startsWith('/scan/')) {
                router.push(decodedText);
            } else {
                router.push(`/scan/${decodedText}`);
            }
            toast.success("Quét mã thành công!");
        } catch {
            toast.error("Mã QR không hợp lệ!");
        }
    }, [stopScanner, router]);

    const startScanner = useCallback(async () => {
        if (isTransitioningRef.current) return;

        const readerElement = document.getElementById("reader");
        if (!readerElement) return;

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("reader");
        }

        if (scannerRef.current.isScanning) return;

        try {
            isTransitioningRef.current = true;
            setCameraError(null);
            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    handleScanSuccess(decodedText);
                },
                () => { }
            );
            setIsScanning(true);
        } catch (err: unknown) {
            console.error("Camera error:", err);
            setCameraError("Hệ thống đã chặn quyền truy cập Camera. Bạn có thể sử dụng ảnh mã QR để thay thế.");
            setIsScanning(false);
        } finally {
            isTransitioningRef.current = false;
        }
    }, [handleScanSuccess]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const imageFile = e.target.files[0];
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader");
            }
            try {
                const decodedText = await scannerRef.current.scanFile(imageFile, true);
                handleScanSuccess(decodedText);
            } catch {
                toast.error("Không tìm thấy mã QR trong ảnh này.");
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                startScanner();
            }, 300);
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        } else {
            stopScanner();
        }
    }, [isOpen, startScanner, stopScanner]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-[92vw] max-w-md bg-background border-4 border-primary p-0 overflow-hidden shadow-[10px_10px_0px_rgba(217,56,30,0.2)] rounded-[2rem]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "url('/images/parchment.png')" }}>
                </div>

                <DialogHeader className="p-6 pb-2 relative z-10 text-center bg-white">
                    <DialogTitle className="font-display text-2xl text-primary tracking-widest uppercase">Quét Mã Tại Bàn</DialogTitle>
                    <p className="text-sm font-main text-neutral-500 mt-2">Đưa camera về phía mã QR hoặc tải lên ảnh mã QR.</p>
                </DialogHeader>

                <div className="bg-neutral-50 p-6 relative z-10">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-neutral-200 shadow-inner">
                        <div id="reader" className="w-full h-full"></div>

                        {!isScanning && !cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/60 backdrop-blur-sm p-4 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                                <span className="font-bold">Đang khởi động Camera...</span>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 p-6 text-center">
                                <CameraOff className="w-12 h-12 mb-4 text-red-500" />
                                <p className="text-sm mb-6 font-main font-bold leading-relaxed">{cameraError}</p>
                                <div className="flex flex-col gap-3 w-full max-w-[240px]">
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white hover:bg-neutral-100 text-black border-2 border-text font-bold rounded-xl h-12 shadow-[2px_2px_0px_#2D2D2D] active:translate-y-px active:shadow-none flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Upload size={18} />
                                        Chọn ảnh mã QR
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={startScanner}
                                        className="text-white hover:bg-white/10 mt-2"
                                    >
                                        Thử lại
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-3">
                        {isScanning ? (
                            <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
                                <Camera size={20} />
                                <span className="text-sm uppercase tracking-wider">Đang đợi quét...</span>
                            </div>
                        ) : (
                            <div className="h-6"></div>
                        )}
                        <p className="text-[10px] text-neutral-400 font-main text-center px-4 italic">
                            Nếu macOS chặn Camera, bạn vẫn có thể sử dụng ảnh screenshot mã QR (Cmd+Shift+4) để tải lên và quét.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
