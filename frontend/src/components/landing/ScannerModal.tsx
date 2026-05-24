'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CameraOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function ScannerModal({ children }: { children: React.ReactElement }) {
    const t = useTranslations('Landing.Scanner');
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
            toast.success(t('success'));
        } catch {
            toast.error(t('invalid'));
        }
    }, [stopScanner, router, t]);

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
            setCameraError(t('cameraError'));
            setIsScanning(false);
        } finally {
            isTransitioningRef.current = false;
        }
    }, [handleScanSuccess, t]);

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
                toast.error(t('notFoundInImg'));
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
            <DialogContent className="w-[92vw] max-w-md bg-white border-2 border-black p-0 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded-[2.5rem]">
        <DialogDescription className="sr-only">{t('dialogContent')}</DialogDescription>
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: "url('/images/parchment.png')" }}>
                </div>

                <DialogHeader className="p-8 pb-4 relative z-10 text-center bg-white border-b-2 border-black/5">
                    <DialogTitle className="font-display text-3xl font-black text-primary tracking-tight uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                        {t('title')}
                    </DialogTitle>
                    <p className="text-xs font-main font-bold text-neutral-400 mt-2 uppercase tracking-widest">
                        {t('subtitle')}
                    </p>
                </DialogHeader>

                <div className="p-8 relative z-10">
                    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.05)] group">
                        {/* Viewfinder Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                                {/* Corner borders */}
                                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl opacity-80" />
                                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl opacity-80" />
                                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl opacity-80" />
                                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl opacity-80" />

                                {/* Scanning Line */}
                                <div className="w-full h-[2px] bg-primary/50 absolute top-0 shadow-[0_0_15px_rgba(217,56,30,0.8)] animate-[scan_2s_linear_infinite]" />

                                <style jsx>{`
                                    @keyframes scan {
                                        0% { top: 10%; opacity: 0; }
                                        10% { opacity: 1; }
                                        90% { opacity: 1; }
                                        100% { top: 90%; opacity: 0; }
                                    }
                                `}</style>
                            </div>
                        )}

                        <div id="reader" className="w-full h-full scale-[1.02]"></div>

                        {!isScanning && !cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-neutral-900/90 backdrop-blur-md p-4 text-center z-30">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
                                    <div className="absolute inset-0 w-12 h-12 bg-primary/20 blur-xl animate-pulse" />
                                </div>
                                <span className="font-display font-black text-xs uppercase tracking-[0.3em] mt-6 animate-pulse">{t('loadingCamera')}</span>
                            </div>
                        )}

                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-neutral-900 p-8 text-center z-30">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/20">
                                    <CameraOff className="w-10 h-10 text-red-500" />
                                </div>
                                <p className="text-sm mb-8 font-main font-bold leading-relaxed text-neutral-300 px-4 italic">
                                    &quot;{cameraError}&quot;
                                </p>
                                <div className="flex flex-col gap-4 w-full max-w-[260px]">
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white hover:bg-neutral-100 text-black border-2 border-black font-display font-black text-xs tracking-widest uppercase rounded-full h-14 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3"
                                    >
                                        <Upload size={18} className="text-primary" />
                                        {t('uploadImg')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={startScanner}
                                        className="text-neutral-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest"
                                    >
                                        {t('retry')}
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

                    <div className="mt-8 flex flex-col items-center">
                        {isScanning ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-3 px-6 py-2 bg-primary/5 rounded-full border border-primary/10">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                    <span className="text-[10px] font-display font-black text-primary uppercase tracking-[0.2em]">{t('findingQR')}</span>
                                </div>
                                <button
                                    onClick={stopScanner}
                                    className="text-[10px] font-bold text-neutral-400 mt-4 uppercase tracking-widest hover:text-red-500 transition-colors"
                                >
                                    {t('stopScanning')}
                                </button>
                            </div>
                        ) : (
                            <div className="h-10"></div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
