/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    Pencil,
    Trash2,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useAllFoods, useCreateFoodMutation, useUpdateFoodMutation, useDeleteFoodMutation, useCreateCategoryMutation, Food } from '@/hooks/useCatalog';

export default function DishesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');

    // Pagination State
    const [page, setPage] = useState(0);
    const pageSize = 6;

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const createCategoryMutation = useCreateCategoryMutation();

    // TanStack Query Hooks
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const { data: pagedData, isLoading: foodsLoading } = useAllFoods(page * pageSize, pageSize);
    const foods = pagedData?.items || [];
    const totalCount = pagedData?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const createFoodMutation = useCreateFoodMutation();
    const updateFoodMutation = useUpdateFoodMutation();
    const deleteFoodMutation = useDeleteFoodMutation();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: ''
    });

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error("Vui lòng nhập tên danh mục");
            return;
        }
        createCategoryMutation.mutate({ name: newCategoryName }, {
            onSuccess: (newCat: { id: number; name: string }) => {
                setFormData(prev => ({ ...prev, categoryId: newCat.id.toString() }));
                setNewCategoryName('');
                setShowNewCategoryInput(false);
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validation: Type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error("Định dạng file không hợp lệ. Vui lòng chọn PNG, JPG hoặc WEBP.");
                return;
            }

            // Validation: Size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateFood = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            toast.error("Vui lòng chọn hoặc tạo danh mục");
            return;
        }

        const data = new FormData();
        data.append('Name', formData.name);
        data.append('Description', formData.description);
        data.append('Price', formData.price);
        data.append('CategoryId', formData.categoryId);
        if (selectedFile) {
            data.append('ImageFile', selectedFile);
        }

        createFoodMutation.mutate(data, {
            onSuccess: () => {
                setIsDialogOpen(false);
                resetForm();
            }
        });
    };

    const handleUpdateFood = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFood) return;

        const data = new FormData();
        data.append('Name', formData.name);
        data.append('Description', formData.description);
        data.append('Price', formData.price);
        data.append('CategoryId', formData.categoryId);
        if (selectedFile) {
            data.append('ImageFile', selectedFile);
        }

        updateFoodMutation.mutate({ id: editingFood.id, data }, {
            onSuccess: () => {
                setIsDialogOpen(false);
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', categoryId: '' });
        setSelectedFile(null);
        setFilePreview('');
        setEditingFood(null);
        setShowNewCategoryInput(false);
        setNewCategoryName('');
    };

    const openEditDialog = (food: Food) => {
        setEditingFood(food);
        setFormData({
            name: food.name,
            description: food.description || '',
            price: food.price.toString(),
            categoryId: food.categoryId.toString()
        });
        setFilePreview(food.imageUrl || '');
        setIsDialogOpen(true);
    };

    const handleDeleteFood = (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa món này?")) return;
        deleteFoodMutation.mutate(id);
    };

    const filteredDishes = foods;

    const isLoading = catsLoading || foodsLoading;

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý thực đơn</h2>
                    <p className="text-sm text-gray-500 mt-1">Hệ thống quản trị và kiểm soát dữ liệu món ăn tập trung.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl transition-all shadow-sm" onClick={() => resetForm()}>
                            <Plus className="size-4" />
                            THÊM MÓN MỚI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-white border-none rounded-2xl p-0 overflow-hidden shadow-xl">
                        <form onSubmit={editingFood ? handleUpdateFood : handleCreateFood} className="flex flex-col max-h-[90vh]">
                            <div className="bg-gray-900 p-6 text-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                        <ImageIcon className="size-7 text-red-400" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold tracking-tight">
                                            {editingFood ? 'Hiệu chỉnh món ăn' : 'Thêm món ăn mới'}
                                        </DialogTitle>
                                        <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest mt-1">Cập nhật thực đơn bún bò của bạn</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Cột Trái (Trường chính) */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tên món ăn</Label>
                                            <Input
                                                required
                                                className="h-12 border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-red-500 transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ví dụ: Bún Bò Huế Đặc Biệt"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Danh mục</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                                                    className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-all"
                                                >
                                                    {showNewCategoryInput ? 'Hủy bỏ' : '+ Tạo mới'}
                                                </button>
                                            </div>

                                            {showNewCategoryInput ? (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <Input
                                                        className="h-11 border-[#ff4d4f] rounded-md font-medium text-sm"
                                                        placeholder="Nhập tên danh mục mới..."
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleCreateCategory}
                                                        disabled={createCategoryMutation.isPending}
                                                        className="h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md shrink-0"
                                                    >
                                                        {createCategoryMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Select
                                                    value={formData.categoryId}
                                                    onValueChange={val => setFormData({ ...formData, categoryId: val || '' })}
                                                >
                                                    <SelectTrigger className="h-11 border-slate-200 rounded-md font-medium text-sm focus:ring-1 focus:ring-[#ff4d4f]/20 transition-all">
                                                        <SelectValue placeholder="Chọn danh mục phân loại..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-md border-slate-200 shadow-lg">
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id.toString()} className="text-sm font-medium py-2.5">
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                        {categories.length === 0 && (
                                                            <div className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Không có dữ liệu</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Giá bán (VNĐ)</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="foodPrice"
                                                    type="number"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                    placeholder="65000"
                                                    className="h-12 border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-red-500 transition-all font-bold text-gray-900 pr-16"
                                                    required
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                                    <span className="text-[10px] font-black text-gray-400">VNĐ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột Phải (Trường phụ) */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Mô tả món ăn</Label>
                                            <Textarea
                                                className="min-h-[110px] border-2 border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:border-red-500 transition-all font-bold text-gray-900 resize-none placeholder:text-gray-300"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Ghi chú về thành phần, hương vị hoặc đặc tính món ăn..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Hình ảnh món ăn</Label>
                                            <div className="relative group h-[200px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden transition-all hover:border-red-500/50 hover:bg-red-50/10">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                                                />
                                                {filePreview ? (
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="flex flex-col items-center gap-2 text-white">
                                                                <ImageIcon className="size-8" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Thay đổi ảnh</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                        <div className="size-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400">
                                                            <Plus className="size-6" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Chọn tệp hình ảnh</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">PNG, JPG, WEBP • Tối đa 5MB</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 border-t-2 border-gray-100 flex justify-end gap-4 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-12 px-6 font-black uppercase text-[10px] tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createFoodMutation.isPending || updateFoodMutation.isPending}
                                    className="h-12 px-10 bg-red-500 hover:bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-50"
                                >
                                    {createFoodMutation.isPending || updateFoodMutation.isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : 'Hoàn tất & Lưu món'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm món ăn..."
                            className="h-10 pl-10 pr-4 border-gray-200 rounded-xl bg-white text-sm focus:border-primary focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-neutral-500">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead className="w-[80px] font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Ảnh</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">Sản phẩm</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Danh mục</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Giá bán</TableHead>
                                    <TableHead className="font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest text-center">Trạng thái</TableHead>
                                    <TableHead className="text-right font-bold text-gray-400 uppercase p-4 text-[10px] tracking-widest">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDishes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Search className="size-16" />
                                                <p className="text-2xl font-display font-bold uppercase">Không tìm thấy món ăn</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDishes.map((dish) => (
                                        <TableRow key={dish.id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0 group">
                                            <TableCell className="p-4">
                                                <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0 mx-auto">
                                                    {dish.imageUrl ? (
                                                        <img src={dish.imageUrl || ''} alt={dish.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <ImageIcon className="size-4 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="font-bold text-gray-900 text-sm mb-0.5">{dish.name}</div>
                                                <div className="text-[11px] text-gray-400 font-medium line-clamp-1 italic">{dish.description || 'Chưa có mô tả'}</div>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold uppercase text-[9px] px-2 py-0.5 rounded-lg border-none">
                                                    {dish.categoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {dish.price.toLocaleString('vi-VN')}
                                                    <span className="text-[10px] ml-0.5 font-bold text-primary">đ</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`size-2 rounded-full ${dish.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${dish.isAvailable ? 'text-green-600' : 'text-red-400'}`}>
                                                        {dish.isAvailable ? 'Sẵn sàng' : 'Hết hàng'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="inline-block">
                                                            <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm transition-all">
                                                                <MoreVertical className="size-5 text-gray-400" />
                                                            </Button>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-[1.2rem] border border-gray-100 shadow-2xl p-2 bg-white animate-in slide-in-from-top-1 duration-200">
                                                        <DropdownMenuItem className="gap-3 py-3.5 rounded-xl font-bold text-[10px] uppercase cursor-pointer hover:bg-gray-50 text-gray-600 transition-colors" onClick={() => openEditDialog(dish)}>
                                                            <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 transition-all shadow-sm">
                                                                <Pencil className="size-4" />
                                                            </div>
                                                            Hiệu chỉnh món ăn
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-3 py-3.5 rounded-xl font-bold text-[10px] uppercase cursor-pointer text-red-500 hover:bg-red-50 transition-colors"
                                                            onClick={() => handleDeleteFood(dish.id)}
                                                        >
                                                            <div className="size-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100 transition-all shadow-sm">
                                                                <Trash2 className="size-4" />
                                                            </div>
                                                            Xóa khỏi hệ thống
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        Trang <span className="text-gray-900">{page + 1}</span> / {totalPages || 1} — Tổng <span className="text-gray-900">{totalCount}</span> món ăn
                    </p>
                    <AdminPagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                    />
                </div>
            </Card>
        </div >
    );
}
