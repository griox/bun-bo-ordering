'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '@/store/useAuthStore';

export function OnboardingGuide() {
    const { user } = useAuthStore();
    const hasRun = useRef(false);

    useEffect(() => {
        // Chỉ chạy cho người dùng chưa đăng nhập
        // Và chỉ chạy một lần duy nhất trong session này
        if (user || hasRun.current) return;

        // Kiểm tra xem đã xem hướng dẫn chưa trong localStorage
        const isGuided = localStorage.getItem('onboarding-guided');
        if (isGuided) return;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            nextBtnText: 'Tiếp theo',
            prevBtnText: 'Quay lại',
            doneBtnText: 'Hoàn tất',
            steps: [
                {
                    element: '#nav-home',
                    popover: {
                        title: 'Trang chủ',
                        description: 'Chào mừng bạn đến với Bún Bò & Cà Phê Phố! Nơi bắt đầu hành trình ẩm thực của bạn.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#nav-menu',
                    popover: {
                        title: 'Thực đơn',
                        description: 'Khám phá danh sách các món ăn đậm đà hương vị biển và phong cách phố.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#nav-about',
                    popover: {
                        title: 'Về chúng tôi',
                        description: 'Tìm hiểu về câu chuyện và tâm huyết đằng sau mỗi tô bún bò.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#nav-member',
                    popover: {
                        title: 'Thành viên',
                        description: 'Đăng ký/Đăng nhập để quản lý giỏ hàng của bạn và xem lịch sử mua hàng dễ dàng.',
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#btn-order',
                    popover: {
                        title: 'Đặt món ngay',
                        description: `
                            <div class="flex flex-col items-center gap-3">
                                <img src="/images/scanqr.jpg" alt="Quét mã QR" class="w-40 h-40 object-cover rounded-lg border-2 border-primary shadow-md" />
                                <p class="text-sm font-medium text-center">Quét mã QR này để order món tại bàn một cách nhanh chóng!</p>
                            </div>
                        `,
                        side: "top",
                        align: 'center'
                    }
                }
            ],
            onDestroyed: () => {
                localStorage.setItem('onboarding-guided', 'true');
            }
        });

        // Đợi một chút để các phần tử DOM ổn định
        const timer = setTimeout(() => {
            driverObj.drive();
            hasRun.current = true;
        }, 1000);

        return () => clearTimeout(timer);
    }, [user]);

    return null;
}
