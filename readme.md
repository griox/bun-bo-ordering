# 🍽 Realtime Food Ordering System (Production-grade)

## 1. Mục tiêu dự án
Xây dựng hệ thống **order thức ăn realtime cho nhà hàng/café**:
- Khách order bằng web (QR tại bàn)
- Thanh toán online (MoMo / ZaloPay / VNPay)
- Admin & Kitchen nhận order **realtime**
- Hướng tới **sản phẩm kinh doanh thật**, không phải demo

---

## 2. Tech Stack (BẮT BUỘC TUÂN THỦ)

### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS
- Zustand (state)
- Fetch API / Axios
- WebSocket / SignalR client

### Backend
- ASP.NET Core Web API
- Entity Framework Core
- SignalR (Realtime)
- Clean Architecture
- PostgreSQL docker
- JWT (Admin)
- BackgroundService (Payment handling)

---

## 3. Kiến trúc tổng thể
Client (QR Order - Next.js)
|
| HTTPS / REST
|
Backend API (.NET)
├── Order Service
├── Table Service
├── Payment Service
├── Notification Service (SignalR)
├── Auth Service (Admin)
|
Database (PostgreSQL docker)
|
Realtime → Admin / Kitchen Dashboard

---

## 4. Nguyên tắc CỐT LÕI (AI PHẢI TUÂN THỦ)

❌ KHÔNG tin dữ liệu từ frontend  
✅ Backend luôn:
- Tính tiền
- Xác định trạng thái
- Xác thực payment callback

❌ KHÔNG cho client set:
- Giá tiền
- Order status
- Payment status

✅ Mọi order gắn với:
- Table
- TableSession

---

## 5. Luồng nghiệp vụ CHUẨN

### 5.1 QR & TableSession
- Mỗi bàn có `TableCode` (QR)
- Khi khách truy cập:
  - Nếu bàn chưa có session → tạo `TableSession (OPEN)`
  - Nếu có rồi → reuse

---

### 5.2 Order Flow
CREATED
→ PENDING_PAYMENT
→ PAID
→ COOKING
→ SERVED
→ CLOSED

---

### 5.3 Thanh toán
1. Client gọi API tạo payment
2. Backend tạo payment request
3. Redirect sang cổng thanh toán
4. Payment gateway callback → backend
5. Backend verify chữ ký
6. Update Order + Payment
7. Push realtime notification

---

## 6. Database Schema (TÓM TẮT)

### Core Tables
- Branch
- RestaurantTable
- TableSession
- Order
- OrderItem
- Food
- Category
- Payment
- AdminUser
- Role

👉 **Order KHÔNG gắn trực tiếp với user**

---

## 7. Backend Structure (BẮT BUỘC)

src/
├── API
│ ├── Controllers
│ ├── Hubs (SignalR)
│
├── Application
│ ├── DTOs
│ ├── Interfaces
│ ├── Services
│
├── Domain
│ ├── Entities
│ ├── Enums
│
├── Infrastructure
│ ├── Data (EF Core)
│ ├── PaymentProviders
│ ├── Realtime
│
└── BackgroundWorkers

---

## 8. Payment Design (CRITICAL)

### Interface
```csharp
IPaymentProvider
- CreatePayment()
- VerifyCallback()
Providers
MomoPaymentProvider
ZaloPayPaymentProvider
VnPayPaymentProvider
❗ Callback phải:
Idempotent
Transaction-safe
Verify signature
##9. Realtime (SignalR)
Groups
table-{tableId}
kitchen
cashier
admin
Events
OrderCreated
OrderPaid
OrderUpdated
TableStatusChanged
###10. Frontend Pages
Customer
/order?tableCode=XXX
Menu
Cart
Payment
Order Status
Admin
/admin/login
/admin/dashboard
/admin/kitchen
/admin/orders
/admin/tables
#11. Security Rules
Admin dùng JWT
Customer KHÔNG cần login
Payment callback chỉ accept từ IP whitelist
HTTPS bắt buộc
Password hash (BCrypt)
##12. Những thứ PHẢI LÀM sau MVP
Audit log
Retry notification
Database backup
Health check
Rate limit API
##13. AI CODING INSTRUCTIONS (QUAN TRỌNG)
Khi generate code:
Luôn tách Controller / Service / Repository
Không hardcode logic payment trong controller
Không viết business logic trong frontend
Ưu tiên clean, readable, production-ready code
Comment rõ ràng cho nghiệp vụ
##14. Mục tiêu cuối
Chạy ổn định giờ cao điểm
Order realtime không trễ
Thanh toán an toàn
Dễ mở rộng nhiều chi nhánh
