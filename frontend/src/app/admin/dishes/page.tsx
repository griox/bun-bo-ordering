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
    DialogTrigger,
    DialogDescription
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
import { useCategories, useAllFoods, useCreateFoodMutation, useUpdateFoodMutation, useDeleteFoodMutation, Food } from '@/hooks/useCatalog';

export default function DishesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');

    // Pagination State
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // TanStack Query Hooks
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const { data: foods = [], isLoading: foodsLoading } = useAllFoods(page * pageSize, pageSize);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
            toast.error("Vui lòng chọn danh mục");
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

    const filteredDishes = foods.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLoading = catsLoading || foodsLoading;

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.1)] border-2 border-black -rotate-3">
                        <Plus className="size-8 text-white rotate-3" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-display font-bold text-black mb-1 uppercase tracking-tight">THỰC ĐƠN</h2>
                        <p className="text-black/60 font-medium">Quản lý danh sách các món ăn đang phục vụ.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger render={
                        <Button className="h-14 px-8 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-black text-sm gap-3 rounded-2xl border-none shadow-lg active:translate-y-px transition-all uppercase tracking-widest" onClick={() => resetForm()}>
                            <Plus className="size-5" />
                            THÊM MÓN MỚI
                        </Button>
                    } />
                    <DialogContent className="max-w-xl rounded-[2rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white">
                        <form onSubmit={editingFood ? handleUpdateFood : handleCreateFood} className="flex flex-col">
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black text-black uppercase tracking-tighter">
                                        {editingFood ? 'Cập nhật món' : 'Tạo món mới'}
                                    </DialogTitle>
                                    <DialogDescription className="font-bold text-gray-400 text-xs uppercase tracking-widest mt-1">Vui lòng nhập đầy đủ thông tin kỹ thuật</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-6 bg-white">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Tên món ăn / Product Name</label>
                                        <Input
                                            required
                                            className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30 focus:bg-white focus:border-[#ff4d4f] transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ví dụ: Bún Bò Huế Đặc Biệt"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Danh mục</label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={val => setFormData({ ...formData, categoryId: val || '' })}
                                        >
                                            <SelectTrigger className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30">
                                                <SelectValue placeholder="Chọn danh mục" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border border-gray-100 shadow-xl">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()} className="font-black py-3 uppercase text-xs">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Giá bán (VNĐ)</label>
                                        <Input
                                            required
                                            type="number"
                                            className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30 focus:border-[#ff4d4f]"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="65000"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Mô tả chi tiết</label>
                                        <Input
                                            className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30 focus:border-[#ff4d4f]"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Mô tả ngắn gọn về sản phẩm..."
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Visual Asset / Hình ảnh</label>
                                        <div className="flex items-center gap-4 p-5 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl group transition-all hover:bg-white hover:border-[#ff4d4f]">
                                            {filePreview ? (
                                                <div className="relative size-20 rounded-xl border border-gray-100 overflow-hidden shadow-lg shrink-0">
                                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedFile(null); setFilePreview(''); }}
                                                        className="absolute top-0 right-0 bg-[#ff4d4f] text-white p-1 hover:bg-[#ff4d4f]/80"
                                                    >
                                                        <Plus className="size-3 rotate-45" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="size-20 rounded-xl border border-dashed border-gray-200 flex items-center justify-center bg-white text-gray-300 shrink-0 group-hover:text-[#ff4d4f] transition-colors">
                                                    <ImageIcon className="size-8" />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="cursor-pointer file:bg-[#ff4d4f] file:text-white file:border-none file:px-3 file:py-1 file:rounded-lg file:text-[10px] file:font-black file:mr-3 border-none bg-transparent h-auto p-0 font-black"
                                                />
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Format: JPG, PNG, WebP. Limit: 5MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <Button type="button" variant="ghost" className="flex-1 h-12 border border-gray-100 bg-white font-black rounded-xl shadow-sm hover:bg-gray-100 transition-all uppercase text-[10px] tracking-widest" onClick={() => setIsDialogOpen(false)}>HỦY BỎ</Button>
                                <Button type="submit" className="flex-[2] h-12 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-black rounded-xl border-none shadow-lg active:translate-y-px transition-all uppercase text-[10px] tracking-widest" disabled={createFoodMutation.isPending || updateFoodMutation.isPending}>
                                    {createFoodMutation.isPending || updateFoodMutation.isPending ? (
                                        <><Loader2 className="size-4 animate-spin mr-2" /> Đang đồng bộ...</>
                                    ) : 'XÁC NHẬN LƯU DỮ LIỆU'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 bg-gray-50/30 border-b border-gray-100 flex items-center gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-300" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="TÌM KIẾM DỮ LIỆU THỰC ĐƠN..."
                            className="h-14 pl-12 pr-6 border border-gray-100 rounded-2xl bg-white font-black focus:border-[#ff4d4f] transition-all uppercase text-[10px] tracking-[0.2em]"
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
                                    <TableHead className="w-[100px] font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Visual</TableHead>
                                    <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Sản phẩm</TableHead>
                                    <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Category</TableHead>
                                    <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Price Unit</TableHead>
                                    <TableHead className="font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-right font-black text-gray-400 uppercase p-6 text-[10px] tracking-widest">Actions</TableHead>
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
                                            <TableCell className="p-6">
                                                <div className="size-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0 mx-auto">
                                                    {dish.imageUrl ? (
                                                        <img src={dish.imageUrl || ''} alt={dish.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <ImageIcon className="size-6 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6">
                                                <div className="font-black text-black text-lg uppercase tracking-tighter mb-0.5">{dish.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide line-clamp-1 italic">{dish.description || 'Chưa cấu hình mô tả...'}</div>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <Badge variant="ghost" className="bg-gray-100 text-gray-500 font-black uppercase text-[10px] px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                    {dish.categoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <div className="font-black text-black text-xl tracking-tighter">
                                                    {dish.price.toLocaleString('vi-VN')}
                                                    <span className="text-[10px] ml-1 font-black text-[#ff4d4f]">đ</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className={`w-3 h-3 rounded-full border border-white/50 ${dish.isAvailable ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${dish.isAvailable ? 'text-green-600' : 'text-red-400'}`}>
                                                        {dish.isAvailable ? 'Live' : 'Out'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={
                                                        <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 shadow-sm transition-all">
                                                            <MoreVertical className="size-5 text-gray-400" />
                                                        </Button>
                                                    } />
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

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest italic">
                        Trang <b>{page + 1}</b> | Hiển thị tối đa <b>{pageSize}</b> bản ghi
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50"
                            disabled={page === 0}
                            onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        >
                            TRƯỚC đó
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-10 border border-gray-100 bg-white rounded-xl font-black text-[10px] uppercase shadow-sm transition-all px-5 hover:bg-gray-50"
                            disabled={foods.length < pageSize}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            TIẾP THEO
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
