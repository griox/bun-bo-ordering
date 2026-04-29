'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    QrCode,
    Download,
    Save,
    Pencil,
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
    DialogDescription
} from '@/components/ui/dialog';
import { useTables, useCreateTableMutation, useUpdateTableMutation, useUpdateTablePositionsMutation, RestaurantTable } from '@/hooks/useTables';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

export default function TablesPage() {
    const { data: tables = [], isLoading } = useTables();
    const createTableMutation = useCreateTableMutation();
    const updateTableMutation = useUpdateTableMutation();
    const updatePositionsMutation = useUpdateTablePositionsMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [formData, setFormData] = useState({ tableCode: '', name: '' });

    // Local state for table positions across the floor plan
    const [localTables, setLocalTables] = useState<RestaurantTable[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when server data loads
    useEffect(() => {
        if (tables.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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


    const handleDragEnd = (id: string, _: unknown, info: { point: { x: number; y: number } }) => {
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
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `QR-${table.tableCode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    // The URL the QR code points to
    const getScanUrl = (tableId: string) => {
        // Sử dụng biến môi trường NEXT_PUBLIC_APP_URL nếu có (cho production),
        // Nếu không thì fallback về window.location.origin (cho local)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        return `${baseUrl}/scan/${tableId}`;
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý sơ đồ bàn</h2>
                    <p className="text-sm text-gray-500 mt-1">Thiết lập vị trí & mã QR gọi món kỹ thuật số.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl transition-all shadow-sm" onClick={() => resetForm()}>
                            <Plus className="size-4" />
                            THÊM BÀN MỚI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                        <form onSubmit={handleCreateOrUpdate} className="flex flex-col">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-gray-900">
                                        {editingTable ? 'Cập nhật bàn' : 'Tạo bàn mới'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-gray-500 mt-1">Gán mã định danh kỹ thuật cho bàn ăn</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Mã bàn</label>
                                    <Input
                                        required
                                        className="h-11 border-gray-200 rounded-xl bg-white text-sm font-bold focus:border-primary focus:ring-primary/20 transition-all"
                                        placeholder="Ví dụ: T1, VIP-01"
                                        value={formData.tableCode}
                                        onChange={e => setFormData({ ...formData, tableCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tên hiển thị</label>
                                    <Input
                                        required
                                        className="h-11 border-gray-200 rounded-xl bg-white text-sm font-bold focus:border-primary focus:ring-primary/20 transition-all"
                                        placeholder="Ví dụ: Bàn 1, Bàn cửa sổ"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1 h-10 border-gray-200 bg-white font-bold rounded-xl text-xs" onClick={() => setIsDialogOpen(false)}>HỦY BỎ</Button>
                                <Button type="submit" className="flex-[2] h-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs">
                                    LƯU THAY ĐỔI
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Table List */}
                <Card className="lg:col-span-1 border-none shadow-sm rounded-2xl p-6 h-[400px] lg:h-[650px] flex flex-col bg-white">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        DANH SÁCH BÀN
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                <Loader2 className="size-8 animate-spin text-[#ff4d4f]" />
                                <p className="font-black text-[10px] uppercase">Đang tải...</p>
                            </div>
                        ) : tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 group hover:border-primary/30 hover:bg-primary/5 transition-all">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm tracking-tight">{table.tableCode}</p>
                                    <p className="text-[11px] text-gray-500 font-medium">{table.name}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-blue-500 hover:text-white" onClick={() => openEditDialog(table)}>
                                        <Pencil className="size-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-[#ff4d4f] hover:text-white" onClick={() => {
                                        setSelectedTableForQR(table);
                                        setIsQRModalOpen(true);
                                    }}>
                                        <QrCode className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Right: Floor Plan (Drag & Drop area) */}
                <Card className="lg:col-span-3 h-[500px] lg:h-[650px] relative overflow-hidden bg-white border-none rounded-2xl shadow-sm">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-[0.3]"
                        style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* Visual Boundary Indicator */}
                    <div className="absolute inset-8 border border-dashed border-gray-100 rounded-xl pointer-events-none" />

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
                                <div className="size-24 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-2 group hover:border-primary hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                                    <div className="size-12 bg-gray-50 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all">
                                        <span className="font-bold text-sm tracking-tight">{table.tableCode}</span>
                                    </div>
                                    <p className="mt-1.5 text-[10px] font-bold text-gray-500 truncate w-full text-center">{table.name}</p>

                                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                                        <Button
                                            size="icon"
                                            className="size-8 rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTableForQR(table);
                                                setIsQRModalOpen(true);
                                            }}
                                        >
                                            <QrCode className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {hasChanges && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
                            <Button
                                className="h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-sm font-bold gap-3 shadow-2xl active:translate-y-px transition-all"
                                onClick={handleBulkSave}
                                disabled={updatePositionsMutation.isPending}
                            >
                                {updatePositionsMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                ĐỒNG BỘ VỊ TRÍ
                            </Button>
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white/80 backdrop-blur-md border border-gray-100 px-4 py-2 lg:px-6 lg:py-3 rounded-2xl shadow-sm text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 lg:gap-3 transition-all hover:bg-white hover:shadow-md">
                        <Move className="size-3 lg:size-4 text-[#ff4d4f]" /> GIỮ VÀ KÉO ĐỂ THAY ĐỔI VỊ TRÍ
                    </div>
                </Card>
            </div>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
                <DialogContent className="max-w-sm rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center text-gray-900">Mã QR Gọi món</DialogTitle>
                            <DialogDescription className="text-center text-sm text-gray-500 mt-1">Bàn: {selectedTableForQR?.tableCode} - {selectedTableForQR?.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex flex-col items-center gap-6 p-8">
                        {selectedTableForQR && (
                            <>
                                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 relative">
                                    <QRCodeCanvas
                                        id={`qr-${selectedTableForQR.id}`}
                                        value={getScanUrl(selectedTableForQR.id)}
                                        size={200}
                                        level={"H"}
                                        includeMargin={true}
                                        className="relative z-10"
                                    />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-medium text-gray-400 break-all line-clamp-1">{getScanUrl(selectedTableForQR.id)}</p>
                                </div>
                                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl shadow-md transition-all" onClick={() => downloadQR(selectedTableForQR)}>
                                    <Download className="size-4" />
                                    TẢI MÃ QR
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
