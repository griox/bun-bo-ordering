# Design Spec: Tính Năng "Đặt Như Cũ" (Reorder Feature)

**Ngày:** 2026-05-10
**Phạm vi:** Frontend (Next.js) + Backend (OrderService .NET)
**Trạng thái:** Approved

---

## 1. Mục Tiêu

Sau khi khách đăng nhập quét QR bàn, hệ thống cho phép chọn lặp lại đơn hàng cũ hoặc tổng hợp món hay gọi nhất, tự động nạp vào giỏ. Hệ thống nhớ lựa chọn mặc định của từng user trên server.

---

## 2. Phạm Vi

### In Scope
- Màn hình "Đặt như cũ?" sau scan QR thành công (chỉ user đã đăng nhập)
- 2 tab: Đơn gần đây (5 đơn cuối) & Hay gọi nhất (top 5 món theo tần suất)
- Chọn option → nạp vào cart → redirect /menu
- Lưu preference lên server (preferredOrderId)
- Lần sau: pre-select đơn đã lưu
- Nút "Sửa lựa chọn mặc định"
- Nút "Bỏ qua, tự chọn"

### Out of Scope
- Chỉnh sửa món trong màn hình reorder
- Khách chưa đăng nhập

---

## 3. Architecture

### Phase Machine trong Scan Page
```
SCANNING → scan success + user logged in → fetch history+pref → REORDER_PROMPT
SCANNING → scan success + user NOT logged in → REDIRECTING
REORDER_PROMPT → "Đặt như cũ" → add to cart → REDIRECTING
REORDER_PROMPT → "Bỏ qua" → REDIRECTING
```

### New Files
- src/components/order/ReorderPrompt.tsx
- src/hooks/useReorderPreference.ts

### Modified Files
- src/app/scan/[tableId]/page.tsx (phase machine)

---

## 4. Backend API

### Endpoints mới (OrderService)
```
GET  /api/orders/preferences/reorder → { preferredOrderId: string | null }
PUT  /api/orders/preferences/reorder  body: { preferredOrderId: string }
```

Lưu trong bảng UserOrderPreferences (userId, preferredOrderId).

### Endpoint tái sử dụng
```
GET /api/orders/customer/{customerId}?take=5
```

---

## 5. UI

Bottom sheet slide up từ dưới. Nền trắng, warm palette.

Tab "Đơn gần đây": mỗi đơn hiển thị ngày · số món · tổng tiền. Radio chọn.
Tab "Hay gọi nhất": top 5 món, tên · đơn giá · số lần gọi.

Nút "Sửa lựa chọn mặc định": toggle isEditingDefault → selection auto-save preference.
Nút primary "Đặt như cũ": add to cart → redirect.
Nút ghost "Bỏ qua": redirect trực tiếp.

---

## 6. Computed "Hay gọi nhất"

Group orderItems theo foodId, sum quantity, sort desc, take 5.

---

## 7. Error Handling

| Tình huống | Xử lý |
|---|---|
| Fetch history thất bại | Toast warning, vẫn redirect menu |
| Fetch preference thất bại | Không pre-select |
| Save preference thất bại | Toast error nhẹ, vẫn vào menu |
| Không có lịch sử | Bỏ qua prompt, redirect thẳng |

---

## 8. Verification

- Scan với user đã đăng nhập → thấy prompt
- Scan với user chưa đăng nhập → thẳng /menu
- Chọn đơn → vào /menu → cart có sẵn món
- Bỏ qua → /menu → cart trống
- Sửa mặc định → scan lại → đơn đó pre-selected
- Không có lịch sử → bỏ qua prompt tự động
