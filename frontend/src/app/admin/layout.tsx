'use client';

import React from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Initialize real-time listener for all admin pages
    useRealtime();

    return (
        <div className="flex h-screen bg-neutral-50">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
