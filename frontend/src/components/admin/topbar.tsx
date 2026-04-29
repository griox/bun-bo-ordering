'use client';

import React from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { useOrderNotificationStore, OrderItem } from '@/store/useOrderNotificationStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuGroup,
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

interface TopbarProps {
    onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
    const { unreadCount, notifications, markAsRead } = useOrderNotificationStore();
    const { user } = useAuthStore();

    return (
        <header className="h-16 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-5" />
                </Button>

                <h1 className="hidden sm:block text-lg font-bold text-gray-900 tracking-tight">Trang quản trị</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative size-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 border border-gray-100 shadow-xl rounded-2xl overflow-hidden">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-4 bg-gray-50/50 border-b border-gray-100">
                                <span className="font-bold text-xs uppercase tracking-widest text-gray-500">Thông báo hệ thống</span>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <ScrollArea className="h-[320px]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="size-6 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-gray-400">Không có thông báo mới</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((order, idx: number) => (
                                        <Link key={idx} href="/admin/orders">
                                            <DropdownMenuItem className="p-4 flex flex-col items-start gap-1 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50 outline-none">
                                                <div className="flex justify-between w-full items-center">
                                                    <span className="font-bold text-xs text-gray-900">Đơn hàng #{order.tableNumber}</span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 line-clamp-1">
                                                    {order.items?.map((i: OrderItem) => `${i.quantity}x ${i.productName}`).join(', ')}
                                                </p>
                                            </DropdownMenuItem>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <Link href="/admin/orders">
                            <div className="p-3 text-center text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-gray-50/50 border-t border-gray-100">
                                Xem tất cả
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-gray-100 mx-1" />

                <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-900 leading-none mb-1">{user?.username || 'Admin'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{user?.role || 'Administrator'}</p>
                    </div>
                    <div className="size-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center border-2 border-transparent group-hover:border-primary/20 transition-all overflow-hidden">
                        <User className="size-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
