'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '@/store/useAuthStore';

export function OnboardingGuide() {
    const { user } = useAuthStore();
    const hasRun = useRef(false);

    useEffect(() => {
        if (user || hasRun.current) return;

        const isGuided = localStorage.getItem('onboarding-guided');
        if (isGuided) return;

        const isMobile = window.innerWidth < 768;

        const desktopSteps = [
            {
                element: '#nav-home',
                popover: { title: 'Trang chủ', description: 'Chào mừng bạn đến với Bún Bò & Cà Phê Phố!', side: "bottom", align: 'start' }
            },
            {
                element: '#nav-menu',
                popover: { title: 'Thực đơn', description: 'Khám phá danh sách các món ăn đậm đà hương vị.', side: "bottom", align: 'start' }
            },
            {
                element: '#nav-about',
                popover: { title: 'Về chúng tôi', description: 'Tìm hiểu về câu chuyện và tâm huyết của chúng tôi.', side: "bottom", align: 'start' }
            },
            {
                element: '#nav-member-desktop',
                popover: { title: 'Thành viên', description: 'Đăng nhập để quản lý giỏ hàng và xem lịch sử mua hàng.', side: "bottom", align: 'end' }
            }
        ] as const;

        const mobileSteps = [
            {
                element: '#nav-member-mobile',
                popover: {
                    title: 'Menu & Thành viên',
                    description: 'Nhấn vào đây để xem các lựa chọn menu và đăng nhập thành viên.',
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '#mobile-menu',
                popover: {
                    title: 'Xem thực đơn',
                    description: 'Bạn có thể truy cập nhanh vào thực đơn ngay tại đây.',
                    side: "bottom",
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Tự động mở menu trên mobile nếu nó đang đóng
                    const trigger = document.getElementById('nav-member-mobile');
                    if (trigger) trigger.click();
                }
            }
        ] as const;

        const commonSteps = [
            {
                element: '#btn-order',
                popover: {
                    title: 'Đặt món ngay',
                    description: `
                        <div class="flex flex-col items-center gap-3">
                            <img src="/images/scanqr.jpg" alt="Quét mã QR" class="w-40 h-40 object-cover rounded-lg border-2 border-primary shadow-md" />
                            <p class="text-sm font-medium text-center">Tiến hành quét mã QR để order món tại bàn một cách nhanh chóng!</p>
                        </div>
                    `,
                    side: "top",
                    align: 'center'
                }
            }
        ] as const;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            nextBtnText: 'Tiếp theo',
            prevBtnText: 'Quay lại',
            doneBtnText: 'Hoàn tất',
            steps: [...(isMobile ? mobileSteps : desktopSteps), ...commonSteps] as any,
            onDestroyed: () => {
                localStorage.setItem('onboarding-guided', 'true');
            }
        });

        const timer = setTimeout(() => {
            driverObj.drive();
            hasRun.current = true;
        }, 1500);

        return () => clearTimeout(timer);
    }, [user]);

    return null;
}
