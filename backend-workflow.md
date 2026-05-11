# BunBo System - Backend Architecture & Workflow Documentation

> **Tài liệu được biên soạn bởi:** Backend Specialist & Documentation Writer
> **Dự án:** BunBo System (Microservices Architecture)

Hệ thống BunBo được thiết kế theo kiến trúc **Microservices** hiện đại, ưu tiên khả năng mở rộng (scalability), bảo mật (security) và hiệu năng (performance). Dưới đây là luồng hoạt động tổng thể và vai trò của từng service trong hệ thống.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Hệ thống sử dụng **YARP (Yet Another Reverse Proxy)** làm API Gateway để điều phối toàn bộ traffic từ client (Web/Mobile) đến các microservices bên trong. Giao tiếp giữa các service sử dụng hai phương thức chính:
- **Đồng bộ (Synchronous):** gRPC (hiệu năng cao, độ trễ thấp).
- **Bất đồng bộ (Asynchronous):** RabbitMQ (Event-Driven Architecture) để đảm bảo tính lỏng lẻo (loose coupling) và khả năng chịu lỗi (fault tolerance).

### Các Core Services:
1. **Identity Service:** Quản lý User, Authentication (JWT), Authorization, Roles.
2. **Catalog Service:** Quản lý thực đơn (Menu), món ăn (Food), danh mục và hình ảnh (MinIO S3).
3. **Cart Service:** Quản lý giỏ hàng tạm thời (Lưu trữ in-memory bằng Redis).
4. **Order Service:** Quản lý toàn bộ vòng đời của đơn hàng (Order Lifecycle).
5. **Payment Service:** Tích hợp cổng thanh toán (SePay), xác nhận giao dịch.
6. **Promotion Service:** Quản lý Voucher, mã giảm giá, và điểm thưởng thành viên (Loyalty Points).
7. **Realtime Service:** Quản lý kết nối WebSockets (SignalR) để đẩy thông báo realtime tới client.
8. **Notification Service:** Service chạy ngầm (Background Worker) gửi Email/SMS qua SMTP (Resend).

---

## 2. Luồng Hoạt Động Cốt Lõi (Core Workflows)

### 2.1. Luồng Đặt Món (Order Placement Workflow)
Đây là luồng quan trọng nhất, thể hiện sức mạnh của Event-Driven Architecture:

1. **Thêm vào giỏ hàng:**
   - Client gọi `/api/cart/...` qua API Gateway.
   - **Cart Service** nhận request, lưu state giỏ hàng vào **Redis** để đảm bảo tốc độ cực nhanh.
   - Khi thêm món, Cart Service gọi **Catalog Service** qua **gRPC** để lấy giá chính xác nhất của món ăn (ngăn chặn sai lệch giá từ client).

2. **Áp dụng Voucher (Tùy chọn):**
   - Client gọi `/api/promotion/vouchers/validate`.
   - **Promotion Service** kiểm tra điều kiện, số lượng và trả về mức giảm giá.

3. **Chốt đơn (Checkout):**
   - Client gọi `/api/orders/...` để tạo đơn.
   - **Order Service** lưu đơn hàng vào PostgreSQL (`BunBoOrderDb`) với trạng thái `Pending`.
   - Order Service xuất bản sự kiện **`OrderCreatedEvent`** lên **RabbitMQ**.

4. **Xử lý Hậu mãi (Post-Order Processing qua Event):**
   - **Cart Service** nghe `OrderCreatedEvent` -> Xóa giỏ hàng của user trong Redis.
   - **Notification Service** nghe `OrderCreatedEvent` -> Gửi Email xác nhận đơn hàng tới khách hàng.
   - **Realtime Service** nghe `OrderCreatedEvent` -> Đẩy thông báo WebSockets tới Admin Dashboard báo có đơn mới.

### 2.2. Luồng Thanh Toán (Payment Workflow)
Hỗ trợ thanh toán không tiền mặt và cập nhật trạng thái tự động:

1. **Khởi tạo thanh toán:**
   - Khi chọn chuyển khoản, Client gọi tới **Payment Service** (`/api/payments`).
   - Payment Service tạo mã QR (tích hợp SePay) và trả về cho client.

2. **Xác nhận giao dịch (Webhook/Polling):**
   - Khi khách hàng chuyển khoản xong, SePay gọi Webhook về API Gateway -> **Payment Service**.
   - Payment Service xác thực tính hợp lệ của giao dịch và lưu vào `BunBoPaymentDb`.
   - Payment Service xuất bản sự kiện **`PaymentSuccessEvent`** lên **RabbitMQ**.

3. **Cập nhật hệ thống (qua Event):**
   - **Order Service** nghe event -> Đổi trạng thái đơn hàng thành `Paid` (Đã thanh toán) / `Processing` (Đang chuẩn bị).
   - **Promotion Service** nghe event -> Cộng điểm thưởng (Loyalty Points) cho user dựa trên giá trị đơn hàng.
   - **Realtime Service** nghe event -> Đẩy thông báo popup "Thanh toán thành công" trực tiếp xuống màn hình POS hoặc màn hình điện thoại của khách.

### 2.3. Luồng Quản Lý File & Hình Ảnh (Asset Management)
Đảm bảo hiệu suất tải trang và lưu trữ độc lập:

1. **Upload:** Admin upload ảnh món ăn qua **Catalog Service**.
2. **Lưu trữ:** Catalog Service lưu file vật lý vào **MinIO** (S3 Compatible Storage) qua AWS SDK.
3. **Truy xuất:** URL public được MinIO trả về và lưu vào PostgreSQL. Client tải ảnh trực tiếp từ Node MinIO, giảm tải hoàn toàn cho backend.

---

## 3. Tiêu Chuẩn Bảo Mật & Kỹ Thuật (Engineering Standards)

Dựa trên triết lý của *Backend Specialist*:
- **Bảo mật:** Mọi service ngoại trừ các public route (như xem menu) đều được bảo vệ bởi **JWT Middleware**. API Gateway thực hiện Rate Limiting cơ bản.
- **Dữ liệu độc lập (Data Sovereignty):** Mỗi Microservice sở hữu một Database riêng biệt (Postgres DB riêng) để tránh tình trạng thắt cổ chai và cho phép scale độc lập. Không có JOIN chéo giữa các DB vật lý.
- **Logging & Monitoring:** Toàn bộ log từ các container được đẩy về **Seq** qua Serilog để truy vết lỗi (distributed tracing).
- **Graceful Failure:** Nếu Notification Service sập, đơn hàng vẫn được tạo thành công do RabbitMQ sẽ giữ lại message cho đến khi service sống lại (Message Queuing).

---

> **Tóm lược:** Kiến trúc của BunBo là một hệ thống phân tán chuẩn mực của năm 2025. Nó sử dụng gRPC cho các truy vấn đồng bộ yêu cầu tốc độ cao nội bộ và RabbitMQ để đảm bảo các tiến trình nghiệp vụ phức tạp (thanh toán, gửi mail, điểm thưởng) được tách bạch hoàn toàn khỏi luồng chính của người dùng, mang lại trải nghiệm độ trễ thấp nhất.
