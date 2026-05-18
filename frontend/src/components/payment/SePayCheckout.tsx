'use client';

import React, { useEffect, useState } from 'react';
import { useDevice } from '@/hooks/useDevice';
import { QrCode, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface SePayCheckoutProps {
    qrCode: string; // Base64 or URL
    amount: number;
    onClose?: () => void;
}

interface BankApp {
    appId: string;
    appLogo: string;
    appName: string;
    deeplink: string;
}

export function SePayCheckout({ qrCode, amount }: SePayCheckoutProps) {
    const { isMobile, isInAppBrowser } = useDevice();
    const [banks, setBanks] = useState<BankApp[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);

    useEffect(() => {
        if (!isMobile) {
            const timer = setTimeout(() => setIsLoadingBanks(false), 0);
            return () => clearTimeout(timer);
        }

        // Fetch top bank apps available for VietQR deeplinking
        fetch('https://api.vietqr.io/v2/ios-app-deeplinks')
            .then(res => res.json())
            .then(data => {
                if (data?.data) {
                    setBanks(data.data.slice(0, 8)); // Get top 8 apps
                }
            })
            .catch(err => console.error("Failed to load banks", err))
            .finally(() => setIsLoadingBanks(false));
    }, [isMobile]);

    const handleOpenBankApp = (appId: string) => {
        try {
            const url = new URL(qrCode);
            const acc = url.searchParams.get('acc') || '';
            const des = url.searchParams.get('des') || '';
            const payUrl = `https://dl.vietqr.io/pay?app=${appId}&ba=${acc}&am=${amount}&tn=${encodeURIComponent(des)}`;
            window.location.assign(payUrl);
        } catch (e) {
            console.error("Failed to parse qrCode url for deeplink", e);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4">
            <div className="text-center">
                <h3 className="text-xl font-bold text-neutral-800 mb-2">Thanh toán đơn hàng</h3>
                <p className="text-2xl font-black text-primary">
                    {amount.toLocaleString('vi-VN')}đ
                </p>
            </div>

            {isInAppBrowser && (
                <div className="w-full flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <p>
                        Bạn đang mở từ <strong>Zalo/Facebook</strong>. Hãy chọn &quot;Mở bằng trình duyệt Safari/Chrome&quot; để tải mã QR dễ dàng hơn.
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center gap-4 w-full">
                <div className="p-4 bg-white border-4 border-neutral-100 rounded-3xl shadow-xl">
                    <Image
                        src={qrCode}
                        alt="Scan to pay"
                        width={240}
                        height={240}
                        className="object-cover"
                        unoptimized
                    />
                </div>

                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium w-full text-left max-w-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Lưu ý:</strong> Mã QR này chỉ có hiệu lực cho 1 đơn hàng duy nhất! Tuyệt đối không lưu và quét lại mã cũ để tránh mất tiền oan.</span>
                </div>

                {isMobile ? (
                    <div className="text-center space-y-4 w-full mt-2">
                        <div className="text-sm font-bold text-neutral-600 mb-2">Mở nhanh ứng dụng:</div>
                        {isLoadingBanks ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-300 w-6 h-6" /></div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {banks.map(bank => (
                                    <button
                                        key={bank.appId}
                                        onClick={() => handleOpenBankApp(bank.appId)}
                                        className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition-all"
                                        title={bank.appName}
                                    >
                                        <div className="w-12 h-12 rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white flex items-center justify-center p-1">
                                            <Image src={bank.appLogo} alt={bank.appId} width={48} height={48} className="object-contain rounded-lg" unoptimized />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center w-full gap-4 py-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs text-gray-400 font-bold uppercase">HOẶC</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <a
                            className="flex items-center justify-center w-full h-12 bg-white text-neutral-700 font-bold text-sm rounded-2xl shadow-sm border border-gray-200 active:scale-95 transition-transform"
                            href={qrCode}
                            download="ma-thanh-toan.png"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Tải mã QR để tự quét
                        </a>
                    </div>
                ) : (
                    <p className="text-sm text-neutral-600 flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Mở App Ngân hàng trên điện thoại để quét mã
                    </p>
                )}
            </div>
        </div>
    );
}
