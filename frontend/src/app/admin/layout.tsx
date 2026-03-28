'use client';

import React from 'react';

import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { Toaster } from '@/components/ui/sonner';
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <AdminAuthGuard>
            <div className="flex h-screen bg-[#F9FAFB] overflow-hidden relative font-mono">
                {/* Clean background */}
                <div className="absolute inset-0 bg-gray-50/50 pointer-events-none"></div>

                {/* Sidebar Overlay for Mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-500 ease-in-out"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex flex-col flex-1 overflow-hidden relative z-10 w-full border-l border-gray-100">
                    <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth">
                        <div className="max-w-7xl mx-auto h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </main>
                </div>
                <Toaster position="top-right" richColors />
            </div>
        </AdminAuthGuard>
    );
}
