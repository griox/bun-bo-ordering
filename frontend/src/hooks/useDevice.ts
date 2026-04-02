'use client';

import { useState, useEffect } from 'react';

export function useDevice() {
    const [isMobile, setIsMobile] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

        // Basic mobile detection
        const mobile = /android|iphone|ipad|ipod/i.test(ua);
        setIsMobile(mobile);

        // In-app browser detection (Zalo, Facebook, etc.)
        const inApp = /Zalo|FBAN|FBAV|Instagram|Line/i.test(ua);
        setIsInAppBrowser(inApp);
    }, []);

    return { isMobile, isInAppBrowser };
}
