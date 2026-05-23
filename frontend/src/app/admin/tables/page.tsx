'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    QrCode,
    Download,
    Save,
    Pencil,
    Move,
    Loader2,
    LayoutDashboard
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/pagination';
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
import { useUnreadOrders, UnreadOrder } from '@/hooks/useUnreadOrders';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

export default function TablesPage() {
    const { data: tables = [], isLoading } = useTables();
    const createTableMutation = useCreateTableMutation();
    const updateTableMutation = useUpdateTableMutation();
    const updatePositionsMutation = useUpdateTablePositionsMutation();
    const { unreadOrders, markAsRead, isMarkingAsRead } = useUnreadOrders();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [formData, setFormData] = useState({ tableCode: '', name: '' });

    // Pagination State
    const [page, setPage] = useState(0);
    const pageSize = 6;
    const totalPages = Math.ceil(tables.length / pageSize);
    const paginatedTables = tables.slice(page * pageSize, (page + 1) * pageSize);

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

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedTableForOrders, setSelectedTableForOrders] = useState<RestaurantTable | null>(null);

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
                        <Button className="min-h-[48px] px-6 bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl transition-all shadow-sm" onClick={() => resetForm()}>
                            <Plus className="size-4" />
                            THÊM BÀN MỚI
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white border-none rounded-3xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreateOrUpdate} className="flex flex-col">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                        <LayoutDashboard className="size-7 text-red-400" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                            {editingTable ? 'Cập nhật bàn' : 'Tạo bàn mới'}
                                        </DialogTitle>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Gán mã định danh kỹ thuật cho bàn ăn</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 bg-white">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Mã định danh bàn</label>
                                    <Input
                                        required
                                        className="h-14 border-2 border-gray-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-base"
                                        placeholder="Ví dụ: T1, VIP-01"
                                        value={formData.tableCode}
                                        onChange={e => setFormData({ ...formData, tableCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tên hiển thị nội bộ</label>
                                    <Input
                                        required
                                        className="h-14 border-2 border-gray-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-base"
                                        placeholder="Ví dụ: Bàn 1, Bàn cửa sổ"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
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
                                    className="h-12 px-10 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    {editingTable ? 'Lưu thay đổi' : 'Tạo bàn ngay'}
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
                        ) : paginatedTables.map(table => {
                            const tableOrders = unreadOrders.filter(o => o.tableCode === table.tableCode);
                            const hasUnread = tableOrders.length > 0;
                            return (
                                <div key={table.id} 
                                    className={`relative flex items-center justify-between p-3 rounded-xl border group hover:shadow-sm transition-all cursor-pointer ${hasUnread ? 'border-red-500 bg-red-50/20 hover:border-red-600' : 'border-gray-100 bg-gray-50/30 hover:border-primary/30 hover:bg-primary/5'}`}
                                    onDoubleClick={() => {
                                        if (hasUnread) {
                                            setSelectedTableForOrders(table);
                                            setIsOrderModalOpen(true);
                                        }
                                    }}
                                    onClick={() => {
                                        if (hasUnread) {
                                            setSelectedTableForOrders(table);
                                            setIsOrderModalOpen(true);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className={`size-12 rounded-xl flex items-center justify-center shadow-sm border transition-all ${hasUnread ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-100 group-hover:bg-primary group-hover:text-white'}`}>
                                            <span className="font-bold text-sm tracking-tight">{table.tableCode}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-base md:text-sm tracking-tight">{table.tableCode}</p>
                                            <p className="text-xs md:text-[11px] text-gray-500 font-medium">{table.name}</p>
                                            <p className="text-[10px] md:text-[8px] text-gray-300 font-mono mt-1">ID: {table.id}</p>
                                        </div>
                                    </div>
                                    
                                    {hasUnread && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white size-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm animate-pulse z-10">
                                            {tableOrders.length}
                                        </div>
                                    )}

                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all scale-100 lg:scale-90 lg:group-hover:scale-100 relative z-20">
                                        <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-blue-500 hover:text-white" onClick={(e) => { e.stopPropagation(); openEditDialog(table); }}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#ff4d4f] hover:text-white" onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTableForQR(table);
                                            setIsQRModalOpen(true);
                                        }}>
                                            <QrCode className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Pagination for table list */}
                    <div className="pt-4 mt-auto border-t border-gray-50 flex flex-col items-center gap-2">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            Trang {page + 1} / {totalPages || 1}
                        </p>
                        <AdminPagination 
                            currentPage={page} 
                            totalPages={totalPages} 
                            onPageChange={setPage} 
                        />
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
                        {localTables.map(table => {
                            const tableOrders = unreadOrders.filter(o => o.tableCode === table.tableCode);
                            const hasUnread = tableOrders.length > 0;
                            return (
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
                                    <div 
                                        className={`size-24 bg-white rounded-2xl shadow-lg border flex flex-col items-center justify-center p-2 group hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative ${hasUnread ? 'border-red-500 animate-pulse' : 'border-gray-100 hover:border-primary'}`}
                                        onDoubleClick={(e) => {
                                            if (hasUnread) {
                                                e.stopPropagation();
                                                setSelectedTableForOrders(table);
                                                setIsOrderModalOpen(true);
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (hasUnread) {
                                                e.stopPropagation();
                                                setSelectedTableForOrders(table);
                                                setIsOrderModalOpen(true);
                                            }
                                        }}
                                    >
                                        <div className={`size-12 rounded-xl flex items-center justify-center shadow-sm border transition-all ${hasUnread ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-100 group-hover:bg-primary group-hover:text-white'}`}>
                                            <span className="font-bold text-sm tracking-tight">{table.tableCode}</span>
                                        </div>
                                        <p className="mt-1.5 text-[10px] font-bold text-gray-500 truncate w-full text-center">{table.name}</p>

                                        {hasUnread && (
                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white size-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm z-10 animate-bounce">
                                                {tableOrders.length}
                                            </div>
                                        )}

                                        <div className="absolute -top-3 -left-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all scale-100 lg:scale-0 lg:group-hover:scale-100 z-20">
                                            <Button
                                                size="icon"
                                                className="min-h-[44px] min-w-[44px] rounded-xl bg-primary text-white shadow-lg hover:bg-primary/90"
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
                            );
                        })}
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
                                <Button className="w-full min-h-[48px] bg-primary hover:bg-primary/90 text-white font-bold text-sm gap-2 rounded-xl shadow-md transition-all" onClick={() => downloadQR(selectedTableForQR)}>
                                    <Download className="size-5" />
                                    TẢI MÃ QR
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center text-gray-900">Thông báo đơn mới</DialogTitle>
                            <DialogDescription className="text-center text-sm text-gray-500 mt-1">Bàn {selectedTableForOrders?.tableCode} - {selectedTableForOrders?.name}</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex flex-col gap-4 p-8 max-h-[60vh] overflow-y-auto">
                        {selectedTableForOrders && unreadOrders
                            .filter(o => o.tableCode === selectedTableForOrders.tableCode)
                            .map(order => (
                                <div key={order.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-gray-400 font-mono tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</span>
                                        <div className="flex items-center gap-2">
                                            {order.paymentMethod === 'Transfer' ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                    Đã thanh toán
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                    Chưa thanh toán
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d4f] animate-pulse">
                                                Mới
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3">
                                        {order.items?.map((item, idx) => (
                                            <li key={idx} className="text-sm flex flex-col pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-700">{item.productName}</span>
                                                    <span className="font-black bg-gray-100 px-2.5 py-1 rounded-lg text-xs">x{item.quantity}</span>
                                                </div>
                                                {item.note && (
                                                    <div className="text-xs text-gray-500 mt-1 italic pl-2 border-l-2 border-gray-200">
                                                        Ghi chú: {item.note}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        
                        <Button
                            className="w-full min-h-[48px] mt-4 bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold text-sm gap-2 rounded-xl shadow-md transition-all"
                            disabled={isMarkingAsRead}
                            onClick={() => {
                                if (selectedTableForOrders) {
                                    markAsRead(selectedTableForOrders.tableCode);
                                    setIsOrderModalOpen(false);
                                }
                            }}
                        >
                            {isMarkingAsRead ? <Loader2 className="size-5 animate-spin" /> : null}
                            XÁC NHẬN ĐÃ XEM
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
