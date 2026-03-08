# Lộ Trình Triển Khai (Deployment Roadmap) - Phiên bản Đồ Án Sinh Viên 🎓

Tài liệu này vạch ra lộ trình và danh sách các task chi tiết nhất để đưa hệ thống BunBo System (Microservices) lên môi trường chạy thực tế. 
**Tiêu chí lõi:** Đáp ứng được điểm cao (High Availability, Microservices chuẩn) nhưng **Tối ưu chi phí bằng 0đ hoặc cực rẻ** dành cho sinh viên.

---

## Nguyên tắc Công Nghệ (Stack) "Ngon - Bổ - Rẻ"
Thay vì dùng các dịch vụ Cloud Managed đắt đỏ (AWS EKS, RDS), chúng ta tự host (Self-hosted) và dùng tài nguyên miễn phí:
- **Cloud/VPS:** `Google Cloud Platform (GCP)` (Sinh viên có gói free 300$ trong 90 ngày) hoặc `DigitalOcean` (Gói GitHub Student Pack free 200$). Ta sẽ thuê 2-3 VPS nhỏ (Ví dụ: 2 CPU, 4GB RAM) để tạo Cluster.
- **Docker Registry:** `Docker Hub` (Miễn phí Public Repo) hoặc `GitHub Container Registry` (Hoàn toàn miễn phí kể cả Private).
- **CI/CD:** `GitHub Actions` (Miễn phí 2000 phút/tháng cho Repo Private, không giới hạn cho Repo Public).
- **Kubernetes (K8s) Engine:** Dùng `K3s` (Nhẹ hơn K8s chuẩn, ngốn cực ít RAM, sinh ra dành riêng cho mô hình VPS nhỏ).
- **Ingress Controller:** `Traefik` hoặc `NGINX Ingress` (Mở port website ra ngoài, miễn phí).
- **Database/Broker:** Deploy PostgreSQL, Redis, RabbitMQ thẳng vào trong K8s luôn bằng `StatefulSet` + `Persistent Volumes` (Tiết kiệm tiền mua Database rời).
- **Observability:** `Loki` + `Grafana` + `Prometheus` (Mã nguồn mở miễn phí).

---

## Lộ Trình Công Việc Chi Tiết (Detailed Tasks)

### 🔴 GIAI ĐOẠN 1: Container Hóa (Local Docker) - CHI PHÍ $0
**Mục tiêu:** Đóng gói code thành Image, chạy được rơn tru ở Local (Không cần K8s vội).

- [ ] **Task 1.1:** Tối ưu hóa API Gateway (CORS, Ocelot Headers).
- [ ] **Task 1.2:** Viết File `Dockerfile` (Dạng Multi-stage build) cho 6 .NET Services. Ép dung lượng image xuống dưới 150MB/service bằng Alpine.
- [ ] **Task 1.3:** Viết phân quyền Non-root User trong Dockerfile để đạt chuẩn Security.
- [ ] **Task 1.4:** Tạo file `docker-compose.yml` định nghĩa mạng (Networks) và các services (bao gồm RabbitMQ, Redis, PostgreSQL).
- [ ] **Task 1.5:** Triển khai Script `seed-data.sql` để Docker tự mớm sẵn Admin Account và Data mồi vào DB khi start.
- [ ] **Task 1.6:** Chạy thực tế `docker compose up -d` và test API trên Postman thành công 100%.

---

### 🔴 GIAI ĐOẠN 2: Xây Dựng CI Pipeline (GitHub Actions) - CHI PHÍ $0
**Mục tiêu:** Push code lên GitHub là tự động Build và Đẩy Image.

- [ ] **Task 2.1:** Quay lại Github tạo thư mục `.github/workflows/ci.yml`.
- [ ] **Task 2.2:** Setup Job 1: Build & Setup .NET SDK.
- [ ] **Task 2.3:** Setup Job 2: Run Unit Tests (Tạo vài Unit Test ảo để Demo tính năng CI tự động Test và Chặn Code).
- [ ] **Task 2.4:** Setup Job 3: Build Docker Image và Tagging theo `$GITHUB_SHA` (Mã commit).
- [ ] **Task 2.5:** Cài Secret `DOCKERHUB_USERNAME` và `DOCKERHUB_TOKEN` vào settings của Repo.
- [ ] **Task 2.6:** Push Code lên nhánh Main & Kiểm tra Docker Hub đã nhận Image tự động chưa.

---

### 🔴 GIAI ĐOẠN 3: Xây Dựng Cụm K8s (Infrastructure) - CHI PHÍ ~ $15-$20/tháng (Free Credits)
**Mục tiêu:** Dựng cái móng nhà K8s theo chuẩn HA (High Availability).

- [ ] **Task 3.1:** Mua/Tạo 2 máy chủ ảo (VPS) rẻ nhất có thể (Gợi ý: DigitalOcean Droplets size 2vCPU-2GB hoặc 4GB RAM).
    - 1 VPS làm `Master Node` (Điều phối).
    - 1 VPS làm `Worker Node` (Chỗ chạy code thực). 
- [ ] **Task 3.2:** SSH vào VPS, cài đặt `K3s` (Lightweight Kubernetes).
- [ ] **Task 3.3:** Cài đặt công cụ `kubectl` trên máy tính cá nhân (Laptop của bạn) và copy file config để remote vào Cluster.
- [ ] **Task 3.4:** Setup Helm (Công cụ quản lý Gói cho K8s).

---

### 🔴 GIAI ĐOẠN 4: Triển Khai Hạ Tầng Lõi lên K8s
**Mục tiêu:** Mang "môi trường" gồm Storage, Database, Broker lên K8s trước khi mang Code lên.

- [ ] **Task 4.1:** Sử dụng Helm để cài `Traefik` (hoặc NGINX) Ingress Controller. 
- [ ] **Task 4.2:** Tích hợp `Cert-Manager` để tự động xin chứng chỉ HTTPS/SSL miễn phí từ Let's Encrypt cho tên miền của bạn (ví dụ: `api.bunbostore.site`).
- [ ] **Task 4.3 (Database):** Tạo YAML Deployment (kèm PersistentVolume và PersistentVolumeClaim để lưu file Database không bị mất khi Pod sập) cho **PostgreSQL**.
- [ ] **Task 4.4 (Caching):** Tạo YAML Deployment cho **Redis**.
- [ ] **Task 4.5 (Queue):** Tạo YAML StatefulSet cho **RabbitMQ**.

---

### 🔴 GIAI ĐOẠN 5: Triển Khai Microservices lên K8s (CD - Continuous Deployment)
**Mục tiêu:** Khởi động 6 Microservices (Viết code cho K8s).

- [ ] **Task 5.1:** Đóng gói toàn bộ file cấu hình bảo mật vào Kubernetes `Secret` (Ví dụ: Chuỗi kết nối Postgres, JWT Key).
- [ ] **Task 5.2:** Viết YAML `Deployment` cho từng dịch vụ: `Identity`, `Catalog`, `Cart`, `Order`, `Realtime`, `ApiGateway`.
    - Set Image là hình ảnh vừa build từ **Giai đoạn 2**.
    - Set **Liveness/Readiness Probes** (Để K8s biết Pod còn sống không mà tự khởi động lại).
    - Set Resource Limit: Max CPU `200m`, Max RAM `256Mi` cho mỗi container để tránh chết VPS.
- [ ] **Task 5.3:** Viết YAML `Service` (Kiểu ClusterIP) cho mỗi Microservice để chúng nó gọi được nhau = tên miền nội mạng K8s. 
- [ ] **Task 5.4:** Viết cấu hình `Ingress` để map Domain bên ngoài vào `ApiGateway` (Ví dụ `https://api.bunbo.vn/api/orders` -> Gateway Pod).

---

### 🔴 GIAI ĐOẠN 6: Thiết Lập High Availability & Auto-Scaling (Điểm Cộng Đồ Án K8s)
**Mục tiêu:** Khẳng định với thầy cô hệ thống này đạt chuẩn Auto-scaling (Tự phình to).

- [ ] **Task 6.1:** Cài đặt `metrics-server` cho cụm K3s.
- [ ] **Task 6.2:** Áp dụng thuật toán **Horizontal Pod Autoscaling (HPA)**.
    - Setup file YAML: Theo dõi `OrderService` và `IdentityService`. Nếu CPU > 60%, tự động scale từ `1 Pod` lên `3 Pods`.
- [ ] **Task 6.3:** Dùng **K6** hoặc **JMeter** viết một kịch bản Load Test (Bắn 100 User ảo/giây vào API Đăng Nhập). 
- [ ] **Task 6.4 (Báo cáo Đồ án):** Quay Video/Chụp ảnh minh chứng khi bị Load Test, K8s tự động đẻ thêm 2 Pods Identity lót đường bảo vệ hệ thống không nghẽn. (Xong điểm A+).

---

### 🔴 GIAI ĐOẠN 7: Giám Sát, Log & Báo Cáo Sự Cố (Tùy Chọn Hoặc Điểm Bonus)
**Mục tiêu:** Tích hợp bộ Logging. Đồ án Microservices KHÔNG CÓ Log tập trung là vô nghĩa.

- [ ] **Task 7.1:** Deploy `Prometheus` (Thu thập metrics CPU/RAM) qua Helm.
- [ ] **Task 7.2:** Deploy `Grafana` làm Dashboard, import một Dashboard có sẵn trên thư viện hiển thị màn hình siêu "Cool ngầu".
- [ ] **Task 7.3:** Triển khai ELK Stack thu nhỏ (Hoặc chuẩn bài cho K8s nhỏ là xài **Loki** + **Promtail**). Khi Request tạch, gõ keyword tìm log xem service nào chết.

### 💰 TỔNG KẾT CHI PHÍ
- Code, CI/CD, Registry: **Mức giá: Miễn Phí.**
- Domain (.com / .vn): Tự mua tầm **200k/năm** (Chọt Route 53 Cloudflare free). 
- 2x VPS chạy K8s + Data: ~\$15 - \20$/tháng (Áp dụng Credit Code Sinh viên để bù trừ = **Miễn Phí**). 

Hàng này đủ đem thi chung khảo đồ án tốt nghiệp xuất sắc rồi nhé bạn!
