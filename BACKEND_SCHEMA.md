# Bun Bò System - Backend Schema Overview

Tài liệu này tóm tắt cấu trúc các entity, thuộc tính và mối quan hệ giữa các bảng trong hệ thống microservices.

## 1. Thành phần chung (SharedKernel)
Tất cả các Entity đều kế thừa từ **BaseEntity**, bao gồm các thuộc tính:
- `Id`: Định danh (Thường là GUID, trừ Category là int).
- `CreatedAt`: Thời điểm tạo (UTC).
- `UpdatedAt`: Thời điểm cập nhật cuối (UTC).
- `IsDeleted`: Đánh dấu xóa mềm.
- `DeletedAt`: Thời điểm xóa mềm.

---

## 2. Các Service và Entity

### A. IdentityService (Quản lý người dùng)
#### **Entity: User**
- `Username`: Tên đăng nhập.
- `Email`: Email người dùng.
- `PasswordHash`: Mật khẩu đã mã hóa (Nullable nếu dùng Google).
- `Role`: Quyền hạn (Admin/Client).
- `GoogleId`: ID định danh từ Google (Nếu login qua Google).

---

### B. CatalogService (Quản lý thực đơn)
#### **Entity: Category (Danh mục)**
- `Name`: Tên danh mục (Ví dụ: Bún, Nước uống).
- **Quan hệ**: 1 Danh mục có nhiều Món ăn.

#### **Entity: Food (Món ăn)**
- `Name`: Tên món.
- `Description`: Mô tả.
- `ImageUrl`: Link ảnh món ăn.
- `Price`: Giá bán.
- `IsAvailable`: Còn hàng hay không.
- `CategoryId`: ID danh mục thuộc về.
- **Quan hệ**: Nhiều Món ăn thuộc về 1 Danh mục.

---

### C. OrderService (Quản lý đơn hàng & Bàn)
#### **Entity: RestaurantTable (Bàn ăn)**
- `TableCode`: Mã bàn (Ví dụ: T1, T2).
- `Name`: Tên hiển thị.
- `PosX`, `PosY`: Vị trí bàn trên sơ đồ.
- **Quan hệ**: 1 Bàn có nhiều Phiên hoạt động (TableSession).

#### **Entity: TableSession (Phiên hoạt động của bàn)**
- `TableId`: ID bàn đang sử dụng.
- `GroupCode`: Mã PIN 4 số để khách cùng bàn tham gia đặt món.
- `StartTime`: Thời gian bắt đầu.
- `EndTime`: Thời gian kết thúc.
- `IsClosed`: Trạng thái đóng/mở phiên.
- **Quan hệ**: Thuộc về 1 Bàn, chứa nhiều Đơn hàng (Order).

#### **Entity: Order (Đơn hàng)**
- `TableSessionId`: ID phiên hoạt động của bàn.
- `CustomerId`: ID khách hàng (Nếu đã login).
- `TotalAmount`: Tổng tiền đơn hàng.
- `Status`: Trạng thái (Created, Cooking, Served, Cancelled).
- `Note`: Ghi chú đơn hàng.
- **Quan hệ**: Thuộc về 1 Phiên bàn, chứa nhiều Chi tiết đơn hàng (OrderItem) và nhiều Thanh toán (Payment).

#### **Entity: OrderItem (Chi tiết đơn hàng)**
- `OrderId`: ID đơn hàng cha.
- `FoodId`: ID món ăn (Tham chiếu từ Catalog).
- `ProductName`: Tên sản phẩm tại thời điểm đặt.
- `Quantity`: Số lượng.
- `UnitPrice`: Đơn giá tại thời điểm đặt.
- `TotalPrice`: Tổng tiền của món đó.
- `Note`: Ghi chú riêng cho món (Ví dụ: Không hành).
- **Quan hệ**: Thuộc về 1 Đơn hàng.

#### **Entity: Payment (Thanh toán)**
- `OrderId`: ID đơn hàng thanh toán.
- `Amount`: Số tiền thanh toán.
- `Provider`: Cổng thanh toán (Mặc định: sePay).
- `TransactionId`: Mã giao dịch từ cổng thanh toán.
- `Signature`: Chữ ký xác thực.
- `Status`: Trạng thái (Pending, Success, Failed).
- `PaymentUrl`: Link thanh toán (Nếu có).
- **Quan hệ**: Thuộc về 1 Đơn hàng.

---

### D. CartService (Giỏ hàng tạm thời)
*Lưu ý: Service này sử dụng NoSQL/Redis hoặc DB tạm, không kế thừa BaseEntity truyền thống.*
#### **Entity: ShoppingCart**
- `CartOwnerId`: ID chủ sở hữu giỏ hàng.
- `Items`: Danh sách các món trong giỏ.

#### **Entity: CartItem**
- `FoodId`, `FoodName`, `UnitPrice`, `Quantity`, `TotalPrice`.

---

## 3. Bản đồ mối quan hệ chính
```mermaid
erDiagram
    USER ||--o{ ORDER : "đặt"
    CATEGORY ||--o{ FOOD : "chứa"
    RESTAURANT_TABLE ||--o{ TABLE_SESSION : "có"
    TABLE_SESSION ||--o{ ORDER : "chứa"
    ORDER ||--o{ ORDER_ITEM : "bao gồm"
    ORDER ||--o{ PAYMENT : "có"
---

## 4. Eraser.io ERD Code
Bạn có thể copy đoạn code dưới đây vào [Eraser.io](https://eraser.io) (phần Diagram as Code) để tự động tạo sơ đồ ERD:

```erd
// Identity Service
User [color: #4A90E2] {
  Id guid [primary key]
  Username string
  Email string
  PasswordHash string
  Role string
  GoogleId string
  CreatedAt datetime
  UpdatedAt datetime
}

// Catalog Service
Category [color: #7ED321] {
  Id int [primary key]
  Name string
  CreatedAt datetime
  UpdatedAt datetime
}

Food [color: #7ED321] {
  Id guid [primary key]
  Name string
  Description string
  ImageUrl string
  Price decimal
  IsAvailable boolean
  CategoryId int
  CreatedAt datetime
  UpdatedAt datetime
}

// Order Service
RestaurantTable [color: #D0021B] {
  Id guid [primary key]
  TableCode string
  Name string
  PosX int
  PosY int
  CreatedAt datetime
  UpdatedAt datetime
}

TableSession [color: #D0021B] {
  Id guid [primary key]
  TableId guid
  GroupCode string
  StartTime datetime
  EndTime datetime
  IsClosed boolean
  CreatedAt datetime
  UpdatedAt datetime
}

Order [color: #D0021B] {
  Id guid [primary key]
  TableSessionId guid
  CustomerId guid
  TotalAmount decimal
  Status string
  Note string
  CreatedAt datetime
  UpdatedAt datetime
}

OrderItem [color: #D0021B] {
  Id guid [primary key]
  OrderId guid
  FoodId guid
  ProductName string
  Quantity int
  UnitPrice decimal
  TotalPrice decimal
  Note string
  CreatedAt datetime
  UpdatedAt datetime
}

Payment [color: #D0021B] {
  Id guid [primary key]
  OrderId guid
  Amount decimal
  Provider string
  TransactionId string
  Signature string
  Status string
  PaymentUrl string
  CreatedAt datetime
  UpdatedAt datetime
}

// Relationships
Category.Id < Food.CategoryId
RestaurantTable.Id < TableSession.TableId
TableSession.Id < Order.TableSessionId
Order.Id < OrderItem.OrderId
Order.Id < Payment.OrderId
User.Id < Order.CustomerId

// Cart Service (NoSQL representation)
ShoppingCart [color: #F5A623] {
  CartOwnerId string [primary key]
  Items list
}
```

---

## 5. Flow chart kiến trúc Backend toàn hệ thống (Eraser.io)
Bạn có thể tiếp tục copy đoạn code dưới đây vào Eraser.io (Diagram as Code, chọn **Flowchart** hoặc **Architecture Diagram**) để quan sát luồng giao tiếp giữa frontend, API gateway và các microservices:

```eraser
direction down

User API Request? [shape: oval, icon: globe]

GatewayPath [color: purple] {
  API Gateway [icon: server, color: purple]
  Route Request [shape: oval, icon: git-merge]
}

AuthPath [color: blue] {
  Identity Service [icon: user, color: blue]
  Valid Account? [shape: diamond, icon: key]
  Generate JWT Token [shape: oval, icon: check-circle]
  Return 401 [shape: oval, icon: x-circle]
}

DataPath [color: yellow] {
  Catalog & Cart Service [icon: grid, color: yellow]
  Valid Token? [shape: diamond, icon: key]
  Return Data [shape: oval, icon: database]
}

OrderAndPaymentPath [color: red] {
  Order Service [icon: shopping-cart, color: red]
  Table Session Valid? [shape: diamond, icon: help-circle]
  Create Order in DB [shape: oval, icon: database]
  sePay Valid? [shape: diamond, icon: credit-card]
  Publish to RabbitMQ [shape: oval, icon: activity]
}

NotificationPath [color: green] {
  Realtime Service [icon: radio, color: green]
  Consume Event [shape: oval, icon: download]
  Admin Online? [shape: diamond, icon: monitor]
  Push WebSocket Alert [shape: oval, icon: bell]
}

User API Request? > API Gateway
API Gateway > Route Request

Route Request > Identity Service: /api/auth
Identity Service > Valid Account?
Valid Account? > Generate JWT Token: Yes
Valid Account? > Return 401: No

Route Request > Catalog & Cart Service: /api/catalog
Catalog & Cart Service > Valid Token?
Valid Token? > Return Data: Yes
Valid Token? > Return 401: No

Route Request > Order Service: /api/orders
Order Service > Table Session Valid?
Table Session Valid? > Create Order in DB: Yes
Table Session Valid? > Return 400 Bad Request [shape: oval, icon: x-circle]: No

Create Order in DB > sePay Valid?
sePay Valid? > Publish to RabbitMQ: Yes
sePay Valid? > Payment Failed [shape: oval, icon: x-circle]: No

Publish to RabbitMQ > Realtime Service
Realtime Service > Consume Event
Consume Event > Admin Online?
Admin Online? > Push WebSocket Alert: Yes
```
