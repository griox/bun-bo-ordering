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
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-800">Quản lý Thực đơn</h2>
                    <p className="text-neutral-500">Cập nhật danh sách món ăn và giá cả</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger render={
                        <Button className="font-bold gap-2" onClick={() => resetForm()}>
                            <Plus className="w-5 h-5" />
                            THÊM MÓN MỚI
                        </Button>
                    } />
                    <DialogContent className="max-w-xl">
                        <form onSubmit={editingFood ? handleUpdateFood : handleCreateFood}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    {editingFood ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
                                </DialogTitle>
                                <DialogDescription>Nhập thông tin chi tiết cho món ăn của bạn.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-bold">Tên món ăn</label>
                                        <Input 
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ví dụ: Bún Bò Huế Đặc Biệt" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Danh mục</label>
                                        <Select 
                                            value={formData.categoryId} 
                                            onValueChange={val => setFormData({...formData, categoryId: val || ''})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn danh mục" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Giá bán (VNĐ)</label>
                                        <Input 
                                            required
                                            type="number" 
                                            value={formData.price}
                                            onChange={e => setFormData({...formData, price: e.target.value})}
                                            placeholder="65000" 
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-bold">Mô tả</label>
                                        <Input 
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            placeholder="Mô tả nguyên liệu, hương vị..." 
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-bold">Hình ảnh</label>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Input 
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="cursor-pointer"
                                                />
                                                <p className="text-[10px] text-neutral-400 italic">
                                                    Định dạng: JPG, PNG, WebP. Tối đa 5MB.
                                                </p>
                                            </div>
                                            {filePreview && (
                                                <div className="w-20 h-20 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 flex-shrink-0">
                                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>HỦY</Button>
                                <Button type="submit" disabled={createFoodMutation.isPending || updateFoodMutation.isPending}>
                                    {createFoodMutation.isPending || updateFoodMutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> ĐANG LƯU...</>
                                    ) : 'LƯU MÓN ĂN'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="p-4 bg-white border-b border-neutral-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc danh mục..." 
                            className="pl-10 border-neutral-100 bg-neutral-50"
                        />
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-neutral-500">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-neutral-50">
                            <TableRow>
                                <TableHead className="w-[80px]">Ảnh</TableHead>
                                <TableHead>Tên món</TableHead>
                                <TableHead>Danh mục</TableHead>
                                <TableHead>Giá</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDishes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-neutral-400">
                                        Không tìm thấy món ăn nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDishes.map((dish) => (
                                    <TableRow key={dish.id} className="hover:bg-neutral-50/50">
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200">
                                                {dish.imageUrl ? (
                                                    <img src={dish.imageUrl || ''} alt={dish.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-neutral-300" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-neutral-800">{dish.name}</div>
                                            <div className="text-[10px] text-neutral-400 font-mono italic">{dish.description?.slice(0, 30)}...</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-medium">
                                                {dish.categoryName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-primary">
                                            {dish.price.toLocaleString()}đ
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${dish.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={`text-xs font-medium ${dish.isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                                                    {dish.isAvailable ? 'Đang bán' : 'Hết hàng'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger render={
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                } />
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(dish)}>
                                                        <Pencil className="w-4 h-4 text-blue-500" /> Sửa món
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => handleDeleteFood(dish.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Xóa món
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
