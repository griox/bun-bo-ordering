import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDevice } from '@/hooks/useDevice';

describe('useDevice', () => {
    const originalUserAgent = navigator.userAgent;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
    });

    const setUserAgent = (ua: string) => {
        Object.defineProperty(navigator, 'userAgent', {
            value: ua,
            configurable: true,
        });
    };

    it('identifies desktop browser correctly', () => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(false);
        expect(result.current.isInAppBrowser).toBe(false);
    });

    it('identifies mobile browser correctly (iPhone)', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');

        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isInAppBrowser).toBe(false);
    });

    it('identifies mobile browser correctly (Android)', () => {
        setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');

        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isInAppBrowser).toBe(false);
    });

    it('identifies Zalo in-app browser correctly', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Zalo/23.11.01');

        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isInAppBrowser).toBe(true);
    });

    it('identifies Facebook in-app browser correctly (FBAN)', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/445.0.0.41.116;FBBV/545084931;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.2;FBSS/3;FBOP/5;FBCR/;FBID/phone;FBLC/en_US;FBOP/5;FBRV/0]');

        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isInAppBrowser).toBe(true);
    });

    it('identifies Instagram in-app browser correctly', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 311.0.0.27.117');

        const { result } = renderHook(() => useDevice());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isInAppBrowser).toBe(true);
    });
});
