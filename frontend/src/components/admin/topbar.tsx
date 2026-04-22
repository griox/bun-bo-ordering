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
        <header className="h-20 surface-low border-b border-border/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-6">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden size-11 surface-base border border-border/10 text-foreground/60 hover:surface-highest transition-all shadow-sm rounded-2xl"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-5" />
                </Button>

                <h1 className="hidden sm:block text-2xl font-black text-primary tracking-tighter uppercase italic">Quản Trị</h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative size-11 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center bg-[#ff4d4f] text-white border-2 border-white rounded-full text-[9px] font-black shadow-lg">
                                    {unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-96 p-0 border border-gray-100 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-5 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                                <span className="font-bold text-xs tracking-widest uppercase text-gray-500">Thông báo hệ thống</span>
                                {unreadCount > 0 && <Badge variant="secondary" className="bg-[#ff4d4f] text-white text-[9px] px-2 shadow-sm font-black border-none">{unreadCount} MỚI</Badge>}
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <ScrollArea className="h-[400px]">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Bell className="size-8 text-black/10 mx-auto mb-3" />
                                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">No active logs</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((order, idx: number) => (
                                        <Link key={idx} href="/admin/orders">
                                            <DropdownMenuItem className="p-5 flex flex-col items-start gap-2 cursor-pointer hover:bg-black/5 transition-colors focus:bg-black/5 outline-none">
                                                <div className="flex justify-between w-full items-center">
                                                    <span className="font-bold text-sm">ORDER_LOG #{order.tableNumber}</span>
                                                    <span className="text-[9px] font-bold text-black/30 uppercase">
                                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-black/60 leading-relaxed">
                                                    {order.items?.map((i: OrderItem) => `${i.quantity}x ${i.productName}`).join(', ') || 'Processing system event...'}
                                                </p>
                                            </DropdownMenuItem>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <DropdownMenuSeparator className="m-0 bg-gray-100" />
                        <Link href="/admin/orders">
                            <div className="p-4 text-center text-[10px] text-gray-500 font-black hover:bg-[#ff4d4f] hover:text-white cursor-pointer transition-all uppercase tracking-[0.2em] bg-white border-t border-gray-100">
                                Xem tất cả lịch sử log
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-10 w-0.5 bg-black/5 rounded-full mx-1" />

                <div className="flex items-center gap-4 pl-2 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-black text-black uppercase leading-none mb-1">{user?.username || 'ROOT'}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">{user?.role || 'SYS_ADMIN'}</p>
                    </div>
                    <div className="size-11 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center shadow-sm overflow-hidden group-hover:border-gray-300 transition-all">
                        <User className="size-6 group-hover:scale-110 transition-transform text-gray-600" />
                    </div>
                </div>
            </div>
        </header>
    );
}
