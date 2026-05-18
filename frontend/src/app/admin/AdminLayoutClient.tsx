'use client';

import React from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { Toaster } from '@/components/ui/sonner';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <AdminAuthGuard>
            <div className="flex h-screen bg-gray-50/50 overflow-hidden relative admin-page">
                {/* Sidebar Overlay for Mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden transition-all"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex flex-col flex-1 overflow-hidden relative z-10 w-full">
                    <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
                        <div className="max-w-7xl mx-auto h-full w-full">
                            {children}
                        </div>
                    </main>
                </div>
                <Toaster position="top-right" richColors />
            </div>
        </AdminAuthGuard>
    );
}
