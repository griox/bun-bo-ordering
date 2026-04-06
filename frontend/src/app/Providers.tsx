
'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { useRealtime } from '@/hooks/useRealtime';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

// Suppression logic for harmless but annoying SignalR errors in dev mode
if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
        const msg = args.join(' ');
        if (msg.includes('negotiation stopped') ||
            msg.includes('connection was stopped') ||
            msg.includes('Status code \'502\'') ||
            msg.includes('Bad Gateway') ||
            msg.includes('Failed to complete negotiation')) {
            return;
        }
        originalError.apply(console, args);
    };
}

function RealtimeInit() {
    useRealtime();
    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
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
            <RealtimeInit />
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                {children}
            </GoogleOAuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
