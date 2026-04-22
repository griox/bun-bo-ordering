'use client';

import React, { useState } from 'react';
import {
    Ticket,
    Plus,
    Search,
    Filter,
    Calendar,
    Users,
    ChevronRight,
    Loader2,
    CheckCircle2,
    XCircle,
    Copy,
    Percent,
    Banknote
} from 'lucide-react';
import { usePromotions } from '@/hooks/usePromotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PromotionsPage() {
    const { useVouchers } = usePromotions();
    const { data: vouchers, isLoading } = useVouchers();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredVouchers = vouchers?.filter(v =>
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã sao chép mã: ${code}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-[#ff4d4f]/10 rounded-xl">
                            <Ticket className="size-8 text-[#ff4d4f]" />
                        </div>
                        QUẢN LÝ KHUYẾN MÃI
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Tạo và quản lý các mã giảm giá cho khách hàng.</p>
                </div>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white px-6 h-12 rounded-2xl shadow-lg shadow-[#ff4d4f]/20 flex items-center gap-2 group transition-all active:scale-95">
                            <Plus className="size-5 group-hover:rotate-90 transition-transform" />
                            <span className="font-bold uppercase tracking-wider text-xs">Tạo mã mới</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white border-4 border-gray-900 rounded-[2rem] p-8 shadow-[20px_20px_0px_rgba(31,41,55,0.1)]">
                        <DialogTitle className="sr-only">Tạo mã khuyến mãi</DialogTitle>
                        <CreateVoucherForm onSuccess={() => setIsCreateModalOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Ticket className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng số mã</p>
                            <p className="text-2xl font-black text-gray-900">{vouchers?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang hoạt động</p>
                            <p className="text-2xl font-black text-gray-900">{vouchers?.filter(v => v.isActive).length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                            <Users className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đã sử dụng</p>
                            <p className="text-2xl font-black text-gray-900">{vouchers?.reduce((acc, v) => acc + v.usageCount, 0) || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Section */}
            <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm mã hoặc nội dung..."
                            className="pl-12 h-14 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#ff4d4f] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-14 px-6 border-2 border-gray-100 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2">
                        <Filter className="size-5 text-gray-400" />
                        <span className="font-bold text-xs uppercase text-gray-600">Bộ lọc</span>
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="size-12 animate-spin text-[#ff4d4f]" />
                            <p className="font-bold text-gray-400 animate-pulse uppercase tracking-widest text-xs">Đang tải dữ liệu bún bò...</p>
                        </div>
                    ) : filteredVouchers?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                            <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center">
                                <Search className="size-8 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-800">Không tìm thấy mã nào</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">Hãy thử thay đổi từ khóa hoặc tạo một mã khuyến mãi mới nhé!</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mã & Mô tả</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loại giảm</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sử dụng</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thời hạn</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Trạng thái</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredVouchers?.map((voucher) => (
                                    <tr key={voucher.id} className="group hover:bg-gray-50/80 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white relative">
                                                    <Ticket className="size-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-gray-900 tracking-tight">{voucher.code}</span>
                                                        <button
                                                            onClick={() => handleCopyCode(voucher.code)}
                                                            className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400"
                                                        >
                                                            <Copy className="size-3" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{voucher.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {voucher.discountType === 'Percentage' ? (
                                                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                                        <Percent className="size-4" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                        <Banknote className="size-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-black text-gray-800">
                                                        {voucher.discountType === 'Percentage'
                                                            ? `${voucher.discountValue}%`
                                                            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.discountValue)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        {voucher.discountType === 'Percentage' ? 'Theo %' : 'Cố định'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-gray-500">
                                                    <span>{voucher.usageCount} / {voucher.maxUsageLimit}</span>
                                                    <span>{Math.round((voucher.usageCount / voucher.maxUsageLimit) * 100)}%</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#ff4d4f] rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min((voucher.usageCount / voucher.maxUsageLimit) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="size-4 text-gray-400" />
                                                <div className="text-[10px] font-bold text-gray-600">
                                                    <p>{format(new Date(voucher.startDate), 'dd/MM/yyyy', { locale: vi })}</p>
                                                    <p className="text-gray-400">đến {format(new Date(voucher.endDate), 'dd/MM/yyyy', { locale: vi })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {voucher.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                    Đang chạy
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                    <XCircle className="size-3" />
                                                    Dừng
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900 group/btn">
                                                <ChevronRight className="size-5 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function CreateVoucherForm({ onSuccess }: { onSuccess: () => void }) {
    const { createVoucherMutation } = usePromotions();
    const [formData, setFormData] = useState(() => ({
        code: '',
        description: '',
        discountType: 'Percentage' as 'Percentage' | 'FixedAmount',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscountAmount: 0,
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        maxUsageLimit: 100,
        maxUsagePerUser: 1,
        isActive: true
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createVoucherMutation.mutateAsync(formData);
            toast.success('Đã tạo mã khuyến mãi thành công!');
            onSuccess();
        } catch (_error) {
            toast.error('Lỗi khi tạo mã khuyến mãi.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <Plus className="size-6 text-emerald-600" />
                    </div>
                    Tạo mã khuyến mãi bún bò
                </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Mã Code</label>
                    <Input
                        placeholder="VD: BUNBO30"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-black uppercase"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Loại giảm</label>
                    <div className="flex bg-gray-50 p-1 rounded-xl border-2 border-gray-100 h-12">
                        <button
                            type="button"
                            className={`flex-1 rounded-lg text-[10px] font-black uppercase transition-all ${formData.discountType === 'Percentage' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400'}`}
                            onClick={() => setFormData({ ...formData, discountType: 'Percentage' })}
                        >
                            Phần trăm (%)
                        </button>
                        <button
                            type="button"
                            className={`flex-1 rounded-lg text-[10px] font-black uppercase transition-all ${formData.discountType === 'FixedAmount' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400'}`}
                            onClick={() => setFormData({ ...formData, discountType: 'FixedAmount' })}
                        >
                            Số tiền (VND)
                        </button>
                    </div>
                </div>

                <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Mô tả</label>
                    <Input
                        placeholder="VD: Giảm 30% cho đơn hàng đầu tiên"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-medium"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Giá trị giảm</label>
                    <Input
                        type="number"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Đơn tối thiểu</label>
                    <Input
                        type="number"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Ngày bắt đầu</label>
                    <Input
                        type="datetime-local"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Ngày kết thúc</label>
                    <Input
                        type="datetime-local"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tổng lượt dùng</label>
                    <Input
                        type="number"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.maxUsageLimit}
                        onChange={(e) => setFormData({ ...formData, maxUsageLimit: Number(e.target.value) })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Lượt dùng / user</label>
                    <Input
                        type="number"
                        className="h-12 border-2 border-gray-100 rounded-xl focus:border-[#ff4d4f] font-bold"
                        value={formData.maxUsagePerUser}
                        onChange={(e) => setFormData({ ...formData, maxUsagePerUser: Number(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={createVoucherMutation.isPending}
                className="w-full h-14 bg-gray-900 border-2 border-gray-900 hover:bg-white hover:text-gray-900 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50"
            >
                {createVoucherMutation.isPending ? (
                    <><Loader2 className="size-5 mr-2 animate-spin" /> ĐANG TẠO...</>
                ) : (
                    'XÁC NHẬN TẠO MÃ KHUYẾN MÃI'
                )}
            </Button>
        </form>
    );
}
