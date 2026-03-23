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
    DialogFooter,
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

    // TanStack Query Hooks
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const { data: foods = [], isLoading: foodsLoading } = useAllFoods();
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
                        <Button className="h-14 px-8 bg-black hover:bg-black/90 text-white font-display font-bold text-sm gap-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all" onClick={() => resetForm()}>
                            <Plus className="size-5" />
                            THÊM MÓN MỚI
                        </Button>
                    } />
                    <DialogContent className="max-w-xl rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.1)] p-0 overflow-hidden bg-white">
                        <form onSubmit={editingFood ? handleUpdateFood : handleCreateFood} className="flex flex-col">
                            <div className="p-8 border-b-2 border-text/5 bg-background">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-display font-bold text-text uppercase">
                                        {editingFood ? 'CHỈNH SỬA MÓN' : 'THÊM MÓN MỚI'}
                                    </DialogTitle>
                                    <DialogDescription className="font-medium text-text/60">Điền thông tin chi tiết bên dưới để cập nhật thực đơn.</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-6 bg-paper">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-display font-bold text-black/40 uppercase tracking-widest pl-1">Tên món ăn</label>
                                        <Input
                                            required
                                            className="h-12 border-2 border-black/10 rounded-xl font-bold bg-white focus:bg-white focus:border-black transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ví dụ: Bún Bò Huế Đặc Biệt"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Danh mục</label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={val => setFormData({ ...formData, categoryId: val || '' })}
                                        >
                                            <SelectTrigger className="h-12 border-2 border-text/10 rounded-xl font-bold bg-background/30">
                                                <SelectValue placeholder="Chọn danh mục" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-2 border-text shadow-lg">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()} className="font-bold py-3 uppercase text-xs">
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Giá bán (VNĐ)</label>
                                        <Input
                                            required
                                            type="number"
                                            className="h-12 border-2 border-text/10 rounded-xl font-bold bg-background/30"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="65000"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Mô tả món ăn</label>
                                        <Input
                                            className="h-12 border-2 border-text/10 rounded-xl font-bold bg-background/30"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Mô tả ngắn gọn về món ăn..."
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Hình ảnh món ăn</label>
                                        <div className="flex items-center gap-4 p-4 bg-background/30 border-2 border-dashed border-text/10 rounded-2xl">
                                            {filePreview ? (
                                                <div className="relative size-20 rounded-xl border-2 border-text overflow-hidden shadow-[3px_3px_0px_#2D2D2D] shrink-0">
                                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedFile(null); setFilePreview(''); }}
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5"
                                                    >
                                                        <Plus className="size-3 rotate-45" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="size-20 rounded-xl border-2 border-dashed border-text/10 flex items-center justify-center bg-paper text-text/20 shrink-0">
                                                    <ImageIcon className="size-8" />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="cursor-pointer file:bg-primary file:text-white file:border-none file:px-3 file:py-1 file:rounded-lg file:text-xs file:font-bold file:mr-3 border-none bg-transparent h-auto p-0"
                                                />
                                                <p className="text-[10px] text-text/40 font-bold uppercase tracking-tight">JPG, PNG hoặc WebP. Tối đa 5MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-black/[0.02] border-t-2 border-black/5 flex gap-4">
                                <Button type="button" variant="outline" className="flex-1 h-12 border-2 border-black font-display font-bold rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all uppercase hover:bg-black/5" onClick={() => setIsDialogOpen(false)}>HỦY</Button>
                                <Button type="submit" className="flex-[2] h-12 bg-black hover:bg-black/90 text-white font-display font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all uppercase" disabled={createFoodMutation.isPending || updateFoodMutation.isPending}>
                                    {createFoodMutation.isPending || updateFoodMutation.isPending ? (
                                        <><Loader2 className="size-5 animate-spin mr-2" /> Đang lưu...</>
                                    ) : 'LƯU MÓN ĂN'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
                <div className="p-6 bg-black/[0.02] border-b-4 border-black/5 flex items-center gap-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-black/30" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="TÌM KIẾM MÓN ĂN HOẶC DANH MỤC..."
                            className="h-14 pl-12 pr-6 border-2 border-black/10 rounded-2xl bg-white font-bold focus:border-black transition-all uppercase text-xs tracking-wider"
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
                            <TableHeader className="bg-text/5">
                                <TableRow className="hover:bg-transparent border-b-2 border-text/5">
                                    <TableHead className="w-[100px] font-display font-bold text-text uppercase p-6">Ảnh</TableHead>
                                    <TableHead className="font-display font-bold text-text uppercase p-6">Thông tin món</TableHead>
                                    <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Danh mục</TableHead>
                                    <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Giá bán</TableHead>
                                    <TableHead className="font-display font-bold text-text uppercase p-6 text-center">Trạng thái</TableHead>
                                    <TableHead className="text-right font-display font-bold text-text uppercase p-6">Thao tác</TableHead>
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
                                        <TableRow key={dish.id} className="hover:bg-background/20 transition-colors border-b-2 border-text/5 last:border-0 group">
                                            <TableCell className="p-6">
                                                <div className="size-16 rounded-2xl bg-background border-2 border-text overflow-hidden shadow-[4px_4px_0px_#2D2D2D] group-hover:scale-105 transition-transform shrink-0">
                                                    {dish.imageUrl ? (
                                                        <img src={dish.imageUrl || ''} alt={dish.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-text/5">
                                                            <ImageIcon className="size-6 text-text/20" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6">
                                                <div className="font-display font-bold text-text text-lg uppercase leading-tight mb-1">{dish.name}</div>
                                                <div className="text-[10px] text-text/40 font-bold uppercase tracking-wide line-clamp-1">{dish.description || 'Chưa có mô tả'}</div>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <Badge variant="secondary" className="bg-text/5 text-text font-bold uppercase text-[10px] px-3 py-1 rounded-lg border-2 border-text/5">
                                                    {dish.categoryName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <div className="font-display font-bold text-black text-xl tracking-tight">
                                                    {dish.price.toLocaleString('vi-VN')}
                                                    <span className="text-[10px] ml-1">đ</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className={`w-3 h-3 rounded-full border-2 border-text/10 ${dish.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                                                    <span className={`text-[9px] font-bold uppercase tracking-tighter ${dish.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                                        {dish.isAvailable ? 'ĐANG BÁN' : 'HẾT HÀNG'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-6 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={
                                                        <Button variant="ghost" className="size-10 rounded-xl hover:bg-black hover:text-white border-2 border-transparent hover:border-black transition-all">
                                                            <MoreVertical className="size-5" />
                                                        </Button>
                                                    } />
                                                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] p-2 bg-white">
                                                        <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold font-display text-xs uppercase cursor-pointer hover:bg-black/5" onClick={() => openEditDialog(dish)}>
                                                            <div className="size-8 rounded-lg bg-black/5 flex items-center justify-center text-black">
                                                                <Pencil className="size-4" />
                                                            </div>
                                                            Sửa thông tin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-3 py-3 rounded-xl font-bold font-display text-xs uppercase cursor-pointer text-black hover:bg-black hover:text-white transition-colors"
                                                            onClick={() => handleDeleteFood(dish.id)}
                                                        >
                                                            <div className="size-8 rounded-lg bg-black/5 flex items-center justify-center text-black group-hover:text-white">
                                                                <Trash2 className="size-4" />
                                                            </div>
                                                            Xóa món ăn
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
            </Card>
        </div>
    );
}
