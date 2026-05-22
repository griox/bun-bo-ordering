import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { UnreadOrder } from '@/hooks/useUnreadOrders';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderDetailsSheetProps {
    order: UnreadOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderDetailsSheet({ order, open, onOpenChange }: OrderDetailsSheetProps) {
    if (!order) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md bg-white border-l border-gray-100 overflow-y-auto">
                <SheetHeader className="border-b border-gray-50 pb-6 mb-6">
                    <SheetTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
                        <span>Chi tiết đơn hàng</span>
                        <span className="text-sm font-bold bg-gray-100 text-gray-900 px-3 py-1 rounded-full">
                            Bàn {order.tableName}
                        </span>
                    </SheetTitle>
                    <SheetDescription className="text-xs font-medium text-gray-500 mt-2">
                        {format(new Date(order.createdAt), "HH:mm - dd/MM/yyyy", { locale: vi })}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Thông tin thanh toán</h4>
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-gray-500">Hình thức</span>
                                <span className="text-gray-900 font-bold bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                                    {order.paymentMethod || 'Không rõ'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-gray-500">Trạng thái</span>
                                <span className={`font-bold ${order.status === 1 || order.status === 4 ? 'text-green-500' : 'text-orange-500'}`}>
                                    {order.status === 1 ? "Đã thanh toán" : order.status === 4 ? "Hoàn thành" : "Đang xử lý"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Danh sách món</h4>
                        <div className="space-y-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                                            {item.quantity}x
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 leading-tight">
                                            {item.productName}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-500">Tổng cộng</span>
                            <span className="text-xl font-black text-red-500">
                                {order.totalAmount.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
