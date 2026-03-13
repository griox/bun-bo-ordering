'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useKitchenStore } from '@/store/useKitchenStore';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export function Topbar() {
    const { unreadCount, notifications, markAsRead } = useKitchenStore();
    const { user } = useAuthStore();

    return (
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 bg-neutral-100 px-4 py-2 rounded-full w-96">
                <Search className="w-4 h-4 text-neutral-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    className="bg-transparent border-none outline-none text-sm w-full"
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
                        <Bell className="w-5 h-5 text-neutral-600" />
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center bg-red-500 text-white border-2 border-white">
                                {unreadCount}
                            </Badge>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0">
                        <DropdownMenuLabel className="p-4 flex items-center justify-between">
                            <span>Thông báo mới</span>
                            {unreadCount > 0 && <span className="text-xs text-blue-500 font-normal">{unreadCount} đơn mới</span>}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="m-0" />
                        <ScrollArea className="h-80">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">
                                    Không có thông báo mới
                                </div>
                            ) : (
                                notifications.map((order, idx) => (
                                    <Link key={idx} href="/admin/kitchen">
                                        <DropdownMenuItem className="p-4 flex flex-col items-start gap-1 cursor-pointer">
                                            <div className="flex justify-between w-full">
                                                <span className="font-bold">Bàn #{order.tableNumber}</span>
                                                <span className="text-[10px] text-neutral-400">
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 truncate w-full">
                                                {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                            </p>
                                        </DropdownMenuItem>
                                    </Link>
                                ))
                            )}
                        </ScrollArea>
                        <DropdownMenuSeparator className="m-0" />
                        <Link href="/admin/kitchen">
                            <div className="p-3 text-center text-sm text-primary font-medium hover:bg-neutral-50 cursor-pointer">
                                Xem tất cả trong bếp
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-px bg-neutral-200" />

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-neutral-700">{user?.username || 'Admin'}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{user?.role || 'Quản trị viên'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center border-2 border-neutral-100 overflow-hidden">
                        <User className="w-6 h-6 text-neutral-400" />
                    </div>
                </div>
            </div>
        </header>
    );
}
