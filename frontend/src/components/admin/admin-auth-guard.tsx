'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuthStore();
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Wait for hydration
        const unsubHydrate = useAuthStore.persist.onFinishHydration(() => {
            setIsHydrated(true);
        });

        // If already hydrated (e.g. navigation)
        if (useAuthStore.persist.hasHydrated()) {
             
            setIsHydrated(true);
        }

        return () => unsubHydrate();
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        const allowedRoles = ['Admin'];

        // Check if user is logged in and has allowed role
        if (!token || !user || !allowedRoles.includes(user.role)) {
            router.push('/');
        } else {
             
            setIsAuthorized(true);
        }
    }, [user, token, router, isHydrated]);

    if (!isAuthorized) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-neutral-50 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-neutral-500 font-medium italic">Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }

    return <>{children}</>;
}
