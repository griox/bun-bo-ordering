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
        if (!floorPlanRef.current) return;

        const rect = floorPlanRef.current.getBoundingClientRect();

        // Calculate new X, Y based on mouse point relative to container
        // Subtract 48 (half of table width 96) to make the drop point the center of the table
        let x = Math.round(info.point.x - rect.left - 48);
        let y = Math.round(info.point.y - rect.top - 48);

        // Strict boundary clamping
        const maxX = rect.width - 96;
        const maxY = rect.height - 96;

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        setLocalTables(prev => prev.map(t =>
            t.id === id ? { ...t, posX: x, posY: y } : t
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
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.1)] border-2 border-black -rotate-3">
                        <Plus className="size-8 text-white rotate-3" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-display font-bold text-black mb-1 uppercase tracking-tight">SƠ ĐỒ BÀN</h2>
                        <p className="text-black/60 font-medium">Thiết lập vị trí bàn và mã QR gọi món cho khách.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger render={
                        <Button className="h-14 px-8 bg-black hover:bg-black/90 text-white font-display font-bold text-sm gap-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all" onClick={() => resetForm()}>
                            <Plus className="size-5" />
                            THÊM BÀN MỚI
                        </Button>
                    } />
                    <DialogContent className="max-w-md rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.1)] p-0 overflow-hidden bg-white">
                        <form onSubmit={handleCreateOrUpdate} className="flex flex-col">
                            <div className="p-8 border-b-2 border-text/5 bg-background">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-display font-bold text-text uppercase">
                                        {editingTable ? 'CẬP NHẬT BÀN' : 'THÊM BÀN MỚI'}
                                    </DialogTitle>
                                    <DialogDescription className="font-medium text-text/60">Nhập mã và tên hiển thị cho bàn ăn này.</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Mã bàn (Dùng để nhận diện)</label>
                                    <Input
                                        required
                                        className="h-12 border-2 border-text/10 rounded-xl font-bold bg-background/50 focus:bg-paper focus:border-primary transition-all uppercase"
                                        placeholder="Ví dụ: T1, VIP-01"
                                        value={formData.tableCode}
                                        onChange={e => setFormData({ ...formData, tableCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-display font-bold text-text/40 uppercase tracking-widest pl-1">Tên hiển thị</label>
                                    <Input
                                        required
                                        className="h-12 border-2 border-text/10 rounded-xl font-bold bg-background/50 focus:bg-paper focus:border-primary transition-all uppercase"
                                        placeholder="Ví dụ: Bàn 1, Bàn cửa sổ"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-black/[0.02] border-t-2 border-black/5 flex gap-4">
                                <Button type="button" variant="outline" className="flex-1 h-12 border-2 border-black font-display font-bold rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all uppercase hover:bg-black/5" onClick={() => setIsDialogOpen(false)}>HỦY</Button>
                                <Button type="submit" className="flex-[2] h-12 bg-black hover:bg-black/90 text-white font-display font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all uppercase">
                                    LƯU THÔNG TIN
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Table List */}
                <Card className="lg:col-span-1 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 h-[400px] lg:h-[650px] flex flex-col bg-white">
                    <h3 className="font-display font-bold text-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3">
                        <div className="size-8 bg-black/5 rounded-lg flex items-center justify-center">
                            <Plus className="size-4 text-black" />
                        </div>
                        DANH SÁCH BÀN
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                <Loader2 className="size-8 animate-spin" />
                                <p className="font-display font-bold text-[10px] uppercase">Đang tải...</p>
                            </div>
                        ) : tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-black/5 bg-black/[0.02] group hover:border-black hover:bg-black/5 transition-all">
                                <div>
                                    <p className="font-display font-bold text-black uppercase leading-none mb-1">{table.tableCode}</p>
                                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-tighter">{table.name}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-black hover:text-white" onClick={() => openEditDialog(table)}>
                                        <Pencil className="size-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-black hover:text-white" onClick={() => {
                                        setSelectedTableForQR(table);
                                        setIsQRModalOpen(true);
                                    }}>
                                        <QrCode className="size-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-black hover:text-white" onClick={() => handleDelete(table.id)}>
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Right: Floor Plan (Drag & Drop area) */}
                <Card className="lg:col-span-3 h-[500px] lg:h-[650px] relative overflow-hidden bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0px_rgba(0,0,0,0.05)]">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-[0.2]"
                        style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    {/* Visual Boundary Indicator */}
                    <div className="absolute inset-8 border-4 border-dashed border-text/5 rounded-[2.5rem] pointer-events-none" />

                    <div ref={floorPlanRef} className="absolute inset-0 w-full h-full p-8">
                        {localTables.map(table => (
                            <motion.div
                                key={table.id}
                                drag
                                dragConstraints={floorPlanRef}
                                dragElastic={0.05}
                                dragMomentum={false}
                                onDragEnd={(e, info) => handleDragEnd(table.id, e, info)}
                                initial={{ x: table.posX, y: table.posY }}
                                animate={{ x: table.posX, y: table.posY }}
                                whileDrag={{ scale: 1.1, zIndex: 50 }}
                                className="absolute left-0 top-0 cursor-grab active:cursor-grabbing"
                            >
                                <div className="size-28 bg-paper rounded-[2rem] shadow-[6px_6px_0px_#2D2D2D] border-4 border-text flex flex-col items-center justify-center p-3 group hover:border-primary hover:shadow-[8px_8px_0px_#D9381E] transition-all duration-300">
                                    <div className="size-14 bg-background rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#2D2D2D] border-2 border-text -rotate-3 group-hover:bg-primary group-hover:text-white transition-all">
                                        <span className="font-display font-bold text-lg rotate-3 tracking-tighter">{table.tableCode}</span>
                                    </div>
                                    <p className="mt-2 text-[10px] font-display font-bold text-text/40 uppercase tracking-tighter truncate w-full text-center">{table.name}</p>

                                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                                        <Button
                                            size="icon"
                                            className="size-10 rounded-xl bg-primary text-white border-2 border-text shadow-[4px_4px_0px_#2D2D2D] hover:bg-primary/90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTableForQR(table);
                                                setIsQRModalOpen(true);
                                            }}
                                        >
                                            <QrCode className="size-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {hasChanges && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50">
                            <Button
                                className="h-16 px-10 bg-black hover:bg-black/90 text-white rounded-[2rem] border-4 border-black font-display font-bold text-lg gap-4 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[4px_4px_0px_rgba(0,0,0,0.05)] transition-all"
                                onClick={handleBulkSave}
                                disabled={updatePositionsMutation.isPending}
                            >
                                {updatePositionsMutation.isPending ? (
                                    <Loader2 className="size-6 animate-spin" />
                                ) : (
                                    <Save className="size-6" />
                                )}
                                LƯU SƠ ĐỒ MỚI
                            </Button>
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white border-2 border-black px-4 py-2 lg:px-6 lg:py-3 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] text-[9px] lg:text-[10px] font-display font-bold text-black uppercase tracking-widest flex items-center gap-2 lg:gap-3">
                        <Move className="size-3 lg:size-4 text-black" /> GIỮ VÀ KÉO ĐỂ THAY ĐỔI VỊ TRÍ
                    </div>
                </Card>
            </div>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
                <DialogContent className="max-w-md rounded-[3rem] border-4 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.1)] p-0 overflow-hidden bg-white">
                    <div className="p-8 border-b-2 border-black/5 bg-black/[0.02]">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-display font-bold text-center text-black uppercase">BÀN {selectedTableForQR?.tableCode}</DialogTitle>
                            <DialogDescription className="text-center font-medium text-black/60 italic tracking-tight">{selectedTableForQR?.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex flex-col items-center gap-8 p-10">
                        {selectedTableForQR && (
                            <>
                                <div className="p-10 bg-white rounded-[3.5rem] shadow-[20px_20px_60px_rgba(0,0,0,0.05)] border-4 border-black relative group">
                                    <div className="absolute inset-4 border-2 border-dashed border-black/10 rounded-[2.5rem] pointer-events-none" />
                                    <QRCodeCanvas
                                        id={`qr-${selectedTableForQR.id}`}
                                        value={getScanUrl(selectedTableForQR.id)}
                                        size={220}
                                        level={"H"}
                                        includeMargin={true}
                                        className="relative z-10"
                                        imageSettings={{
                                            src: "/logo.png",
                                            x: undefined,
                                            y: undefined,
                                            height: 48,
                                            width: 48,
                                            excavate: true,
                                        }}
                                    />
                                </div>
                                <div className="text-center space-y-2 opacity-50 px-6">
                                    <p className="text-[10px] font-display font-bold text-black uppercase tracking-widest break-all line-clamp-1">{getScanUrl(selectedTableForQR.id)}</p>
                                </div>
                                <Button className="w-full h-14 bg-black hover:bg-black/90 text-white font-display font-bold text-sm gap-3 rounded-2xl border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[3px_3px_0px_rgba(0,0,0,0.05)] transition-all uppercase" onClick={() => downloadQR(selectedTableForQR)}>
                                    <Download className="size-5" />
                                    TẢI MÃ QR NGAY
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
