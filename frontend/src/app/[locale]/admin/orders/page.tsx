'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Search, Calendar, Download, Eye, Receipt, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPagination } from '@/components/admin/pagination';
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
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders, useOrder } from '@/hooks/useOrders';
import { OrderDetailModal } from '@/components/order/OrderDetailModal';
import axiosInstance from '@/lib/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 20;

export default function OrdersPage() {
    const t = useTranslations('Orders');

    // --- Filter state ---
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
    const [page, setPage]                               = useState(0);
    const [searchInput, setSearchInput]                 = useState('');
    const [keyword, setKeyword]                         = useState('');       // debounced value
    const [fromDate, setFromDate]                       = useState('');
    const [toDate, setToDate]                           = useState('');

    // Debounce: only hit the server 400ms after the user stops typing
    useEffect(() => {
        const id = setTimeout(() => {
            setKeyword(searchInput);
            setPage(0);
        }, 400);
        return () => clearTimeout(id);
    }, [searchInput]);

    // Reset page when any filter changes
    const handlePaymentMethodChange = useCallback((val: string) => {
        setPaymentMethodFilter(val);
        setPage(0);
    }, []);

    const handleDateChange = useCallback((field: 'from' | 'to', val: string) => {
        if (field === 'from') setFromDate(val);
        else setToDate(val);
        setPage(0);
    }, []);

    const clearFilters = useCallback(() => {
        setSearchInput('');
        setKeyword('');
        setFromDate('');
        setToDate('');
        setPage(0);
    }, []);

    const hasActiveFilters = !!keyword || !!fromDate || !!toDate;

    // Build ISO strings for API (include full day boundary for toDate)
    const fromDateISO = fromDate ? new Date(fromDate).toISOString() : undefined;
    const toDateISO   = toDate   ? new Date(`${toDate}T23:59:59`).toISOString() : undefined;

    const { data: pagedData, isLoading } = useOrders(
        paymentMethodFilter,
        page * PAGE_SIZE,
        PAGE_SIZE,
        fromDateISO,
        toDateISO,
        keyword,
    );

    const orders     = pagedData?.items     || [];
    const totalCount = pagedData?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // --- Order detail modal ---
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const { data: orderDetails }                = useOrder(selectedOrderId || undefined);
    const queryClient = useQueryClient();

    const handleViewDetails = async (orderId: string, currentStatus: number | string) => {
        setSelectedOrderId(orderId);
        setIsModalOpen(true);
        if (Number(currentStatus) === 3) {
            try {
                await axiosInstance.put(`/api/orders/${orderId}/status?status=4`);
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } catch (err) {
                console.error('Failed to mark order as completed', err);
            }
        }
    };

    const getStatusBadge = (status: number | string) => {
        const baseClass = 'font-black uppercase text-[9px] px-3 py-1.5 rounded-xl border transition-all bg-white shadow-sm inline-flex items-center justify-center';
        const s = Number(status);
        if (s === 1) return <Badge variant="outline" className={`${baseClass} text-green-500 border-green-100 bg-green-50/50`}>{t('statusPaid')}</Badge>;
        if (s === 4) return <Badge variant="outline" className={`${baseClass} text-blue-500 border-blue-100 bg-blue-50/50`}>{t('statusCompleted')}</Badge>;
        if (s === 3) return <Badge variant="outline" className={`${baseClass} text-emerald-600 border-emerald-100 bg-emerald-50/50`}>{t('statusProcessing')}</Badge>;
        return <Badge variant="outline" className={`${baseClass} text-orange-500 border-orange-100 bg-orange-50/50`}>{t('statusUnpaid')}</Badge>;
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" className="min-h-[44px] flex-1 md:flex-none px-4 rounded-xl text-xs md:text-sm font-bold border-gray-200 bg-white hover:bg-gray-50 gap-2">
                        <Download className="size-4 text-primary" />
                        <span className="hidden sm:inline">{t('exportReport')}</span>
                        <span className="sm:hidden">{t('export')}</span>
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                {/* Toolbar: Tabs + Search + Date filters */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-3">
                    {/* Row 1: Status tabs */}
                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                        <Tabs defaultValue="All" onValueChange={handlePaymentMethodChange} className="w-full lg:w-auto">
                            <TabsList className="bg-gray-200/40 p-1 min-h-[44px] rounded-xl border-none w-full grid grid-cols-3 lg:flex lg:w-auto">
                                <TabsTrigger value="All"    className="rounded-lg px-2 lg:px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">{t('tabAll')}</TabsTrigger>
                                <TabsTrigger value="Cash" className="rounded-lg px-2 lg:px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">
                                    <span className="hidden sm:inline">{t('tabCash')}</span>
                                    <span className="sm:hidden">{t('tabCashShort')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="Transfer"   className="rounded-lg px-2 lg:px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary shadow-none transition-all">
                                    <span className="hidden sm:inline">{t('tabTransfer')}</span>
                                    <span className="sm:hidden">{t('tabTransferShort')}</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Search */}
                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="h-9 pl-10 pr-4 border-gray-200 rounded-xl bg-white text-sm focus:border-primary focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 2: Date range */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="size-4 text-gray-400 shrink-0" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('filterByDate')}:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => handleDateChange('from', e.target.value)}
                            className="h-9 px-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 focus:outline-none focus:border-primary transition-all"
                        />
                        <span className="text-xs text-gray-400">→</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => handleDateChange('to', e.target.value)}
                            min={fromDate}
                            className="h-9 px-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 focus:outline-none focus:border-primary transition-all"
                        />
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 h-9 px-3 rounded-xl border border-red-100 bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-all"
                            >
                                <X className="size-3" /> Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                <div className="custom-scrollbar">
                    {/* Mobile Card List */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 py-12 opacity-40">
                                <Loader2 className="size-12 animate-spin text-primary" />
                                <p className="font-display font-bold uppercase text-xs">{t('loading')}</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 py-12 opacity-20">
                                <Receipt className="size-16" />
                                <p className="text-xl font-display font-bold uppercase">{t('noOrders')}</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm cursor-pointer hover:border-gray-300 transition-all"
                                    onClick={() => handleViewDetails(order.id, order.status)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">{t('tablePrefix')}{order.tableName}</div>
                                            <div className="text-xs text-gray-400 font-medium mt-1">#{order.id.slice(0, 8).toUpperCase()}</div>
                                            <div className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider inline-block mt-1">
                                                {order.paymentMethod || t('unknown')}
                                            </div>
                                        </div>
                                        <div className="scale-90 origin-top-right">{getStatusBadge(order.status)}</div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2 pt-3 border-t border-gray-50">
                                        <div className="text-xs text-gray-400 font-medium">{format(new Date(order.createdAt), 'HH:mm - dd/MM/yyyy')}</div>
                                        <div className="font-bold text-primary text-base">
                                            {order.totalAmount.toLocaleString('vi-VN')}<span className="text-xs ml-0.5 font-bold">đ</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto pb-4">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead className="hidden md:table-cell font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colOrderId')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colTable')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">{t('colTime')}</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">{t('colTotal')}</TableHead>
                                    <TableHead className="hidden md:table-cell font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">{t('colStatus')}</TableHead>
                                    <TableHead className="hidden md:table-cell text-right font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">{t('colAction')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <Loader2 className="size-12 animate-spin text-primary" />
                                                <p className="font-display font-bold uppercase text-xs">{t('loadingData')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Receipt className="size-16" />
                                                <p className="text-2xl font-display font-bold uppercase">{t('noOrdersFound')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow
                                            key={order.id}
                                            className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0 group cursor-pointer"
                                            onClick={() => handleViewDetails(order.id, order.status)}
                                        >
                                            <TableCell className="hidden md:table-cell p-4">
                                                <div className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 inline-block text-[10px] tracking-tight">
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="font-bold text-gray-900 text-sm mb-0.5 flex items-center gap-2">
                                                    {t('tablePrefix').toUpperCase()}{order.tableCode}
                                                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">{order.paymentMethod || t('unknown')}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 font-medium">{order.tableName}</div>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <div className="font-bold text-gray-900 text-sm mb-0.5">{format(new Date(order.createdAt), 'HH:mm')}</div>
                                                <div className="text-[11px] text-gray-400 font-medium">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</div>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <div className="font-bold text-primary text-sm">
                                                    {order.totalAmount.toLocaleString('vi-VN')}
                                                    <span className="text-[10px] ml-0.5 font-bold">đ</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell p-4 text-center">
                                                <div className="inline-block scale-90">{getStatusBadge(order.status)}</div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm text-gray-400 hover:text-black"
                                                        onClick={(e) => { e.stopPropagation(); handleViewDetails(order.id, order.status); }}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm text-gray-400 hover:text-black"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Download className="size-4" />
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
                        {t('page')}<span className="text-gray-900">{page + 1}</span> / {totalPages || 1} {t('totalPrefix')}<span className="text-gray-900">{totalCount}</span>{t('ordersCountSuffix')}
                    </p>
                    <AdminPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </Card>

            <OrderDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={orderDetails || null}
            />
        </div>
    );
}
