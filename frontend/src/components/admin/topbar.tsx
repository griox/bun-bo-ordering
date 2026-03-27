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
        <header className="h-24 bg-white border-b-2 border-black px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all font-mono">
            <div className="flex items-center gap-6 flex-1">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden size-12 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] bg-white text-black hover:bg-black hover:text-white transition-all active:translate-y-px active:shadow-none"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-6" />
                </Button>

                <div className="hidden sm:flex items-center gap-4 bg-black/[0.03] px-6 py-3 rounded-xl w-full max-w-md border-2 border-black/5 focus-within:border-black/20 focus-within:bg-white transition-all group">
                    <Search className="size-4 text-black/30 group-focus-within:text-black transition-colors" />
                    <input
                        type="text"
                        placeholder="TRUY VẤN DỮ LIỆU..."
                        className="bg-transparent border-none outline-none text-[11px] w-full font-bold tracking-widest placeholder:text-black/20"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="relative size-12 border-2 border-transparent hover:border-black/10 rounded-xl transition-all">
                            <Bell className="w-5 h-5 text-black" />
                            {unreadCount > 0 && (
                                <Badge className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 min-w-[1.4rem] h-[1.4rem] flex items-center justify-center bg-red-500 text-white border-2 border-white rounded-full text-[10px] font-bold">
                                    {unreadCount}
                                </Badge>
                            )}
                        </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-96 p-0 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-5 flex items-center justify-between bg-black/[0.02] border-b-2 border-black/5">
                                <span className="font-bold text-xs tracking-widest uppercase">System Notifications</span>
                                {unreadCount > 0 && <Badge variant="secondary" className="bg-black text-white text-[9px] px-2">{unreadCount} NEW</Badge>}
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <ScrollArea className="h-[400px]">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Bell className="size-8 text-black/10 mx-auto mb-3" />
                                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">No active logs</p>
                                </div>
                            ) : (
                                <div className="divide-y-2 divide-black/5">
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
                        <DropdownMenuSeparator className="m-0 bg-black/5" />
                        <Link href="/admin/orders">
                            <div className="p-4 text-center text-[10px] text-black font-bold hover:bg-black hover:text-white cursor-pointer transition-all uppercase tracking-[0.2em] bg-white border-t-2 border-black/5">
                                Open Main Log Terminal
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-10 w-0.5 bg-black/5 rounded-full mx-1" />

                <div className="flex items-center gap-4 pl-2 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-bold text-black uppercase leading-none mb-1.5">{user?.username || 'ROOT'}</p>
                        <p className="text-[9px] font-bold text-black/30 uppercase tracking-[0.2em] leading-none">{user?.role || 'SYS_ADMIN'}</p>
                    </div>
                    <div className="size-12 rounded-xl bg-black text-white flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] overflow-hidden group-hover:translate-y-[-2px] transition-all">
                        <User className="size-6 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            </div>
        </header>
    );
}
