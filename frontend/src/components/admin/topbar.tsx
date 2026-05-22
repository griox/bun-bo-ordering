'use client';

import React from 'react';
import { Bell, User, Menu, Receipt } from 'lucide-react';
import { OrderItem } from '@/store/useOrderNotificationStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuGroup,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useUnreadOrders, UnreadOrder } from '@/hooks/useUnreadOrders';
import { OrderDetailsSheet } from '@/components/admin/OrderDetailsSheet';

interface TopbarProps {
    onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
    const { user } = useAuthStore();
    const { unreadOrders, markAsRead, isMarkingAsRead } = useUnreadOrders();
    const [selectedOrder, setSelectedOrder] = React.useState<UnreadOrder | null>(null);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    const unreadCount = unreadOrders?.length || 0;

    const handleOrderClick = (order: UnreadOrder) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
        if (order.status !== 4) {
            markAsRead(order.id);
        }
    };

    return (
        <>
        <header className="h-16 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"
                    onClick={onToggleSidebar}
                >
                    <Menu className="size-5" />
                </Button>

                <h1 className="hidden md:block text-lg font-bold text-gray-900 tracking-tight">Trang quản trị</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 border border-gray-100 shadow-2xl rounded-2xl overflow-hidden bg-white animate-in slide-in-from-top-1 duration-200">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="p-4 bg-gray-50/80 border-b border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Thông báo mới</span>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter animate-bounce">
                                            {unreadCount} đơn mới
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <ScrollArea className="h-[380px]">
                            {unreadCount === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <Bell className="size-8 text-gray-200" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Không có thông báo mới</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {unreadOrders.map((order) => (
                                        <DropdownMenuItem 
                                            key={order.id} 
                                            onClick={() => handleOrderClick(order)}
                                            className="p-4 flex flex-col items-start gap-2 cursor-pointer hover:bg-red-50/30 transition-all focus:bg-red-50/30 outline-none group border-l-4 border-transparent hover:border-red-500"
                                        >
                                            <div className="flex justify-between w-full items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                                        <Receipt className="size-4 text-gray-400 group-hover:text-red-500" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-xs text-gray-900">BÀN {order.tableName}</span>
                                                        <span className="size-1.5 bg-red-500 rounded-full" />
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-red-400">
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pl-10">
                                                Đã đặt: {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                            </p>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <Link href="/admin/orders">
                            <div className="p-3.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-all bg-gray-50/50 border-t border-gray-100 hover:bg-white cursor-pointer">
                                Xem tất cả lịch sử đơn hàng
                            </div>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-gray-100 mx-1" />

                <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-gray-400 font-medium">{user?.role || 'Administrator'}</p>
                    </div>
                    <div className="min-h-[44px] min-w-[44px] rounded-full bg-gray-100 text-gray-500 flex items-center justify-center border-2 border-transparent group-hover:border-primary/20 transition-all overflow-hidden">
                        <User className="size-5" />
                    </div>
                </div>
            </div>
        </header>
        <OrderDetailsSheet 
            order={selectedOrder} 
            open={isSheetOpen} 
            onOpenChange={setIsSheetOpen} 
        />
        </>
    );
}
