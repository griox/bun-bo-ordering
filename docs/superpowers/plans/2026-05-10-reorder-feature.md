# Reorder Feature Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Sau khi quét QR, user đăng nhập thấy màn hình "Đặt như cũ?" để chọn lại đơn cũ hoặc món hay gọi, hệ thống nhớ preference trên server.

**Architecture:** Phase machine trong scan page (SCANNING → REORDER_PROMPT → REDIRECTING). Backend thêm entity UserOrderPreference + 2 endpoints GET/PUT. Frontend thêm hook + component ReorderPrompt.

**Tech Stack:** Next.js, Zustand, React Query, .NET 8 Minimal API, EF Core, MediatR

---

## Task 1: Backend — Entity & Migration

**Files:**
- Create: `backend/OrderService/OrderService.Domain/Entities/UserOrderPreference.cs`
- Modify: `backend/OrderService/OrderService.Infrastructure/Data/AppDbContext.cs`
- Modify: `backend/OrderService/OrderService.Application/Interfaces/IAppDbContext.cs`

- [ ] **Step 1: Tạo entity**

```csharp
// backend/OrderService/OrderService.Domain/Entities/UserOrderPreference.cs
using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class UserOrderPreference : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid PreferredOrderId { get; private set; }

    protected UserOrderPreference() { }

    public UserOrderPreference(Guid userId, Guid preferredOrderId)
    {
        UserId = userId;
        PreferredOrderId = preferredOrderId;
    }

    public void UpdatePreferredOrder(Guid orderId)
    {
        PreferredOrderId = orderId;
    }
}
```

- [ ] **Step 2: Thêm DbSet vào AppDbContext**

Trong `AppDbContext.cs`, thêm sau dòng `DbSet<Payment>`:
```csharp
public DbSet<UserOrderPreference> UserOrderPreferences => Set<UserOrderPreference>();
```

Trong `OnModelCreating`, thêm:
```csharp
builder.Entity<UserOrderPreference>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.UserId).IsUnique();
    entity.HasQueryFilter(e => !e.IsDeleted);
});
```

- [ ] **Step 3: Thêm vào IAppDbContext interface**

```csharp
DbSet<UserOrderPreference> UserOrderPreferences { get; }
```

- [ ] **Step 4: Tạo migration**

```bash
cd backend/OrderService/OrderService.Infrastructure
dotnet ef migrations add AddUserOrderPreference --startup-project ../OrderService.Api
```

Expected: migration file created successfully

- [ ] **Step 5: Commit**

```bash
git add backend/OrderService/
git commit -m "feat(order): add UserOrderPreference entity and migration"
```

---

## Task 2: Backend — CQRS Queries & Commands

**Files:**
- Create: `backend/OrderService/OrderService.Application/Orders/Queries/GetReorderPreferenceQuery.cs`
- Create: `backend/OrderService/OrderService.Application/Orders/Commands/SaveReorderPreferenceCommand.cs`

- [ ] **Step 1: Tạo GetReorderPreferenceQuery**

```csharp
// GetReorderPreferenceQuery.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Orders.Queries;

public record GetReorderPreferenceQuery(Guid UserId) : IRequest<Guid?>;

public class GetReorderPreferenceQueryHandler : IRequestHandler<GetReorderPreferenceQuery, Guid?>
{
    private readonly IAppDbContext _context;
    public GetReorderPreferenceQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Guid?> Handle(GetReorderPreferenceQuery request, CancellationToken cancellationToken)
    {
        var pref = await _context.UserOrderPreferences
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);
        return pref?.PreferredOrderId;
    }
}
```

- [ ] **Step 2: Tạo SaveReorderPreferenceCommand**

```csharp
// SaveReorderPreferenceCommand.cs
using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.Orders.Commands;

public record SaveReorderPreferenceCommand(Guid UserId, Guid PreferredOrderId) : IRequest;

public class SaveReorderPreferenceCommandHandler : IRequestHandler<SaveReorderPreferenceCommand>
{
    private readonly IAppDbContext _context;
    public SaveReorderPreferenceCommandHandler(IAppDbContext context) => _context = context;

    public async Task Handle(SaveReorderPreferenceCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.UserOrderPreferences
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (existing is null)
        {
            _context.UserOrderPreferences.Add(
                new UserOrderPreference(request.UserId, request.PreferredOrderId));
        }
        else
        {
            existing.UpdatePreferredOrder(request.PreferredOrderId);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/OrderService/OrderService.Application/
git commit -m "feat(order): add GetReorderPreference query and SaveReorderPreference command"
```

---

## Task 3: Backend — API Endpoints

**Files:**
- Modify: `backend/OrderService/OrderService.Api/Program.cs`

- [ ] **Step 1: Thêm 2 endpoints vào Program.cs**

Tìm đoạn `orderGroup.MapGet("/customer/{customerId:guid}/recent"` và thêm SAU đó:

```csharp
// GET /api/orders/preferences/reorder  (requires auth)
orderGroup.MapGet("/preferences/reorder", async (
    Microsoft.AspNetCore.Http.HttpContext httpContext,
    MediatR.IMediator mediator) =>
{
    var userIdClaim = httpContext.User.FindFirst("sub")
        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
    if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        return Results.Unauthorized();

    var preferredOrderId = await mediator.Send(
        new OrderService.Application.Orders.Queries.GetReorderPreferenceQuery(userId));
    return Results.Ok(new { preferredOrderId });
}).RequireAuthorization();

// PUT /api/orders/preferences/reorder  (requires auth)
orderGroup.MapPut("/preferences/reorder", async (
    Microsoft.AspNetCore.Http.HttpContext httpContext,
    MediatR.IMediator mediator,
    SavePreferenceRequest body) =>
{
    var userIdClaim = httpContext.User.FindFirst("sub")
        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
    if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
        return Results.Unauthorized();

    await mediator.Send(
        new OrderService.Application.Orders.Commands.SaveReorderPreferenceCommand(
            userId, body.PreferredOrderId));
    return Results.Ok();
}).RequireAuthorization();
```

Thêm record ở cuối file (trước `app.Run()`):
```csharp
record SavePreferenceRequest(Guid PreferredOrderId);
```

- [ ] **Step 2: Build để kiểm tra**

```bash
cd backend/OrderService/OrderService.Api
dotnet build
```

Expected: Build succeeded, 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/OrderService/OrderService.Api/Program.cs
git commit -m "feat(order): add GET/PUT /api/orders/preferences/reorder endpoints"
```

---

## Task 4: Frontend — Hook useReorderPreference

**Files:**
- Create: `frontend/src/hooks/useReorderPreference.ts`

- [ ] **Step 1: Tạo hook**

```typescript
// frontend/src/hooks/useReorderPreference.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axiosInstance';
import { useAuthStore } from '@/store/useAuthStore';

export function useReorderPreference() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<{ preferredOrderId: string | null }>({
        queryKey: ['reorder-preference'],
        enabled: !!token,
        queryFn: async () => {
            const { data } = await axiosInstance.get('/api/orders/preferences/reorder');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const savePreference = useMutation({
        mutationFn: async (preferredOrderId: string) => {
            await axiosInstance.put('/api/orders/preferences/reorder', { preferredOrderId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reorder-preference'] });
        },
    });

    return {
        preferredOrderId: data?.preferredOrderId ?? null,
        isLoading,
        savePreference,
    };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useReorderPreference.ts
git commit -m "feat(frontend): add useReorderPreference hook"
```

---

## Task 5: Frontend — Component ReorderPrompt

**Files:**
- Create: `frontend/src/components/order/ReorderPrompt.tsx`

- [ ] **Step 1: Tạo component**

```tsx
// frontend/src/components/order/ReorderPrompt.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Edit3, ArrowRight, X } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';
import { CartItem, useOrderStore } from '@/store/useOrderStore';
import { cn } from '@/lib/utils';

interface Props {
    orders: Order[];
    preferredOrderId: string | null;
    onConfirm: (selectedOrderId: string, saveAsDefault: boolean) => void;
    onSkip: () => void;
}

export function ReorderPrompt({ orders, preferredOrderId, onConfirm, onSkip }: Props) {
    const recentOrders = orders.slice(0, 5);

    // Compute top items across all orders
    const topItems = useMemo(() => {
        const map: Record<string, { item: OrderItem; totalQty: number }> = {};
        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                const key = item.foodId ?? item.dishId ?? item.id;
                if (!map[key]) map[key] = { item, totalQty: 0 };
                map[key].totalQty += item.quantity;
            });
        });
        return Object.values(map)
            .sort((a, b) => b.totalQty - a.totalQty)
            .slice(0, 5);
    }, [orders]);

    const [activeTab, setActiveTab] = useState<'recent' | 'top'>('recent');
    const [selectedId, setSelectedId] = useState<string>(
        preferredOrderId ?? recentOrders[0]?.id ?? ''
    );
    const [isEditingDefault, setIsEditingDefault] = useState(false);

    // Virtual "top items" order id
    const TOP_ITEMS_ID = '__top_items__';

    const handleSelect = (id: string) => {
        setSelectedId(id);
    };

    const handleConfirm = () => {
        onConfirm(selectedId, isEditingDefault);
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col font-main"
        >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-red-50">
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <h2 className="text-xl font-bold text-[#450A0A]">Đặt như cũ? 🍜</h2>
                        <p className="text-xs text-[#7f1d1d]/50 mt-0.5">Chọn đơn để nạp vào giỏ hàng ngay</p>
                    </div>
                    <button onClick={onSkip} className="size-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-3">
                    {([['recent', 'Đơn gần đây', Clock], ['top', 'Hay gọi nhất', Star]] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            onClick={() => {
                                setActiveTab(id);
                                if (id === 'top') setSelectedId(TOP_ITEMS_ID);
                                else setSelectedId(preferredOrderId ?? recentOrders[0]?.id ?? '');
                            }}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                                activeTab === id
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-[#7f1d1d]/60 border-red-100 hover:bg-red-50'
                            )}
                        >
                            <Icon size={12} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {activeTab === 'recent' ? (
                    recentOrders.map(order => (
                        <button
                            key={order.id}
                            onClick={() => handleSelect(order.id)}
                            className={cn(
                                'w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer',
                                selectedId === order.id
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-100 bg-white hover:border-red-200'
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-[#450A0A]">
                                        {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        {preferredOrderId === order.id && (
                                            <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Mặc định</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-[#7f1d1d]/50 mt-0.5">
                                        {order.orderItems?.length ?? 0} món · {order.totalAmount?.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                                <div className={cn(
                                    'size-5 rounded-full border-2 transition-all',
                                    selectedId === order.id ? 'bg-red-500 border-red-500' : 'border-gray-300'
                                )} />
                            </div>
                            {selectedId === order.id && (
                                <div className="mt-3 pt-3 border-t border-red-100 space-y-1">
                                    {order.orderItems?.slice(0, 3).map(item => (
                                        <p key={item.id} className="text-xs text-[#7f1d1d]/70">
                                            × {item.quantity} {item.productName ?? item.dishName}
                                        </p>
                                    ))}
                                    {(order.orderItems?.length ?? 0) > 3 && (
                                        <p className="text-xs text-[#7f1d1d]/40">+{(order.orderItems?.length ?? 0) - 3} món khác</p>
                                    )}
                                </div>
                            )}
                        </button>
                    ))
                ) : (
                    <button
                        onClick={() => handleSelect(TOP_ITEMS_ID)}
                        className={cn(
                            'w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer',
                            selectedId === TOP_ITEMS_ID
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-100 bg-white hover:border-red-200'
                        )}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-[#450A0A]">Combo các món hay gọi</p>
                            <div className={cn('size-5 rounded-full border-2 transition-all', selectedId === TOP_ITEMS_ID ? 'bg-red-500 border-red-500' : 'border-gray-300')} />
                        </div>
                        <div className="space-y-2">
                            {topItems.map(({ item, totalQty }) => (
                                <div key={item.id} className="flex items-center justify-between text-xs text-[#7f1d1d]/70">
                                    <span>{item.productName ?? item.dishName}</span>
                                    <span className="text-red-500 font-semibold">{totalQty}× đã gọi</span>
                                </div>
                            ))}
                        </div>
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-8 pt-4 border-t border-red-50 space-y-3">
                <button
                    onClick={() => setIsEditingDefault(v => !v)}
                    className={cn(
                        'flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer',
                        isEditingDefault ? 'text-red-600' : 'text-[#7f1d1d]/50 hover:text-red-600'
                    )}
                >
                    <Edit3 size={13} />
                    {isEditingDefault ? 'Đang chỉnh mặc định — nhấn Đặt để lưu' : 'Sửa lựa chọn mặc định'}
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                    Đặt như cũ
                    <ArrowRight size={16} />
                </button>

                <button
                    onClick={onSkip}
                    className="w-full py-2.5 rounded-2xl text-[#7f1d1d]/60 text-sm font-medium hover:text-[#450A0A] transition-colors cursor-pointer"
                >
                    Bỏ qua, tự chọn món
                </button>
            </div>
        </motion.div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/order/ReorderPrompt.tsx
git commit -m "feat(frontend): add ReorderPrompt component"
```

---

## Task 6: Frontend — Tích hợp vào Scan Page

**Files:**
- Modify: `frontend/src/app/scan/[tableId]/page.tsx`

- [ ] **Step 1: Viết lại scan page với phase machine**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useScanTableMutation } from '@/hooks/useTables';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerOrders } from '@/hooks/useOrders';
import { useReorderPreference } from '@/hooks/useReorderPreference';
import { Order } from '@/hooks/useOrders';
import { ReorderPrompt } from '@/components/order/ReorderPrompt';
import { Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

type Phase = 'scanning' | 'reorder_prompt' | 'redirecting';

export default function ScanPage() {
    const { tableId } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const scanMutation = useScanTableMutation();
    const { setSession, setTable, clearCart, addToCart } = useOrderStore();
    const [phase, setPhase] = useState<Phase>('scanning');

    const isLoggedIn = !!user?.userId;
    const { data: orders } = useCustomerOrders(isLoggedIn ? user?.userId : undefined);
    const { preferredOrderId, savePreference } = useReorderPreference();

    useEffect(() => {
        if (tableId) handleScan(tableId as string);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    const handleScan = async (id: string) => {
        try {
            const result = await scanMutation.mutateAsync(id);
            if (result.sessionId) {
                clearCart();
                setSession({ id: result.sessionId, tableId: id, startTime: new Date().toISOString(), isActive: true });
                setTable({ id, tableCode: '', name: 'Bàn vừa quét' });
                toast.success('Quét mã thành công! Chào mừng bạn đến với BunBo.');

                if (isLoggedIn && orders && orders.length > 0) {
                    setPhase('reorder_prompt');
                } else {
                    setPhase('redirecting');
                    router.push('/menu');
                }
            }
        } catch {
            toast.error('Mã QR không hợp lệ hoặc đã hết hạn.');
            router.push('/menu');
        }
    };

    const handleReorderConfirm = async (selectedId: string, saveAsDefault: boolean) => {
        const TOP_ITEMS_ID = '__top_items__';

        if (selectedId === TOP_ITEMS_ID) {
            // Compute top items from all orders
            const map: Record<string, { foodId: string; name: string; price: number; qty: number }> = {};
            (orders ?? []).forEach(order => {
                order.orderItems?.forEach(item => {
                    const key = item.foodId ?? item.dishId ?? item.id;
                    if (!map[key]) map[key] = { foodId: key, name: item.productName ?? item.dishName ?? '', price: item.unitPrice, qty: 0 };
                    map[key].qty += item.quantity;
                });
            });
            Object.values(map)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5)
                .forEach(({ foodId, name, price, qty }) => {
                    addToCart({ foodId, name, price, quantity: qty });
                });
        } else {
            const selectedOrder = (orders ?? []).find((o: Order) => o.id === selectedId);
            if (selectedOrder) {
                selectedOrder.orderItems?.forEach(item => {
                    addToCart({
                        foodId: item.foodId ?? item.dishId ?? item.id,
                        name: item.productName ?? item.dishName ?? '',
                        price: item.unitPrice,
                        quantity: item.quantity,
                        note: item.note,
                    });
                });
                if (saveAsDefault) {
                    await savePreference.mutateAsync(selectedId);
                }
            }
        }

        setPhase('redirecting');
        router.push('/menu');
    };

    const handleSkip = () => {
        setPhase('redirecting');
        router.push('/menu');
    };

    if (phase === 'reorder_prompt' && orders && orders.length > 0) {
        return (
            <div className="h-screen w-full bg-black/40 backdrop-blur-sm relative">
                <AnimatePresence>
                    <ReorderPrompt
                        orders={orders}
                        preferredOrderId={preferredOrderId}
                        onConfirm={handleReorderConfirm}
                        onSkip={handleSkip}
                    />
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6 px-10">
            <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-primary text-white p-8 rounded-[2.5rem] shadow-2xl">
                    <QrCode className="w-16 h-16 animate-bounce" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-neutral-800">Đang nhận diện bàn...</h1>
                <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                    Vui lòng đợi trong giây lát, chúng tôi đang kết nối bạn với nhà bếp.
                </p>
            </div>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/scan/[tableId]/page.tsx
git commit -m "feat(frontend): integrate ReorderPrompt into scan page with phase machine"
```

---

## Task 7: Apply Migration & Verification

- [ ] **Step 1: Apply migration**

```bash
cd backend/OrderService/OrderService.Api
dotnet ef database update --project ../OrderService.Infrastructure
```

Expected: Applied migration AddUserOrderPreference

- [ ] **Step 2: Restart dev server nếu cần**

```bash
# Trong terminal frontend
# npm run dev đang chạy — hot reload tự động
```

- [ ] **Step 3: Kiểm tra manual**

1. Đăng nhập với user đã có lịch sử đơn hàng
2. Truy cập `/scan/<tableId>` — thấy màn hình "Đặt như cũ?"
3. Chọn đơn → nhấn "Đặt như cũ" → vào `/menu` → cart có sẵn món
4. "Bỏ qua" → `/menu` → cart trống
5. Bật "Sửa lựa chọn mặc định" → chọn đơn → confirm → scan lại → đơn đó pre-selected
6. Truy cập với user chưa đăng nhập → redirect thẳng `/menu`

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete reorder feature — scan page shows order history prompt for logged-in users"
```
