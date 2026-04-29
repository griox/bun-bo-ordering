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
    Loader2,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    DialogHeader,
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
    const pageSize = 10;

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
                    <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[95vw] md:w-full rounded-md border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white">
                        <form onSubmit={editingFood ? handleUpdateFood : handleCreateFood} className="flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <DialogHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight uppercase">
                                                {editingFood ? 'Hiệu chỉnh món ăn' : 'Tạo món ăn mới'}
                                            </DialogTitle>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                                    {/* Cột Trái (Trường chính) */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên món ăn </Label>
                                            <Input
                                                required
                                                className="h-12 border-slate-200 rounded-md bg-white text-base md:text-lg font-semibold focus:border-[#ff4d4f] focus:ring-1 focus:ring-[#ff4d4f]/20 transition-all placeholder:text-slate-300"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ví dụ: Bún Bò Huế Đặc Biệt"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center pr-1">
                                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh mục </Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                                                    className="text-[10px] font-bold text-[#ff4d4f] hover:text-[#ff4d4f]/80 uppercase tracking-wider transition-all"
                                                >
                                                    {showNewCategoryInput ? 'Hủy bỏ' : '+ TẠO MỚI'}
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
                                            <Label htmlFor="foodPrice" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giá bán (VNĐ)</Label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <DollarSign className="size-4 text-slate-400 group-focus-within:text-[#ff4d4f] transition-colors" />
                                                </div>
                                                <Input
                                                    id="foodPrice"
                                                    type="number"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                    placeholder="65000"
                                                    className="pl-11 pr-16 h-12 border-slate-200 border-2 rounded-md bg-white text-base font-semibold font-sans focus-visible:border-[#ff4d4f] focus-visible:ring-1 focus-visible:ring-[#ff4d4f]/20 transition-all placeholder:text-slate-300 placeholder:font-normal"
                                                    required
                                                />
                                                <div className="absolute inset-y-0 right-0 max-w-fit px-4 flex items-center border-l border-slate-200 bg-slate-50 rounded-r-md">
                                                    <span className="text-[10px] font-bold text-slate-500">VNĐ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột Phải (Trường phụ) */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mô tả ngắn gọn</Label>
                                            <Textarea
                                                className="min-h-[110px] border-slate-200 rounded-md bg-white text-sm font-medium focus:border-[#ff4d4f] focus:ring-1 focus:ring-[#ff4d4f]/20 transition-all resize-none placeholder:text-slate-300"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Ghi chú về thành phần, hương vị hoặc đặc tính món ăn..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hình ảnh nhận diện</Label>
                                            <div className="relative flex flex-col items-center justify-center min-h-[200px] w-full p-6 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-md group transition-all hover:border-[#ff4d4f]/40 hover:bg-white overflow-hidden">
                                                {filePreview ? (
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover opacity-10 blur-[1px]" />
                                                    </div>
                                                ) : null}

                                                <div className="relative z-10 flex flex-col items-center gap-5">
                                                    {filePreview ? (
                                                        <div className="size-24 rounded shadow-lg border-2 border-white overflow-hidden">
                                                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-all group-hover:bg-[#ff4d4f]/5 group-hover:text-[#ff4d4f]">
                                                            <ImageIcon className="size-8 opacity-40" />
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col items-center gap-3">
                                                        <label className="h-10 px-6 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-all shadow-sm flex items-center gap-2">
                                                            <Plus className="size-3" /> Chọn tệp hình ảnh
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="absolute top-0 left-0 opacity-0 cursor-pointer"
                                                            />
                                                        </label>
                                                        <div className="max-w-[240px] px-2 text-center">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                                                PNG, JPG, WEBP • Tối đa 5MB
                                                            </p>
                                                            <p className="text-[9px] text-slate-400 font-semibold italic mt-1 leading-tight">
                                                                * Khuyên dùng tỷ lệ 1:1 (vuông) để hiển thị đẹp nhất trên menu
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {filePreview && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); setSelectedFile(null); setFilePreview(''); }}
                                                        className="absolute top-2 right-2 bg-slate-900/10 hover:bg-red-500 text-slate-900 hover:text-white size-7 rounded flex items-center justify-center z-20 transition-all border border-slate-200"
                                                    >
                                                        <Plus className="size-4 rotate-45" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3 shrink-0">
                                <Button type="button" variant="outline" className="h-10 px-6 border-slate-200 bg-white font-bold rounded-sm hover:bg-slate-100 transition-all uppercase text-[10px] tracking-wider text-slate-600" onClick={() => setIsDialogOpen(false)}>Hủy bỏ tác vụ</Button>
                                <Button type="submit" className="h-10 px-8 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold rounded-sm border-none shadow-md active:scale-[0.98] transition-all uppercase text-[10px] tracking-wider" disabled={createFoodMutation.isPending || updateFoodMutation.isPending}>
                                    {createFoodMutation.isPending || updateFoodMutation.isPending ? (
                                        <><Loader2 className="size-4 animate-spin mr-2" /> Đang đồng bộ...</>
                                    ) : 'Hoàn tất & Lưu thay đổi'}
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
                                                        <DropdownMenuItem className="gap-3 py-3.5 rounded-xl font-black text-[10px] uppercase cursor-pointer hover:bg-gray-50 text-gray-600 transition-colors" onClick={() => openEditDialog(dish)}>
                                                            <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                                                <Pencil className="size-4" />
                                                            </div>
                                                            Hiệu chỉnh món ăn
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-3 py-3.5 rounded-xl font-black text-[10px] uppercase cursor-pointer text-red-500 hover:bg-red-50 transition-colors"
                                                            onClick={() => handleDeleteFood(dish.id)}
                                                        >
                                                            <div className="size-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
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
                    <p className="text-xs text-gray-400 font-medium">
                        Trang <span className="font-bold text-gray-700">{page + 1}</span> / <span className="font-bold text-gray-700">{totalPages || 1}</span> | Tổng cộng <span className="font-bold text-gray-700">{totalCount}</span> món ăn
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl text-xs font-bold border-gray-200 bg-white hover:bg-gray-50"
                            disabled={page === 0}
                            onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl text-xs font-bold border-gray-200 bg-white hover:bg-gray-50"
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            Tiếp
                        </Button>
                    </div>
                </div>
            </Card>
        </div >
    );
}
