# Thêm Application Metrics (Prometheus) cho toàn bộ Microservices

Phần tài liệu này mô tả chi tiết kế hoạch thêm Application Metrics (HTTP L7 Metrics) vào toàn bộ cụm Microservices của BunBo System để Prometheus có thể quét và cung cấp dữ liệu cho AlertManager.

## User Review Required
> [!IMPORTANT]
> Việc thay đổi này sẽ tác động tới `BunBo.SharedKernel` và `Program.cs` của tất cả **8 microservices + 1 api-gateway**. Bạn vui lòng review kỹ phương án sửa đổi này trước khi tôi bắt đầu chạy code (viết tự động hàng loạt).

## Open Questions
> [!WARNING]
> Mặc định Prometheus trên K8s thường scrape dữ liệu ở endpoint `/metrics`. Hiện tại có bất kỳ API nào của bạn đang dùng chung route này cho mục đích khác (như trả về danh sách chỉ số custom) không? (Nếu không, ta dùng mặc định của thư viện `prometheus-net`).

## Proposed Changes

---

### [Component: SharedKernel]
Thêm thư viện và cấu hình chung để đảm bảo tính nhất quán trên toàn hệ thống.

#### [MODIFY] [BunBo.SharedKernel.csproj](file:///Users/huyngo/bunbo-system-datn/backend/BunBo.SharedKernel/BunBo.SharedKernel.csproj)
- Thêm PackageReference: `prometheus-net.AspNetCore` phiên bản mới nhất.

#### [NEW] [PrometheusExtensions.cs](file:///Users/huyngo/bunbo-system-datn/backend/BunBo.SharedKernel/Extensions/PrometheusExtensions.cs)
- Viết 2 method mở rộng:
  - `AddBunBoPrometheusMetrics(this IServiceCollection services)`
  - `UseBunBoPrometheusMetrics(this IApplicationBuilder app)`
  - Cấu hình đếm HTTP requests, Latency histogram và Errors.

---

### [Component: Microservices (9 App)]
Áp dụng cấu hình metrics từ SharedKernel vào vòng đời (Pipeline) của toàn bộ ứng dụng.

#### [MODIFY] [ApiGateway/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/ApiGateway/Program.cs)
#### [MODIFY] [OrderService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/OrderService/OrderService.Api/Program.cs)
#### [MODIFY] [PromotionService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/PromotionService/PromotionService.Api/Program.cs)
#### [MODIFY] [CartService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/CartService/CartService.Api/Program.cs)
#### [MODIFY] [CatalogService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/CatalogService/CatalogService.Api/Program.cs)
#### [MODIFY] [IdentityService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/IdentityService/IdentityService.Api/Program.cs)
#### [MODIFY] [NotificationService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/NotificationService/NotificationService.Api/Program.cs)
#### [MODIFY] [PaymentService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/PaymentService/PaymentService.Api/Program.cs)
#### [MODIFY] [RealtimeService/Program.cs](file:///Users/huyngo/bunbo-system-datn/backend/RealtimeService/RealtimeService.Api/Program.cs)

---

### [Component: Kubernetes Infrastructure]
Cấu hình để Prometheus Operator biết cách quét dữ liệu từ các Pods.

#### [NEW] [podmonitor-microservices.yaml](file:///Users/huyngo/bunbo-system-datn/infra/k8s/monitoring/podmonitor-microservices.yaml)
- Tạo Kubernetes `PodMonitor` khớp với tất cả Pods có label `app: *` trong namespace `default`. Cấu hình cào endpoint `/metrics` trên `port: http-metrics`.

#### [MODIFY] K8s Deployment Manifests
- Duyệt qua toàn bộ thư mục `infra/k8s/*/deployment.yaml` và đặt tên cho port là `name: http-metrics` tại vị trí `containerPort: 8080`.

---

## Verification Plan
1. Chạy `dotnet build` tại thư mục Root để đảm bảo không lỗi cú pháp.
2. Áp dụng (`kubectl apply`) các manifest lên Kubernetes.
3. Restart lại các Deployment hoặc đẩy CI/CD.
4. Truy vấn `http_requests_received_total` trên Prometheus GUI và Grafana để đảm bảo dữ liệu đổ về thành công.
