'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus,
    QrCode,
    Save,
    Pencil,
    Move,
    Loader2,
    LayoutDashboard,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTables, useCreateTableMutation, useUpdateTableMutation, useUpdateTablePositionsMutation, useDeleteTableMutation, RestaurantTable } from '@/hooks/useTables';
import { useUnreadOrders } from '@/hooks/useUnreadOrders';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function TablesPage() {
    const t = useTranslations('Tables');
    const { data: tables = [] } = useTables();
    const createTableMutation = useCreateTableMutation();
    const updateTableMutation = useUpdateTableMutation();
    const updatePositionsMutation = useUpdateTablePositionsMutation();
    const deleteTableMutation = useDeleteTableMutation();
    const { unreadOrders, markAsRead, isMarkingAsRead } = useUnreadOrders();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [formData, setFormData] = useState({ tableCode: '', name: '' });

    // Local state for table positions across the floor plan
    const [localTables, setLocalTables] = useState<RestaurantTable[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [dragTarget, setDragTarget] = useState<{x: number, y: number} | null>(null);

    // Sync local state when server data loads
    useEffect(() => {
        if (tables.length > 0) {
             
            setLocalTables(tables);
        }
    }, [tables]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

    const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
    const filteredOrders = React.useMemo(() => {
        if (!selectedTable) return [];
        return unreadOrders.filter(o => o.tableCode === selectedTable.tableCode);
    }, [selectedTable, unreadOrders]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: filteredOrders.length,
        getScrollElement: () => listElement,
        estimateSize: () => 180,
        overscan: 5,
    });

    const floorPlanRef = useRef<HTMLDivElement>(null);
    const dragHasMoved = useRef(false);

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

    const handleDeleteTable = (id: string) => {
        deleteTableMutation.mutate(id, {
            onSuccess: () => {
                setIsDetailModalOpen(false);
                setSelectedTable(null);
            }
        });
    };

    const resetForm = () => {
        setFormData({ tableCode: '', name: '' });
        setEditingTable(null);
    };

    const openEditDialog = (table: RestaurantTable) => {
        setEditingTable(table);
        setFormData({ tableCode: table.tableCode, name: table.name });
        setIsDialogOpen(true);
        setIsDetailModalOpen(false); // Close detail modal if open
    };

    const GRID_SIZE = 120;

    const calculateSnappedPosition = (info: { point: { x: number; y: number } }) => {
        if (!floorPlanRef.current) return { x: 0, y: 0 };
        const rect = floorPlanRef.current.getBoundingClientRect();
        
        const rawX = info.point.x - rect.left - 48;
        const rawY = info.point.y - rect.top - 48;

        const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
        const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

        const maxX = Math.floor((rect.width - 96) / GRID_SIZE) * GRID_SIZE;
        const maxY = Math.floor((rect.height - 96) / GRID_SIZE) * GRID_SIZE;

        return {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY))
        };
    };

    const handleDrag = (_: unknown, info: { point: { x: number; y: number } }) => {
        const snapped = calculateSnappedPosition(info);
        setDragTarget(prev => (prev?.x === snapped.x && prev?.y === snapped.y) ? prev : snapped);
    };

    const handleDragEnd = (id: string, _: unknown, info: { point: { x: number; y: number } }) => {
        const snapped = calculateSnappedPosition(info);

        setLocalTables(prev => prev.map(t =>
            t.id === id ? { ...t, posX: snapped.x, posY: snapped.y } : t
        ));
        setDragTarget(null);
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

    const getScanUrl = (tableId: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        return `${baseUrl}/scan/${tableId}`;
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('title')}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="min-h-[48px] px-6 bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 rounded-xl transition-all shadow-sm" onClick={() => resetForm()}>
                            <Plus className="size-4" />
                            {t('addNewTable')}
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
                                            {editingTable ? t('updateTable') : t('createNewTable')}
                                        </DialogTitle>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">{t('tableIdentifierDesc')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 bg-white">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{t('tableIdLabel')}</label>
                                    <Input
                                        required
                                        className="h-14 border-2 border-gray-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-base"
                                        placeholder={t('tableIdPlaceholder')}
                                        value={formData.tableCode}
                                        onChange={e => setFormData({ ...formData, tableCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{t('displayNameLabel')}</label>
                                    <Input
                                        required
                                        className="h-14 border-2 border-gray-100 rounded-2xl bg-gray-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-gray-900 placeholder:text-gray-300 text-base"
                                        placeholder={t('displayNamePlaceholder')}
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
                                    {t('cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-12 px-10 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    {editingTable ? t('saveChanges') : t('createNow')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Floor Plan (Drag & Drop area) */}
            <Card className="w-full h-[600px] lg:h-[750px] relative overflow-hidden bg-white border-none rounded-2xl shadow-sm">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ 
                        backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)', 
                        backgroundSize: '120px 120px',
                        backgroundPosition: '32px 32px'
                    }} />


                <div ref={floorPlanRef} className="absolute inset-0 w-full h-full p-8">
                    {/* Drop Target Indicator */}
                    {dragTarget && (
                        <div 
                            className="absolute size-24 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-2xl pointer-events-none transition-all duration-150 z-30"
                            style={{
                                left: dragTarget.x,
                                top: dragTarget.y,
                            }}
                        />
                    )}

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
                                onDrag={handleDrag}
                                onDragEnd={(e, info) => handleDragEnd(table.id, e, info)}
                                onDragStart={() => dragHasMoved.current = true}
                                onPointerDown={() => dragHasMoved.current = false}
                                initial={{ x: table.posX, y: table.posY }}
                                animate={{ x: table.posX, y: table.posY }}
                                whileDrag={{ scale: 1.1, zIndex: 50 }}
                                className="absolute left-0 top-0 cursor-grab active:cursor-grabbing"
                            >
                                <div 
                                    className={`size-24 bg-white rounded-2xl shadow-lg border flex flex-col items-center justify-center p-2 group hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative ${hasUnread ? 'border-red-500 animate-pulse' : 'border-gray-100 hover:border-primary'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (dragHasMoved.current) return;
                                        setSelectedTable(table);
                                        setIsDetailModalOpen(true);
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
                            {t('syncPosition')}
                        </Button>
                    </div>
                )}

                <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white/80 backdrop-blur-md border border-gray-100 px-4 py-2 lg:px-6 lg:py-3 rounded-2xl shadow-sm text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 lg:gap-3 transition-all hover:bg-white hover:shadow-md">
                    <Move className="size-3 lg:size-4 text-[#ff4d4f]" /> {t('dragInstruction')}
                </div>
            </Card>

            {/* Unified Table Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {t('table')} {selectedTable?.tableCode}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 mt-1">
                                {selectedTable?.name}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="size-10 rounded-xl" onClick={() => selectedTable && openEditDialog(selectedTable)}>
                                <Pencil className="size-4 text-gray-600" />
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="outline" className="size-10 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                        <Trash2 className="size-4 text-red-500" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold text-gray-900">Xác nhận xóa bàn</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-gray-500">
                                            Bạn đang chuẩn bị xóa bàn <span className="font-bold text-gray-900">{selectedTable?.tableCode}</span>. Hành động này không thể hoàn tác.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-100 text-gray-700 font-bold h-12 px-6">Hủy</AlertDialogCancel>
                                        <AlertDialogAction 
                                            className="rounded-xl bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-12 px-6 shadow-md shadow-red-500/20"
                                            onClick={() => selectedTable && handleDeleteTable(selectedTable.id)}
                                        >
                                            Xóa bàn
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button size="icon" variant="outline" className="size-10 rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => selectedTable && downloadQR(selectedTable)}>
                                <QrCode className="size-4 text-primary" />
                            </Button>
                        </div>
                    </div>

                    {/* Hidden QR for downloading */}
                    {selectedTable && (
                        <div className="hidden">
                            <QRCodeCanvas
                                id={`qr-${selectedTable.id}`}
                                value={getScanUrl(selectedTable.id)}
                                size={200}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>
                    )}

                    {/* Body: Order List */}
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">{t('newOrderNotification')}</h3>
                        
                        {filteredOrders.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <LayoutDashboard className="size-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">Không có đơn hàng mới nào.</p>
                            </div>
                        ) : (
                            <div ref={setListElement} className="flex flex-col max-h-[40vh] overflow-y-auto custom-scrollbar">
                                <div
                                    style={{
                                        height: `${virtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative',
                                    }}
                                >
                                    {virtualizer.getVirtualItems().map((virtualItem) => {
                                        const order = filteredOrders[virtualItem.index];
                                        return (
                                            <div
                                                key={virtualItem.key}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${virtualItem.start}px)`,
                                                }}
                                                className="pb-4"
                                            >
                                                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs text-gray-400 font-mono tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                        <div className="flex items-center gap-2">
                                                            {order.paymentMethod === 'Transfer' ? (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                                    {t('paid')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                                                    {t('unpaid')}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4d4f] animate-pulse">
                                                                {t('new')}
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
                                                                        {t('note')} {item.note}
                                                                    </div>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                        
                    {/* Footer */}
                    {filteredOrders.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <Button
                                className="w-full min-h-[48px] bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold text-sm gap-2 rounded-xl shadow-md transition-all"
                                disabled={isMarkingAsRead}
                                onClick={() => {
                                    if (selectedTable) {
                                        markAsRead(selectedTable.tableCode);
                                        setIsDetailModalOpen(false);
                                    }
                                }}
                            >
                                {isMarkingAsRead ? <Loader2 className="size-5 animate-spin" /> : null}
                                {t('confirmSeen')}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
