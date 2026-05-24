'use client';

import React, { useState } from 'react';

import {
    Search,
    Mail,
    History,
    Loader2,
    Ban,
    Trash2,
    Unlock,
    AlertCircle
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/pagination';
import { useUsers, User, useBlacklistUser, useRemoveBlacklist, useDeleteUser } from '@/hooks/useUsers';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { UserHistoryModal } from '@/components/admin/UserHistoryModal';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

export default function AdminUserManagement() {
    const t = useTranslations('Users');
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const pageSize = 6;

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

    // Dialogs state
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
    const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToAction, setUserToAction] = useState<User | null>(null);
    const [banReason, setBanReason] = useState('Vi phạm quy định hệ thống');

    // Hooks
    const blacklistMutation = useBlacklistUser();
    const removeBlacklistMutation = useRemoveBlacklist();
    const deleteMutation = useDeleteUser();

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

    const handleBanUser = async () => {
        if (!userToAction) return;
        await blacklistMutation.mutateAsync({ userId: userToAction.id, reason: banReason });
        setIsBanDialogOpen(false);
        setUserToAction(null);
    };

    const handleRemoveBan = async () => {
        if (!userToAction) return;
        await removeBlacklistMutation.mutateAsync(userToAction.id);
        setIsUnbanDialogOpen(false);
        setUserToAction(null);
    };

    const handleDeleteUser = async () => {
        if (!userToAction) return;
        await deleteMutation.mutateAsync(userToAction.id);
        setIsDeleteDialogOpen(false);
        setUserToAction(null);
    };
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder={t('searchPlaceholder')}
                            className="h-9 pl-10 pr-4 border-gray-200 rounded-xl bg-white text-sm focus:border-primary focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="custom-scrollbar">
                    {/* Mobile Card List View */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                        {usersLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-40">
                                <Loader2 className="size-12 animate-spin text-primary" />
                                <p className="font-bold uppercase text-xs">{t('loading')}</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-4 opacity-40">
                                <Search className="size-12" />
                                <h3 className="text-base font-black text-gray-800 uppercase">{t('noResults')}</h3>
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user.id} className="flex flex-col gap-3 p-4 rounded-[1.5rem] border-2 border-gray-100 bg-white shadow-sm relative group cursor-pointer" onClick={() => handleViewHistory(user)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 text-[10px] tracking-tight">
                                                ID-{user.id.slice(0, 4).toUpperCase()}
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-lg border-none shadow-none ${user.role === 'Admin'
                                                    ? 'bg-purple-50 text-purple-600'
                                                    : 'bg-blue-50 text-blue-600'
                                                    }`}
                                            >
                                                {user.role === 'Admin' ? t('roleAdmin') : t('roleUser')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-col mt-1">
                                        <div className="font-black text-gray-900 text-base">{user.username}</div>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mt-0.5">
                                            <Mail className="size-3.5" />
                                            {user.email}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2 gap-2">
                                        <div className="shrink-0">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('joined')}</p>
                                            <div className="font-bold text-gray-900 text-sm mt-0.5">{format(new Date(user.createdAt), "dd/MM/yyyy")}</div>
                                        </div>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title={t('viewHistory')}
                                                className="min-h-[44px] min-w-[44px] rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-500 transition-all"
                                                onClick={(e) => { e.stopPropagation(); handleViewHistory(user); }}
                                            >
                                                <History className="size-4" />
                                            </Button>

                                            {user.isBlacklisted ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={t('unban')}
                                                    className="min-h-[44px] min-w-[44px] rounded-xl bg-green-50 border border-green-100 text-green-500 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsUnbanDialogOpen(true); }}
                                                    disabled={removeBlacklistMutation.isPending}
                                                >
                                                    <Unlock className="size-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={t('banUser')}
                                                    className="min-h-[44px] min-w-[44px] rounded-xl bg-orange-50 border border-orange-100 text-orange-500 transition-all"
                                                    onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsBanDialogOpen(true); }}
                                                    disabled={blacklistMutation.isPending || user.role === 'Admin'}
                                                >
                                                    <Ban className="size-4" />
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title={t('deleteUser')}
                                                className="min-h-[44px] min-w-[44px] rounded-xl bg-red-50 border border-red-100 text-red-500 transition-all"
                                                onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsDeleteDialogOpen(true); }}
                                                disabled={deleteMutation.isPending || user.role === 'Admin'}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto pb-4">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead className="w-[100px] font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colId')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colAccount')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">{t('colRole')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">{t('colJoinDate')}</TableHead>
                                    <TableHead className="text-right font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colAction')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <Loader2 className="size-12 animate-spin text-primary" />
                                                <p className="font-bold uppercase text-xs">{t('fetchingData')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Search className="size-16" />
                                                <p className="text-2xl font-bold uppercase">{t('noResults')}</p>
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
                                            <TableCell className="p-4">
                                                <div className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 inline-block text-[10px] tracking-tight group-hover:bg-white transition-all">
                                                    ID-{user.id.slice(0, 4).toUpperCase()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">
                                                        {user.username}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium mt-0.5">
                                                        <Mail className="size-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-lg border-none shadow-none ${user.role === 'Admin'
                                                        ? 'bg-purple-50 text-purple-600'
                                                        : 'bg-blue-50 text-blue-600'
                                                        }`}
                                                >
                                                    {user.role === 'Admin' ? t('roleAdmin') : t('roleUser')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <div className="font-bold text-gray-900 text-sm">{format(new Date(user.createdAt), "dd/MM/yyyy")}</div>
                                                <div className="text-[11px] text-gray-400 font-medium">{format(new Date(user.createdAt), "HH:mm")}</div>
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={t('viewHistory')}
                                                        className="size-11 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); handleViewHistory(user); }}
                                                    >
                                                        <History className="size-5" />
                                                    </Button>

                                                    {user.isBlacklisted ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title={t('unban')}
                                                            className="size-11 min-h-[44px] min-w-[44px] rounded-xl bg-green-50 border border-green-100 shadow-sm text-green-500 hover:bg-green-100 transition-all"
                                                            onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsUnbanDialogOpen(true); }}
                                                            disabled={removeBlacklistMutation.isPending}
                                                        >
                                                            <Unlock className="size-5" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title={t('banUser')}
                                                            className="size-11 min-h-[44px] min-w-[44px] rounded-xl bg-orange-50 border border-orange-100 shadow-sm text-orange-500 hover:bg-orange-100 transition-all"
                                                            onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsBanDialogOpen(true); }}
                                                            disabled={blacklistMutation.isPending || user.role === 'Admin'}
                                                        >
                                                            <Ban className="size-5" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={t('deleteUser')}
                                                        className="size-11 min-h-[44px] min-w-[44px] rounded-xl bg-red-50 border border-red-100 shadow-sm text-red-500 hover:bg-red-100 transition-all"
                                                        onClick={(e) => { e.stopPropagation(); setUserToAction(user); setIsDeleteDialogOpen(true); }}
                                                        disabled={deleteMutation.isPending || user.role === 'Admin'}
                                                    >
                                                        <Trash2 className="size-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {t('page')}<span className="text-gray-900">{page + 1}</span> / {totalPages || 1}{t('totalPrefix')}<span className="text-gray-900">{totalCount}</span>{t('membersSuffix')}
                    </p>
                    <AdminPagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                    />
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

            <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                <DialogContent className="max-w-md bg-white border-none rounded-3xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                <Ban className="size-7 text-red-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{t('banTitle')}</DialogTitle>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">{t('banSubtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-100 rounded-2xl">
                                <AlertCircle className="size-4 text-red-500 shrink-0" />
                                <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">
                                    {t('target')} <span className="text-red-500 underline decoration-2 offset-2">@{userToAction?.username}</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{t('banReasonLabel')}</label>
                                <Textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder={t('banReasonPlaceholder')}
                                    className="min-h-[140px] border-2 border-gray-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-gray-900 resize-none placeholder:text-gray-300 text-base p-4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsBanDialogOpen(false)}
                            className="h-12 px-6 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleBanUser}
                            disabled={blacklistMutation.isPending || !banReason.trim()}
                            className="h-12 px-10 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                        >
                            {blacklistMutation.isPending ? t('processing') : t('confirmBan')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Unban Confirmation */}
            <AlertDialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
                <AlertDialogContent className="max-w-md bg-white border-none rounded-2xl p-0 overflow-hidden shadow-xl">
                    <div className="bg-gray-900 p-6 text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Unlock className="size-7 text-green-400" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-xl font-bold tracking-tight">{t('unbanTitle')}</AlertDialogTitle>
                                <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mt-1">{t('unbanSubtitle')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <p className="text-gray-500 font-bold text-sm leading-relaxed">
                            {t('unbanDesc1')}<span className="text-black font-black underline decoration-2 decoration-green-500/30 underline-offset-4">@{userToAction?.username}</span>{t('unbanDesc2')}
                        </p>
                        <div className="flex justify-end gap-4">
                            <AlertDialogCancel className="h-12 px-6 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 transition-all border-none shadow-none bg-transparent">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRemoveBan}
                                className="h-12 px-10 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[4px_4px_0px_#14532d] active:translate-y-1 active:shadow-none transition-all"
                            >
                                {t('confirmUnban')}
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md bg-white border-none rounded-2xl p-0 overflow-hidden shadow-xl">
                    <div className="bg-gray-900 p-6 text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Trash2 className="size-7 text-red-500" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-xl font-bold tracking-tight">{t('deleteTitle')}</AlertDialogTitle>
                                <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mt-1">{t('deleteSubtitle')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="flex items-start gap-4 p-5 bg-red-50 border-2 border-red-100 rounded-[1.5rem]">
                            <AlertCircle className="size-5 text-red-500 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">{t('dangerWarning')}</p>
                                <p className="text-red-700 text-xs font-bold leading-relaxed">
                                    {t('deleteDesc1')}<span className="underline decoration-2 underline-offset-4">@{userToAction?.username}</span>{t('deleteDesc2')}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <AlertDialogCancel className="h-12 px-6 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 transition-all border-none shadow-none bg-transparent">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteUser}
                                className="h-12 px-10 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[4px_4px_0px_#7f1d1d] active:translate-y-1 active:shadow-none transition-all"
                            >
                                {t('confirmDelete')}
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

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
