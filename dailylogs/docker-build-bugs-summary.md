# Nhật ký: Tổng hợp lỗi (Bugs) và Cách khắc phục trong quá trình Docker hóa (Dockerizing)

Quá trình build image và chạy container cho 6 microservices trên macOS (chip Apple Silicon ARM64) đã gặp một số vấn đề phức tạp liên quan đến kiến trúc CPU và cấu hình kết nối. Dưới đây là tóm tắt các bug và cách giải quyết:

## 1. Lỗi Segfault (Exit code 139) của `protoc` khi build gRPC (Apple Silicon)
* **Dịch vụ ảnh hưởng:** `CatalogService` và `CartService`.
* **Mô tả lỗi:** Khi Docker tiến hành `dotnet build` hoặc `dotnet restore` bên trong container (vốn dùng base image Alpine Linux), bộ biên dịch của gRPC là `Grpc.Tools` sẽ cố gắng thực thi file nhị phân `protoc`. Vì `protoc` của gRPC ban đầu không tương thích hoàn toàn với kiến trúc xỏ giả lập (Rosetta 2) ARM64 của Mac hoặc do thiếu thư viện C chuẩn `glibc` trên Alpine, tiến trình bị crash ngay lập tức (Segmentation Fault - 139) làm sập quá trình build image Docker.
* **Cách khắc phục:** 
  1. Ban đầu thử dùng mẹo tạo script `protoc` giả (mock) nhưng không triệt để.
  2. Quyết định thay đổi ở cấp độ phần cứng: Thêm chỉ thị `platform: linux/amd64` vào **toàn bộ 6 services** trong file `docker-compose.yml`. Điều này ép Docker Desktop trên Mac khởi tạo toàn bộ môi trường giả lập kiến trúc x86_64 ổn định từ đầu tới cuối, giúp `Grpc.Tools` hoạt động trơn tru.

## 2. Lỗi Redis Connection Exception gây sập container lúc khởi động
* **Dịch vụ ảnh hưởng:** `CartService`.
* **Mô tả lỗi:** Sau khi build thành công, container `bunbo-cart` bị kẹt trong vòng lặp khởi động tắt liên tục. Log hiển thị `Unhandled exception. StackExchange.Redis.RedisConnectionException: It was not possible to connect to the redis server(s).` dẫn tới segfault trên nền giả lập.
* **Cách khắc phục:** 
  1. Kiểm tra file `docker-compose.yml`, tôi phát hiện biến môi trường kết nối Redis bị ánh xạ sai tên.
  2. Sửa `- Redis__ConnectionString=redis:6379,abortConnect=false` thành chuỗi chuẩn của Dependency Injection: `- ConnectionStrings__Redis=redis:6379`. (Do trong `appsettings.json` cấu hình nằm ở `ConnectionStrings:Redis`). Sau khi sửa, dịch vụ đã kết nối thành công với Redis container.

## 3. Lỗi MassTransit đòi Commercial License (Giấy phép thương mại)
* **Dịch vụ ảnh hưởng:** `OrderService` và `RealtimeService`.
* **Mô tả lỗi:** `bunbo-order` và `bunbo-realtime` cũng liên tục sập (Exit code 139). Phân tích sâu vào `docker logs bunbo-order` (lấy 50 dòng log đầu), phát hiện lỗi `Unhandled exception. MassTransit.ConfigurationException: The bus configuration is invalid: [Failure] License must be specified...`. Các phiên bản `v8.3+` trở đi của MassTransit đã thêm yêu cầu phải có tệp giấy phép thương mại, nếu không sẽ tự động chặn ứng dụng khi khởi động.
* **Cách khắc phục:** 
  1. Hạ cấp (Downgrade) trực tiếp phiên bản của các package `MassTransit.RabbitMQ` và `MassTransit.Abstractions` trong file `.csproj` từ bản mới nhất `9.0.1` xuống phiên bản mã nguồn mở hoàn toàn miễn phí là `8.2.0`.
  2. Chạy `docker compose build` lại cho 2 service này, và kết quả là chúng đã chạy mượt mà cùng RabbitMQ.

## 4. Lỗi Syntax XML sau khi sửa file `OrderService.Api.csproj`
* **Dịch vụ ảnh hưởng:** `OrderService`.
* **Mô tả lỗi:** Quá trình dùng công cụ Regex để thay thế text (Downgrade phiên bản) đã thao tác lỗi, làm mất đi thẻ đóng `</PackageReference>` và xóa cấu hình `Swashbuckle.AspNetCore` gây lỗi C# build-time.
* **Cách khắc phục:** Tôi đã xem lại nội dung gốc và thay thế toàn bộ file `OrderService.Api.csproj` với cú pháp XML chuẩn nhất, sau đó chạy lại Build.

---
**Kết quả cuối cùng:** Tất cả `6 microservices` cùng `3 databases / brokers` (`PostgreSQL`, `Redis`, `RabbitMQ`) đã hoàn toàn ổn định và ở trạng thái **Up (Healthy)** thông qua mạng lưới localhost.
