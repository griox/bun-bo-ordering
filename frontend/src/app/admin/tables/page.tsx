'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    Trash2,
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

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa bàn này?")) {
            deleteTableMutation.mutate(id);
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="size-14 bg-[#ff4d4f]/10 rounded-2xl flex items-center justify-center border border-[#ff4d4f]/20 shadow-sm transition-all group-hover:bg-[#ff4d4f] group-hover:text-white transition-all">
                        <QrCode className="size-8 text-[#ff4d4f]" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-black mb-0.5 uppercase tracking-tighter">SƠ ĐỒ BÀN</h2>
                        <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Thiết lập vị trí & mã QR gọi món kỹ thuật số</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger render={
                        <Button className="h-14 px-8 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-black text-sm gap-3 rounded-2xl border-none shadow-lg active:translate-y-px transition-all uppercase tracking-widest" onClick={() => resetForm()}>
                            <Plus className="size-5" />
                            THÊM BÀN MỚI
                        </Button>
                    } />
                    <DialogContent className="max-w-md rounded-[2rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white">
                        <form onSubmit={handleCreateOrUpdate} className="flex flex-col">
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black text-black uppercase tracking-tighter">
                                        {editingTable ? 'Cập nhật bàn' : 'Tạo bàn mới'}
                                    </DialogTitle>
                                    <DialogDescription className="font-bold text-gray-400 text-xs uppercase tracking-widest mt-1">Gán mã định danh kỹ thuật cho bàn ăn</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Mã bàn / Table Code</label>
                                    <Input
                                        required
                                        className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30 focus:border-[#ff4d4f] transition-all uppercase"
                                        placeholder="Ví dụ: T1, VIP-01"
                                        value={formData.tableCode}
                                        onChange={e => setFormData({ ...formData, tableCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Tên hiển thị / Alias</label>
                                    <Input
                                        required
                                        className="h-12 border border-gray-100 rounded-xl font-black bg-gray-50/30 focus:border-[#ff4d4f] transition-all uppercase"
                                        placeholder="Ví dụ: Bàn 1, Bàn cửa sổ"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                <Button type="button" variant="ghost" className="flex-1 h-12 border border-gray-100 bg-white font-black rounded-xl shadow-sm hover:bg-gray-100 transition-all uppercase text-[10px] tracking-widest" onClick={() => setIsDialogOpen(false)}>HỦY BỎ</Button>
                                <Button type="submit" className="flex-[2] h-12 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-black rounded-xl border-none shadow-lg active:translate-y-px transition-all uppercase text-[10px] tracking-widest">
                                    XÁC NHẬN LƯU
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Table List */}
                <Card className="lg:col-span-1 border border-gray-100 shadow-sm rounded-[2rem] p-6 h-[400px] lg:h-[650px] flex flex-col bg-white">
                    <h3 className="font-black text-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-3">
                        <div className="size-8 bg-[#ff4d4f]/10 rounded-lg flex items-center justify-center">
                            <Plus className="size-4 text-[#ff4d4f]" />
                        </div>
                        DANH SÁCH BÀN
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                                <Loader2 className="size-8 animate-spin text-[#ff4d4f]" />
                                <p className="font-black text-[10px] uppercase">Đang tải...</p>
                            </div>
                        ) : tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 bg-gray-50/50 group hover:border-[#ff4d4f]/30 hover:bg-[#ff4d4f]/5 transition-all">
                                <div>
                                    <p className="font-black text-black uppercase leading-none mb-1 tracking-tight text-sm">{table.tableCode}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{table.name}</p>
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
                <Card className="lg:col-span-3 h-[500px] lg:h-[650px] relative overflow-hidden bg-white border border-gray-100 rounded-[3rem] shadow-sm">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-[0.4]"
                        style={{ backgroundImage: 'radial-gradient(#E5E7EB 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />

                    {/* Visual Boundary Indicator */}
                    <div className="absolute inset-8 border border-dashed border-gray-200 rounded-[2.5rem] pointer-events-none" />

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
                                <div className="size-28 bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center p-3 group hover:border-[#ff4d4f] hover:translate-y-[-4px] transition-all duration-300">
                                    <div className="size-14 bg-gray-50 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:bg-[#ff4d4f] group-hover:text-white transition-all">
                                        <span className="font-black text-lg tracking-tighter">{table.tableCode}</span>
                                    </div>
                                    <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest truncate w-full text-center">{table.name}</p>

                                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                                        <Button
                                            size="icon"
                                            className="size-10 rounded-xl bg-[#ff4d4f] text-white border-none shadow-lg hover:bg-[#ff4d4f]/90"
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
                                className="h-16 px-10 bg-black hover:bg-black/90 text-white rounded-[2rem] border-none font-black text-lg gap-4 shadow-2xl active:translate-y-px transition-all uppercase tracking-widest"
                                onClick={handleBulkSave}
                                disabled={updatePositionsMutation.isPending}
                            >
                                {updatePositionsMutation.isPending ? (
                                    <Loader2 className="size-6 animate-spin" />
                                ) : (
                                    <Save className="size-6" />
                                )}
                                ĐỒNG BỘ SƠ ĐỒ
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
                <DialogContent className="max-w-md rounded-[3rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-center text-black uppercase tracking-tighter">PHÁT HÀNH MÃ QR</DialogTitle>
                            <DialogDescription className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest mt-1">Bàn: {selectedTableForQR?.tableCode} - {selectedTableForQR?.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex flex-col items-center gap-8 p-10">
                        {selectedTableForQR && (
                            <>
                                <div className="p-10 bg-white rounded-[3.5rem] shadow-2xl border border-gray-50 relative group">
                                    <div className="absolute inset-4 border border-dashed border-gray-100 rounded-[2.5rem] pointer-events-none" />
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
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest break-all line-clamp-1">{getScanUrl(selectedTableForQR.id)}</p>
                                </div>
                                <Button className="w-full h-14 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-black text-sm gap-3 rounded-2xl border-none shadow-lg active:translate-y-px transition-all uppercase tracking-widest" onClick={() => downloadQR(selectedTableForQR)}>
                                    <Download className="size-5" />
                                    TẢI MÃ XÁC THỰC
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
