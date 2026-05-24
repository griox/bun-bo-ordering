'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

export function OnboardingGuide() {
    const { user } = useAuthStore();
    const hasRun = useRef(false);
    const t = useTranslations('Landing.Onboarding');

    useEffect(() => {
        if (user || hasRun.current) return;

        const isGuided = localStorage.getItem('onboarding-guided');
        if (isGuided) return;

        const isMobile = window.innerWidth < 768;

        const desktopSteps = [
            {
                element: '#nav-home',
                popover: { title: t('navHomeTitle'), description: t('navHomeDesc'), side: "bottom", align: 'start' }
            },
            {
                element: '#nav-menu',
                popover: { title: t('navMenuTitle'), description: t('navMenuDesc'), side: "bottom", align: 'start' }
            },
            {
                element: '#nav-about',
                popover: { title: t('navAboutTitle'), description: t('navAboutDesc'), side: "bottom", align: 'start' }
            },
            {
                element: '#nav-member-desktop',
                popover: { title: t('navMemberTitle'), description: t('navMemberDesc'), side: "bottom", align: 'end' }
            }
        ] as const;

        const mobileSteps = [
            {
                element: '#nav-member-mobile',
                popover: {
                    title: t('mobileMenuTitle'),
                    description: t('mobileMenuDesc'),
                    side: "bottom",
                    align: 'end'
                }
            },
            {
                element: '#mobile-menu',
                popover: {
                    title: t('mobileViewMenuTitle'),
                    description: t('mobileViewMenuDesc'),
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
                    title: t('orderTitle'),
                    description: `
                        <div class="flex flex-col items-center gap-3">
                            <img src="/images/scanqr.jpg" alt="Quét mã QR" class="w-40 h-40 object-cover rounded-lg border-2 border-primary shadow-md" />
                            <p class="text-sm font-medium text-center">${t('orderDesc')}</p>
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
            allowClose: false,
            overlayClickBehavior: 'nextStep',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            nextBtnText: t('nextBtnText'),
            prevBtnText: t('prevBtnText'),
            doneBtnText: t('doneBtnText'),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    }, [user, t]);

    return null;
}
