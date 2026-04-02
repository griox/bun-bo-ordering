'use client';

import React from 'react';
import { useDevice } from '@/hooks/useDevice';
import { Smartphone, QrCode, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SePayCheckoutProps {
    checkoutUrl: string;
    qrCode: string; // Base64 or URL
    amount: number;
    onClose?: () => void;
}

export function SePayCheckout({ checkoutUrl, qrCode, amount, onClose }: SePayCheckoutProps) {
    const { isMobile, isInAppBrowser } = useDevice();

    const handlePay = () => {
        if (isMobile) {
            window.location.href = checkoutUrl;
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
                        Bạn đang mở từ <strong>Zalo/Facebook</strong>. Nếu App ngân hàng không tự mở, hãy chọn "Mở bằng trình duyệt Safari/Chrome" để dùng được tính năng thanh toán 1-click.
                    </p>
                </div>
            )}

            {isMobile ? (
                <div className="w-full flex flex-col gap-4">
                    <Button
                        onClick={handlePay}
                        className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                    >
                        <Smartphone className="w-6 h-6" />
                        Mở App Ngân hàng
                    </Button>

                    <p className="text-sm text-center text-neutral-500 italic">
                        Bạn sẽ được chuyển trực tiếp tới App ngân hàng đã cài đặt.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white border-4 border-neutral-100 rounded-3xl shadow-xl">
                        <img
                            src={qrCode}
                            alt="Scan to pay"
                            className="w-[240px] h-[240px] object-cover"
                        />
                    </div>
                    <p className="text-sm text-neutral-600 flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Mở App Ngân hàng trên điện thoại để quét mã
                    </p>

                    <div className="mt-4 pt-4 border-t border-neutral-100 w-full text-center">
                        <a
                            href={checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center justify-center gap-1"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Mở trang thanh toán SePay
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
