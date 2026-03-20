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
            const filter = (orig: any) => (...args: any[]) => {
                if (args.some(arg => typeof arg === 'string' && suppressPattern.test(arg))) {
                    return;
                }
                return orig.apply(console, args);
            };

            console.error = filter(console.error);
            console.log = filter(console.log);
            console.warn = filter(console.warn);
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
