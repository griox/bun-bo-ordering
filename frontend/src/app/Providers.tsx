'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useLayoutEffect } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function Providers({ children }: { children: React.ReactNode }) {
    // Suppress annoying SES warnings from browser extensions early in the lifecycle
    useLayoutEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const suppressPattern = /SES Removing unpermitted intrinsics/;

            const wrap = (method: 'log' | 'warn' | 'error') => {
                const orig = console[method];
                // Prevent double wrapping or wrapping non-functions
                if (typeof orig !== 'function' || (orig as { __is_suppressed?: boolean }).__is_suppressed) return;

                const wrapper = function suppressedConsole(...args: unknown[]) {
                    if (args.some(arg => typeof arg === 'string' && suppressPattern.test(arg))) {
                        return;
                    }
                    return (orig as (...args: unknown[]) => void).apply(console, args);
                };
                (wrapper as { __is_suppressed?: boolean }).__is_suppressed = true;
                console[method] = wrapper;
            };

            wrap('error');
            wrap('log');
            wrap('warn');
        }
    }, []);

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                {children}
            </GoogleOAuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
