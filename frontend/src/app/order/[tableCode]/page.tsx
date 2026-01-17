'use client';

import { useTableSession } from '@/hooks/useTableSession';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrderEntryPage() {
    const params = useParams();
    const router = useRouter();
    const tableCode = params?.tableCode as string;

    const { table, session, isLoading, error } = useTableSession(tableCode);

    useEffect(() => {
        if (session) {
            // Success -> Go to Menu
            router.push(`/menu`);
        }
    }, [session, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Connecting to table...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm">
                    <div className="text-red-500 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Scan Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return null; // Redirecting...
}
