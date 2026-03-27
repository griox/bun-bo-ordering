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
            "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-2 border-black flex flex-col h-full shadow-[8px_0px_0px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex font-mono",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-8 flex items-center justify-between border-b-2 border-black/5 mb-4">
                <Link href="/" className="flex flex-col gap-0.5 group" onClick={onClose}>
                    <span className="font-bold text-2xl text-black leading-none transition-colors group-hover:text-black/70 uppercase tracking-tighter">BÚN BÒ</span>
                    <span className="text-[9px] text-black/40 leading-none tracking-[0.3em] font-bold uppercase">ADMIN PANEL v1.0</span>
                </Link>

                {/* Close button for mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-10 rounded-xl border-2 border-black/10 hover:border-black transition-all"
                    onClick={onClose}
                >
                    <X className="size-6 text-black" />
                </Button>
            </div>

            <div className="px-4 mb-4 flex-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-4 mb-4">Mục lục quản trị</p>
                <nav className="space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer group relative overflow-hidden border-2",
                                    isActive
                                        ? "bg-black text-white border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] translate-y-[-2px]"
                                        : "text-black/60 border-transparent hover:bg-black/5 hover:text-black hover:border-black/5"
                                )}>
                                    <item.icon className={cn("size-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "group-hover:text-black")} />
                                    <span className="font-bold text-xs tracking-wider uppercase">{item.title}</span>

                                    {isActive && (
                                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t-2 border-black/5 bg-black/[0.01]">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-black/40 font-bold text-[10px] tracking-widest hover:text-red-500 hover:bg-red-50 transition-all rounded-xl py-6"
                    onClick={() => logout()}
                >
                    <LogOut className="size-4" />
                    <span>HỆ THỐNG / ĐĂNG XUẤT</span>
                </Button>
            </div>
        </aside>
    );
}
