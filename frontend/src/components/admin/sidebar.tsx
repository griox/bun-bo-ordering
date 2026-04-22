'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Utensils,
    ClipboardList,
    Settings,
    LogOut,
    Users,
    Ticket
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
    { title: 'Người dùng', icon: Users, href: '/admin/users' },
    { title: 'Khuyến mãi', icon: Ticket, href: '/admin/promotions' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 surface-low border-r border-border/5 flex flex-col h-full shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-10 flex items-center justify-between border-b border-border/5 mb-6">
                <Link href="/" className="flex flex-col gap-1 group" onClick={onClose}>
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl surface-base border border-border/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                            <Utensils className="size-5 text-primary" />
                        </div>
                        <span className="font-black text-xl text-primary leading-none tracking-tighter uppercase italic transition-colors">BÚN BÒ</span>
                    </div>
                </Link>

                {/* Close button for mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-11 rounded-2xl border border-border/10 hover:surface-highest transition-all text-muted-foreground"
                    onClick={onClose}
                >
                    <X className="size-5" />
                </Button>
            </div>

            <div className="px-6 mb-6 flex-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] px-4 mb-6">MỤC LỤC QUẢN TRỊ</p>
                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all cursor-pointer group relative overflow-hidden",
                                    isActive
                                        ? "surface-highest text-primary shadow-sm"
                                        : "text-muted-foreground hover:surface-base hover:text-foreground"
                                )}>
                                    <item.icon className={cn("size-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "opacity-40 group-hover:opacity-100")} />
                                    <span className="font-black text-[10px] tracking-widest uppercase">{item.title}</span>

                                    {isActive && (
                                        <div className="absolute right-5 w-2 h-2 rounded-full bg-primary shadow-sm" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-border/5">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-4 text-muted-foreground/40 font-black text-[10px] tracking-widest hover:text-primary hover:surface-base transition-all rounded-2xl py-7 px-5"
                    onClick={() => logout()}
                >
                    <LogOut className="size-4" />
                    <span>HỆ THỐNG / ĐĂNG XUẤT</span>
                </Button>
            </div>
        </aside>
    );
}
