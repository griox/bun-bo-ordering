'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Utensils,
    ClipboardList,
    Settings,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const menuItems = [
    { title: 'Bảng điều khiển', icon: LayoutDashboard, href: '/admin' },
    { title: 'Quản lý món ăn', icon: Utensils, href: '/admin/dishes' },
    { title: 'Quản lý bàn', icon: Settings, href: '/admin/tables' },
    { title: 'Đơn hàng', icon: ClipboardList, href: '/admin/orders' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-[#1F2937] border-r border-white/5 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex font-mono",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-8 flex items-center justify-between border-b border-white/5 mb-4 bg-[#1F2937]">
                <Link href="/" className="flex flex-col gap-0.5 group" onClick={onClose}>
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-[#ff4d4f] flex items-center justify-center border-2 border-white/10 shadow-lg group-hover:rotate-12 transition-all">
                            <Utensils className="size-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-white leading-none tracking-tighter uppercase transition-colors group-hover:text-white/80">BÚN BÒ</span>
                    </div>
                </Link>

                {/* Close button for mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-10 rounded-xl border border-white/20 hover:border-white transition-all text-white hover:bg-white/10"
                    onClick={onClose}
                >
                    <X className="size-6 shadow-sm" />
                </Button>
            </div>

            <div className="px-4 mb-4 flex-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-4 mb-4">Mục lục quản trị</p>
                <nav className="space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer group relative overflow-hidden",
                                    isActive
                                        ? "bg-[#ff4d4f] text-white shadow-lg translate-y-[-1px]"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}>
                                    <item.icon className={cn("size-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                                    <span className="font-bold text-xs tracking-wider uppercase">{item.title}</span>

                                    {isActive && (
                                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-white/40 font-bold text-[10px] tracking-widest hover:text-white hover:bg-white/5 transition-all rounded-xl py-6"
                    onClick={() => logout()}
                >
                    <LogOut className="size-4" />
                    <span>HỆ THỐNG / ĐĂNG XUẤT</span>
                </Button>
            </div>
        </aside>
    );
}
