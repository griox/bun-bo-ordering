'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuthStore();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if user is logged in and is an Admin
        if (!token || !user || user.role !== 'Admin') {
            router.push('/');
        } else {
            setIsAuthorized(true);
        }
    }, [user, token, router]);

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
