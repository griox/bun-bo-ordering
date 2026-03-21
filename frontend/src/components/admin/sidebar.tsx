'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Utensils,
    ClipboardList,
    ChefHat,
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
    { title: 'Nhà bếp', icon: ChefHat, href: '/admin/kitchen' },
    { title: 'Quản lý món ăn', icon: Utensils, href: '/admin/dishes' },
    { title: 'Quản lý bàn', icon: Settings, href: '/admin/tables' }, // Changed icon to Settings or Grid
    { title: 'Đơn hàng', icon: ClipboardList, href: '/admin/orders' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-paper/95 backdrop-blur-xl border-r-4 border-text flex flex-col h-full shadow-[8px_0px_0px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-8 flex items-center justify-between">
                <Link href="/" className="flex flex-col gap-0.5 group" onClick={onClose}>
                    <span className="font-display text-2xl text-text leading-none transition-colors group-hover:text-primary uppercase tracking-tight">BÚN BÒ</span>
                    <span className="font-display text-[10px] text-primary leading-none tracking-[0.2em] font-bold">CÀ PHÊ PHỐ</span>
                </Link>

                {/* Close button for mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-10 rounded-xl border-2 border-text/10"
                    onClick={onClose}
                >
                    <X className="size-6" />
                </Button>
            </div>

            <div className="px-4 mb-4">
                <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest px-4 mb-4">Quản trị</p>
                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-white shadow-[4px_4px_0px_#2D2D2D] translate-y-[-2px] border-2 border-text"
                                        : "text-text/70 hover:bg-black/5 hover:text-text"
                                )}>
                                    <item.icon className={cn("size-5", isActive ? "text-white" : "group-hover:text-primary")} />
                                    <span className="font-bold font-display text-sm tracking-wide">{item.title.toUpperCase()}</span>

                                    {isActive && (
                                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-text/5">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-text/60 font-display font-bold text-xs hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    onClick={() => logout()}
                >
                    <LogOut className="size-4" />
                    <span>ĐĂNG XUẤT</span>
                </Button>
            </div>
        </aside>
    );
}
