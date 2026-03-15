'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, 
    Trash2, 
    MoreVertical, 
    Pencil, 
    QrCode, 
    Download,
    Save,
    Move,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useTables, useCreateTableMutation, useUpdateTableMutation, useUpdateTablePositionsMutation, useDeleteTableMutation, RestaurantTable } from '@/hooks/useTables';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

export default function TablesPage() {
    const { data: tables = [], isLoading } = useTables();
    const createTableMutation = useCreateTableMutation();
    const updateTableMutation = useUpdateTableMutation();
    const updatePositionsMutation = useUpdateTablePositionsMutation();
    const deleteTableMutation = useDeleteTableMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [formData, setFormData] = useState({ tableCode: '', name: '' });
    
    // Local state for table positions across the floor plan
    const [localTables, setLocalTables] = useState<RestaurantTable[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when server data loads
    useEffect(() => {
        if (tables.length > 0) {
            setLocalTables(tables);
        }
    }, [tables]);

    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedTableForQR, setSelectedTableForQR] = useState<RestaurantTable | null>(null);

    const floorPlanRef = useRef<HTMLDivElement>(null);

    const handleCreateOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTable) {
            updateTableMutation.mutate({ ...editingTable, ...formData }, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    resetForm();
                }
            });
        } else {
            createTableMutation.mutate(formData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    resetForm();
                }
            });
        }
    };

    const resetForm = () => {
        setFormData({ tableCode: '', name: '' });
        setEditingTable(null);
    };

    const openEditDialog = (table: RestaurantTable) => {
        setEditingTable(table);
        setFormData({ tableCode: table.tableCode, name: table.name });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa bàn này?")) {
            deleteTableMutation.mutate(id);
        }
    };

    const handleDragEnd = (id: string, _: any, info: any) => {
        // Use info.offset which is the displacement from the start of the drag
        setLocalTables(prev => prev.map(t => 
            t.id === id ? { 
                ...t, 
                posX: t.posX + info.offset.x, 
                posY: t.posY + info.offset.y 
            } : t
        ));
        setHasChanges(true);
    };

    const handleBulkSave = () => {
        const updates = localTables.map(t => ({
            id: t.id,
            posX: t.posX,
            posY: t.posY
        }));
        updatePositionsMutation.mutate(updates, {
            onSuccess: () => {
                setHasChanges(false);
            }
        });
    };

    const downloadQR = (table: RestaurantTable) => {
        const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `QR-${table.tableCode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    // The URL the QR code points to
    const getScanUrl = (tableId: string) => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/scan/${tableId}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-neutral-800">Quản lý Bàn ăn</h2>
                    <p className="text-neutral-500">Thiết lập sơ đồ quán và mã QR gọi món</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger render={
                        <Button className="font-bold gap-2" onClick={() => resetForm()}>
                            <Plus className="w-5 h-5" />
                            THÊM BÀN MỚI
                        </Button>
                    } />
                    <DialogContent>
                        <form onSubmit={handleCreateOrUpdate}>
                            <DialogHeader>
                                <DialogTitle>{editingTable ? 'Cập nhật bàn' : 'Thêm bàn mới'}</DialogTitle>
                                <DialogDescription>Nhập thông tin cơ bản cho bàn ăn.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Mã bàn (Dùng để nhận diện)</label>
                                    <Input 
                                        required
                                        placeholder="Ví dụ: T1, VIP-01" 
                                        value={formData.tableCode}
                                        onChange={e => setFormData({...formData, tableCode: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Tên hiển thị</label>
                                    <Input 
                                        required
                                        placeholder="Ví dụ: Bàn 1, Bàn cửa sổ" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>HỦY</Button>
                                <Button type="submit">LƯU THÔNG TIN</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Table List */}
                <Card className="lg:col-span-1 p-4 h-[600px] flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Move className="w-4 h-4 text-primary" />
                        Danh sách bàn
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50 group hover:border-primary transition-colors">
                                <div>
                                    <p className="font-bold text-sm">{table.tableCode}</p>
                                    <p className="text-[10px] text-neutral-500">{table.name}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => openEditDialog(table)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-500" onClick={() => {
                                        setSelectedTableForQR(table);
                                        setIsQRModalOpen(true);
                                    }}>
                                        <QrCode className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(table.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Right: Floor Plan (Drag & Drop area) */}
                <Card className="lg:col-span-3 h-[600px] relative overflow-hidden bg-neutral-50/50 border-2 border-dashed border-neutral-200 rounded-2xl">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    
                    <div ref={floorPlanRef} className="absolute inset-0 w-full h-full p-10">
                        {localTables.map(table => (
                            <motion.div
                                key={table.id}
                                drag
                                dragConstraints={floorPlanRef}
                                dragElastic={0.1}
                                dragMomentum={false}
                                onDragEnd={(e, info) => handleDragEnd(table.id, e, info)}
                                initial={{ x: table.posX, y: table.posY }}
                                animate={{ x: table.posX, y: table.posY }}
                                className="absolute left-0 top-0 cursor-move z-10"
                            >
                                <div className="w-24 h-24 bg-white rounded-2xl shadow-xl border-2 border-primary/20 flex flex-col items-center justify-center p-2 group hover:border-primary active:scale-95 transition-all">
                                    <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-1">
                                        {table.tableCode}
                                    </div>
                                    <p className="text-[10px] font-bold text-neutral-800 text-center truncate w-full">{table.name}</p>
                                    
                                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="h-6 w-6 rounded-full shadow-md bg-white border border-neutral-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTableForQR(table);
                                                setIsQRModalOpen(true);
                                            }}
                                        >
                                            <QrCode className="w-3 h-3 text-primary" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {hasChanges && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-lg animate-bounce"
                                onClick={handleBulkSave}
                                disabled={updatePositionsMutation.isPending}
                            >
                                {updatePositionsMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                LƯU SƠ ĐỒ MỚI
                            </Button>
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-neutral-200 text-xs font-medium text-neutral-500 flex items-center gap-2">
                        <Move className="w-3 h-3" /> Kéo thả để sắp xếp vị trí
                    </div>
                </Card>
            </div>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-center">Mã QR cho bàn {selectedTableForQR?.tableCode}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-6 py-6">
                        {selectedTableForQR && (
                            <>
                                <div className="p-4 bg-white rounded-3xl shadow-2xl border-8 border-primary/5">
                                    <QRCodeCanvas 
                                        id={`qr-${selectedTableForQR.id}`}
                                        value={getScanUrl(selectedTableForQR.id)} 
                                        size={200}
                                        level={"H"}
                                        includeMargin={true}
                                        imageSettings={{
                                            src: "/logo.png", // Replace with your logo path
                                            x: undefined,
                                            y: undefined,
                                            height: 40,
                                            width: 40,
                                            excavate: true,
                                        }}
                                    />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-bold text-neutral-800">{selectedTableForQR.name}</p>
                                    <p className="text-[10px] text-neutral-400 break-all">{getScanUrl(selectedTableForQR.id)}</p>
                                </div>
                                <Button className="w-full gap-2" onClick={() => downloadQR(selectedTableForQR)}>
                                    <Download className="w-4 h-4" />
                                    TẢI MÃ QR (.PNG)
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
