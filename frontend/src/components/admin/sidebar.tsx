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
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col h-full transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <Link href="/" className="flex items-center gap-2 group" onClick={onClose}>
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Utensils className="size-4 text-primary" />
                    </div>
                    <span className="font-bold text-lg text-gray-900 tracking-tight">Bún Bò Admin</span>
                </Link>

                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-8 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    <X className="size-5" />
                </Button>
            </div>

            <div className="px-4 py-6 flex-1 overflow-y-auto">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Menu</p>
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group",
                                    isActive
                                        ? "bg-primary/5 text-primary"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}>
                                    <item.icon className={cn("size-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                                    <span className="font-medium text-sm">{item.title}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl py-6"
                    onClick={() => logout()}
                >
                    <LogOut className="size-4" />
                    <span className="font-medium text-sm">Đăng xuất</span>
                </Button>
            </div>
        </aside>
    );
}
