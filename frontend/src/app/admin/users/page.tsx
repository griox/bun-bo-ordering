'use client';

import React, { useState } from 'react';
import {
    Users,
    Search,
    Mail,
    History,
    Loader2,
} from 'lucide-react';
import { useUsers, User } from '@/hooks/useUsers';
import { useCustomerOrders, Order } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserHistoryModal } from '@/components/admin/UserHistoryModal';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { format } from 'date-fns';

export default function AdminUserManagement() {
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const pageSize = 10;

    const { data: pagedData, isLoading: usersLoading } = useUsers(page + 1, pageSize, searchQuery);
    const users = pagedData?.items || [];
    const totalCount = pagedData?.totalCount || 0;


    // Reset to first page on search
    React.useEffect(() => {
        setPage(0);
    }, [searchQuery]);

    // Modals state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch orders for the selected user
    const { data: userOrders = [], isLoading: ordersLoading } = useCustomerOrders(selectedUser?.id || undefined);


    const handleViewHistory = (user: User) => {
        setSelectedUser(user);
        setIsHistoryModalOpen(true);
    };

    const handleViewOrderDetail = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderDetailModalOpen(true);
    };
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-10 pb-10 font-mono">
            {/* Header section synchronized with other admin pages */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-[#ff4d4f]/10 rounded-2xl flex items-center justify-center border border-[#ff4d4f]/20 shadow-sm animate-in fade-in zoom-in duration-500">
                        <Users className="size-8 text-[#ff4d4f]" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-black mb-0.5 uppercase tracking-tighter">Người dùng</h2>
                        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Quản lý thông tin & lịch sử giao dịch khách hàng</p>
                    </div>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 bg-gray-50/30 border-b border-gray-100 flex flex-col lg:flex-row gap-6 justify-between items-center">

                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-300" />
                        <Input
                            placeholder="TÌM TÊN, EMAIL..."
                            className="h-14 pl-12 pr-6 border border-gray-100 rounded-2xl bg-white font-black focus:border-[#ff4d4f] transition-all uppercase text-[10px] tracking-[0.2em]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="w-[120px] font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">ID</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Thông tin tài khoản</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Vai trò / Role</TableHead>
                                <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Ngày gia nhập</TableHead>
                                <TableHead className="text-right font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Loader2 className="size-12 animate-spin text-primary" />
                                            <p className="font-bold uppercase text-xs">Đang truy xuất dữ liệu người dùng...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Search className="size-16" />
                                            <p className="text-2xl font-bold uppercase">Không tìm thấy kết quả</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer"
                                        onClick={() => handleViewHistory(user)}
                                    >
                                        <TableCell className="p-6">
                                            <div className="font-black text-black bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 inline-block text-[11px] tracking-tighter shadow-sm uppercase group-hover:bg-white group-hover:border-[#ff4d4f]/20 transition-all">
                                                ID-{user.id.slice(0, 4)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-black text-black text-lg uppercase tracking-tighter group-hover:text-[#ff4d4f] transition-colors">
                                                    {user.username}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                                                    <Mail className="size-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <Badge
                                                variant="outline"
                                                className={`font-black uppercase text-[9px] px-3 py-1.5 rounded-xl border transition-all shadow-sm ${user.role === 'Admin'
                                                    ? 'bg-purple-50/50 text-purple-600 border-purple-100'
                                                    : 'bg-blue-50/50 text-blue-600 border-blue-100'
                                                    }`}
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-6 text-center">
                                            <div className="font-black text-black text-sm">{format(new Date(user.createdAt), "dd/MM/yyyy")}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(user.createdAt), "HH:mm")}</div>
                                        </TableCell>
                                        <TableCell className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-11 rounded-xl bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-[#ff4d4f] hover:border-[#ff4d4f]/20 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleViewHistory(user); }}
                                                >
                                                    <History className="size-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest italic">
                        Trang <b>{page + 1}</b> / <b>{totalPages || 1}</b> | Tổng cộng <b>{totalCount}</b> thành viên
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50 hover:text-[#ff4d4f]"
                            disabled={page === 0}
                            onClick={() => setPage((prev: number) => Math.max(0, prev - 1))}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50 hover:text-[#ff4d4f]"
                            disabled={!pagedData || (page + 1) * pageSize >= totalCount}
                            onClick={() => setPage((prev: number) => prev + 1)}
                        >
                            Tiếp theo
                        </Button>
                    </div>
                </div>
            </Card>

            {/* History Modal */}
            <UserHistoryModal
                user={selectedUser}
                orders={userOrders}
                isLoading={ordersLoading}
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                onViewOrder={handleViewOrderDetail}
            />

            {/* Nested Order Detail Modal */}
            <OrderDetailModal
                isOpen={isOrderDetailModalOpen}
                onClose={() => setIsOrderDetailModalOpen(false)}
                order={selectedOrder}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}
