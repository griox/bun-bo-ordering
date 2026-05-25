# Virtualized Orders List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai thư viện `@tanstack/react-virtual` vào Modal chi tiết Đơn hàng của Bàn (Admin Tables Page) để xử lý việc render hàng ngàn đơn hàng cùng lúc mà không gây lag DOM.

**Architecture:** Sử dụng thư viện ảo hóa headless `@tanstack/react-virtual`. Thay vì `.map()` trực tiếp mảng `unreadOrders`, ta sẽ bọc danh sách bằng một container có `overflow-y-auto`, gán `ref`, và truyền `virtualizer.getVirtualItems()` vào để chỉ render những item nào đang xuất hiện trong khung nhìn (Viewport).

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, `@tanstack/react-virtual`.

---

### Task 1: Cài đặt Dependency

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Cài đặt thư viện @tanstack/react-virtual**

```bash
cd frontend && npm install @tanstack/react-virtual
```

---

### Task 2: Tích hợp Virtualizer vào Component

**Files:**
- Modify: `frontend/src/app/[locale]/admin/tables/page.tsx`

- [ ] **Step 1: Import Hook từ thư viện**

```tsx
// Thêm vào đầu file
import { useVirtualizer } from '@tanstack/react-virtual';
```

- [ ] **Step 2: Cài đặt logic Virtualizer trong Component**

Thêm ngay bên dưới dòng `const [selectedTableForOrders, setSelectedTableForOrders] = useState<RestaurantTable | null>(null);`:

```tsx
    const parentRef = useRef<HTMLDivElement>(null);
    
    // Lọc trước danh sách đơn hàng cho bàn được chọn
    const filteredOrders = React.useMemo(() => {
        if (!selectedTableForOrders) return [];
        return unreadOrders.filter(o => o.tableCode === selectedTableForOrders.tableCode);
    }, [selectedTableForOrders, unreadOrders]);

    // Khởi tạo Virtualizer
    const virtualizer = useVirtualizer({
        count: filteredOrders.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 180, // Chiều cao ước tính của 1 order card
        overscan: 5,
    });
```

- [ ] **Step 3: Sửa đổi JSX trong Modal Đơn Hàng**

Thay thế đoạn mã JSX từ `<div className="flex flex-col gap-4 p-8 max-h-[60vh] overflow-y-auto">` cho đến trước `<Button className="w-full...` bằng đoạn mã sau:

```tsx
                    <div ref={parentRef} className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                        
                        {/* Nút Confirm Seen giữ nguyên */}
```

- [ ] **Step 4: Kiểm tra Build & Chạy thử**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit changes**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/app/[locale]/admin/tables/page.tsx
git commit -m "perf(admin): virtualize orders list in table modal to handle 1000+ items without DOM lag"
```
