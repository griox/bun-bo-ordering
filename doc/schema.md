# BunBo.Domain — Entities

Tài liệu mô tả toàn bộ các entity trong tầng Domain của hệ thống BunBo.

---

## BaseEntity (Common)

Lớp trừu tượng được kế thừa bởi **tất cả** các entity. Cài đặt `ISoftDelete`.

| Thuộc tính  | Kiểu        | Mô tả                                  |
|-------------|-------------|----------------------------------------|
| `Id`        | `Guid`      | Khóa chính, tự sinh                    |
| `CreatedAt` | `DateTime`  | Thời điểm tạo (UTC)                    |
| `UpdatedAt` | `DateTime?` | Thời điểm cập nhật gần nhất            |
| `IsDeleted` | `bool`      | Soft-delete flag                       |
| `DeletedAt` | `DateTime?` | Thời điểm xoá mềm                      |

---

## 1. Role

Vai trò của tài khoản quản trị (ví dụ: `Admin`, `Manager`).

| Thuộc tính | Kiểu                         | Mô tả                         |
|------------|------------------------------|-------------------------------|
| `Name`     | `string`                     | Tên vai trò                   |
| `Users`    | `ICollection<AdminUser>`     | Danh sách admin thuộc vai trò |

---

## 2. AdminUser

Tài khoản nhân viên / quản trị viên của nhà hàng.

| Thuộc tính     | Kiểu      | Mô tả                          |
|----------------|-----------|--------------------------------|
| `Username`     | `string`  | Tên đăng nhập                  |
| `PasswordHash` | `string`  | Mật khẩu đã hash               |
| `FullName`     | `string`  | Họ tên đầy đủ                  |
| `RoleId`       | `Guid`    | FK → `Role`                    |
| `Role`         | `Role?`   | Navigation property → `Role`   |

---

## 3. Customer

Tài khoản khách hàng, hỗ trợ đăng nhập bằng mật khẩu hoặc Google OAuth.

| Thuộc tính     | Kiểu                        | Mô tả                             |
|----------------|-----------------------------|-----------------------------------|
| `Username`     | `string`                    | Tên đăng nhập                     |
| `PasswordHash` | `string`                    | Mật khẩu đã hash                  |
| `FullName`     | `string`                    | Họ tên đầy đủ                     |
| `PhoneNumber`  | `string?`                   | Số điện thoại                     |
| `Email`        | `string?`                   | Địa chỉ email                     |
| `GoogleId`     | `string?`                   | ID Google (OAuth)                 |
| `AvatarUrl`    | `string?`                   | URL ảnh đại diện                  |
| `Orders`       | `ICollection<Order>`        | Danh sách đơn hàng của khách      |
| `Feedbacks`    | `ICollection<Feedback>`     | Danh sách phản hồi của khách      |

---

## 4. Category

Danh mục món ăn (ví dụ: Món chính, Đồ uống, Tráng miệng).

| Thuộc tính | Kiểu                  | Mô tả                        |
|------------|-----------------------|------------------------------|
| `Name`     | `string`              | Tên danh mục                 |
| `Foods`    | `ICollection<Food>`   | Danh sách món ăn thuộc danh mục |

---

## 5. Food

Món ăn / thức uống trong thực đơn.

| Thuộc tính    | Kiểu        | Mô tả                          |
|---------------|-------------|--------------------------------|
| `Name`        | `string`    | Tên món                        |
| `Description` | `string?`   | Mô tả món                      |
| `ImageUrl`    | `string?`   | URL hình ảnh                   |
| `Price`       | `decimal`   | Giá bán                        |
| `IsAvailable` | `bool`      | Còn phục vụ hay không (default: `true`) |
| `CategoryId`  | `Guid`      | FK → `Category`                |
| `Category`    | `Category?` | Navigation property            |

---

## 6. RestaurantTable

Bàn ăn trong nhà hàng, mỗi bàn có mã QR riêng để khách scan đặt món.

| Thuộc tính  | Kiểu                           | Mô tả                               |
|-------------|--------------------------------|-------------------------------------|
| `TableCode` | `string`                       | Nội dung mã QR (định danh bàn)      |
| `Name`      | `string`                       | Tên hiển thị (ví dụ: "Bàn 1")      |
| `Status`    | `TableStatus`                  | Trạng thái bàn                      |
| `Sessions`  | `ICollection<TableSession>`    | Danh sách phiên sử dụng bàn         |

**Enum `TableStatus`:** `Available` · `Occupied` · `Reserved`

---

## 7. TableSession

Phiên sử dụng bàn — bắt đầu khi khách scan QR, kết thúc khi thanh toán xong.

| Thuộc tính  | Kiểu                    | Mô tả                                  |
|-------------|-------------------------|----------------------------------------|
| `TableId`   | `Guid`                  | FK → `RestaurantTable`                 |
| `Table`     | `RestaurantTable?`      | Navigation property                    |
| `StartTime` | `DateTime`              | Thời điểm bắt đầu phiên (UTC)          |
| `EndTime`   | `DateTime?`             | Thời điểm kết thúc phiên               |
| `IsClosed`  | `bool`                  | Phiên đã đóng hay chưa (default: `false`) |
| `Orders`    | `ICollection<Order>`    | Danh sách đơn hàng trong phiên         |

---

## 8. Order

Đơn hàng được đặt trong một phiên bàn cụ thể.

| Thuộc tính       | Kiểu                       | Mô tả                                     |
|------------------|----------------------------|-------------------------------------------|
| `TableSessionId` | `Guid`                     | FK → `TableSession`                       |
| `TableSession`   | `TableSession?`            | Navigation property                       |
| `TotalAmount`    | `decimal`                  | Tổng tiền đơn hàng                        |
| `Status`         | `OrderStatus`              | Trạng thái đơn hàng                       |
| `Note`           | `string?`                  | Ghi chú                                   |
| `CustomerId`     | `Guid?`                    | FK → `Customer` (có thể null nếu khách vãng lai) |
| `Customer`       | `Customer?`                | Navigation property                       |
| `OrderItems`     | `ICollection<OrderItem>`   | Chi tiết các món trong đơn                |
| `Payments`       | `ICollection<Payment>`     | Các giao dịch thanh toán cho đơn          |

**Enum `OrderStatus`:** `Created` → `PendingPayment` → `Paid` → `Cooking` → `Served` → `Closed` / `Cancelled`

---

## 9. OrderItem

Chi tiết một dòng món ăn trong đơn hàng.

| Thuộc tính   | Kiểu      | Mô tả                                              |
|--------------|-----------|----------------------------------------------------|
| `OrderId`    | `Guid`    | FK → `Order`                                       |
| `Order`      | `Order?`  | Navigation property                                |
| `FoodId`     | `Guid`    | FK → `Food`                                        |
| `Food`       | `Food?`   | Navigation property                                |
| `Quantity`   | `int`     | Số lượng                                           |
| `UnitPrice`  | `decimal` | Đơn giá tại thời điểm đặt (snapshot)               |
| `TotalPrice` | `decimal` | Tổng = `Quantity × UnitPrice` (computed property)  |
| `Note`       | `string?` | Ghi chú riêng cho món                              |

---

## 10. Payment

Giao dịch thanh toán cho một đơn hàng, hỗ trợ nhiều cổng thanh toán (MoMo, ZaloPay…).

| Thuộc tính      | Kiểu            | Mô tả                                        |
|-----------------|-----------------|----------------------------------------------|
| `OrderId`       | `Guid`          | FK → `Order`                                 |
| `Order`         | `Order?`        | Navigation property                          |
| `Amount`        | `decimal`       | Số tiền thanh toán                           |
| `Provider`      | `string`        | Cổng thanh toán (ví dụ: `MOMO`, `ZALOPAY`)  |
| `TransactionId` | `string?`       | Mã giao dịch từ cổng thanh toán              |
| `Signature`     | `string?`       | Chữ ký xác thực từ cổng thanh toán           |
| `Status`        | `PaymentStatus` | Trạng thái giao dịch                         |
| `PaymentUrl`    | `string?`       | URL redirect đến trang thanh toán            |

**Enum `PaymentStatus`:** `Pending` · `Success` · `Failed` · `Refunded`

---

## 11. Feedback

Đánh giá / phản hồi của khách hàng sau bữa ăn.

| Thuộc tính   | Kiểu        | Mô tả                                |
|--------------|-------------|--------------------------------------|
| `Content`    | `string`    | Nội dung phản hồi                    |
| `Rating`     | `int`       | Điểm đánh giá (1–5 sao)             |
| `CustomerId` | `Guid`      | FK → `Customer`                      |
| `Customer`   | `Customer?` | Navigation property                  |

---

## Sơ đồ quan hệ (tóm tắt)

```
Role ──< AdminUser

Customer ──< Order
Customer ──< Feedback

Category ──< Food

RestaurantTable ──< TableSession ──< Order ──< OrderItem >── Food
                                         └──< Payment
```

> Tất cả entity đều hỗ trợ **soft delete** thông qua `IsDeleted` / `DeletedAt` được định nghĩa ở `BaseEntity`.

