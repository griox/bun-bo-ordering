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

const menuItems = [
    { title: 'Bảng điều khiển', icon: LayoutDashboard, href: '/admin' },
    { title: 'Nhà bếp', icon: ChefHat, href: '/admin/kitchen' },
    { title: 'Quản lý món ăn', icon: Utensils, href: '/admin/dishes' },
    { title: 'Đơn hàng', icon: ClipboardList, href: '/admin/orders' },
];

export function Sidebar() {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);

    return (
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="bg-primary text-white p-1 rounded">BB</span>
                    BunBo CMS
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group",
                                isActive 
                                    ? "bg-primary text-white shadow-md" 
                                    : "text-neutral-600 hover:bg-neutral-100"
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-primary")} />
                                <span className="font-medium">{item.title}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-neutral-200">
                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-neutral-600 hover:text-red-600 hover:bg-red-50"
                    onClick={() => logout()}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </Button>
            </div>
        </aside>
    );
}
