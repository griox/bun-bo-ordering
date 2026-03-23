'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
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
import { Menu } from 'lucide-react';

interface TopbarProps {
    onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
    const { unreadCount, notifications, markAsRead } = useOrderNotificationStore();
    const { user } = useAuthStore();

    return (
        <header className="h-20 bg-white backdrop-blur-md border-b-2 border-black px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-11 rounded-xl border-2 border-black shadow-[3px_3px_0px_#333] bg-black text-white hover:bg-black/90"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-6" />
                </Button>

                <div className="hidden sm:flex items-center gap-4 bg-black/5 px-6 py-2.5 rounded-full w-full max-w-md border border-black/10 focus-within:border-black/50 transition-all">
                    <Search className="size-4 text-black/40" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhanh..."
                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
                        <Bell className="w-5 h-5 text-neutral-600" />
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center bg-black text-white border-2 border-white">
                                {unreadCount}
                            </Badge>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-4 flex items-center justify-between font-display">
                                <span>Thông báo mới</span>
                                {unreadCount > 0 && <span className="text-xs text-black font-normal">{unreadCount} đơn mới</span>}
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="m-0 bg-black/10" />
                        <ScrollArea className="h-80">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">
                                    Không có thông báo mới
                                </div>
                            ) : (
                                notifications.map((order, idx: number) => (
                                    <Link key={idx} href="/admin/orders">
                                        <DropdownMenuItem className="p-4 flex flex-col items-start gap-1 cursor-pointer hover:bg-black/5">
                                            <div className="flex justify-between w-full">
                                                <span className="font-bold">Bàn #{order.tableNumber}</span>
                                                <span className="text-[10px] text-neutral-400">
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 truncate w-full">
                                                {order.items?.map((i: OrderItem) => `${i.quantity}x ${i.productName}`).join(', ') || 'Có đơn hàng mới'}
                                            </p>
                                        </DropdownMenuItem>
                                    </Link>
                                ))
                            )}
                        </ScrollArea>
                        <DropdownMenuSeparator className="m-0 bg-black/10" />
                        <Link href="/admin/orders">
                            <div className="p-3 text-center text-sm text-black font-bold hover:bg-black/5 cursor-pointer uppercase tracking-wider font-display">
                                Xem tất cả đơn hàng
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-10 w-0.5 bg-black/10 rounded-full mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-display font-bold text-black uppercase leading-none mb-1">{user?.username || 'Admin'}</p>
                        <p className="text-[10px] font-bold text-black uppercase tracking-[0.15em] leading-none opacity-60">{user?.role || 'Quản trị viên'}</p>
                    </div>
                    <div className="size-11 rounded-xl bg-black text-white flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden group hover:translate-y-[-1px] transition-all cursor-pointer">
                        <User className="size-6 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            </div>
        </header>
    );
}
