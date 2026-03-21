'use client';

import React from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { Toaster } from '@/components/ui/sonner';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Initialize real-time listener for all admin pages
    useRealtime();

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <AdminAuthGuard>
            <div className="flex h-screen bg-background overflow-hidden relative">
                {/* Decorative background pattern like landing page */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/parchment.png')" }}>
                </div>

                {/* Sidebar Overlay for Mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex flex-col flex-1 overflow-hidden relative z-10 w-full">
                    <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-7xl mx-auto h-full w-full">
                            {children}
                        </div>
                    </main>
                </div>
                <Toaster position="top-right" />
            </div>
        </AdminAuthGuard>
    );
}
