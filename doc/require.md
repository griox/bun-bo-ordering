# ĐỒ ÁN: Hệ Thống Thương Mại Điện Tử Microservices trên Kubernetes



## 1. Mục Tiêu Đồ Án

### 1.1 Mục tiêu học thuật
- Nắm vững kiến trúc **Microservices** và các nguyên tắc thiết kế ứng dụng phân tán hiện đại.
- Nghiên cứu nền tảng **Kubernetes (K8s)** và cơ chế tự động mở rộng tài nguyên (Auto-scaling).

### 1.2 Mục tiêu kỹ thuật
- Thiết kế và triển khai hệ thống thương mại điện tử hoàn chỉnh theo kiến trúc Microservices trên cụm Kubernetes.
- Cấu hình và tích hợp các cơ chế giám sát, thu thập metrics và auto-scaling.
- Đảm bảo hiệu năng và tính sẵn sàng cao (High Availability) của hệ thống.

### 1.3 Mục tiêu đánh giá
- Đánh giá hiệu quả các chiến lược scaling và khả năng chịu tải trong các tình huống thực tế.

### 1.4 Yêu cầu quy trình
- Sinh viên trao đổi và báo cáo tiến độ với giáo viên hướng dẫn **hàng tuần**.

---

## 2. Nội Dung Thực Hiện

### 2.1 Nghiên cứu lý thuyết và công nghệ nền tảng

#### 2.1.1 Kiến trúc Microservices
- Khái niệm, ưu nhược điểm
- So sánh với kiến trúc Monolithic

#### 2.1.2 Container hóa với Docker
- Dockerfile
- Docker Compose
- Docker Registry

#### 2.1.3 Kubernetes (K8s)
- Kiến trúc tổng quan
- Các thành phần cốt lõi:
  - `Pod`
  - `Service`
  - `Deployment`
  - `ReplicaSet`
  - `ConfigMap`
  - `Secret`
  - `Ingress`

#### 2.1.4 Auto-scaling trong Kubernetes
- **HPA** – Horizontal Pod Autoscaler
- **VPA** – Vertical Pod Autoscaler
- **Cluster Autoscaler**

#### 2.1.5 Helm Charts
- Quản lý package trên Kubernetes

#### 2.1.6 Giám sát và Logging
- **Prometheus** – thu thập metrics
- **Grafana** – hiển thị dashboard
- **ELK Stack** hoặc **Loki** – logging

---

### 2.2 Phân tích và thiết kế hệ thống

#### 2.2.1 Yêu cầu chức năng
Hệ thống thương mại điện tử bao gồm các module:
- Quản lý người dùng
- Quản lý sản phẩm
- Quản lý giỏ hàng
- Quản lý đơn hàng
- Thanh toán
- Thông báo

#### 2.2.2 Thiết kế kiến trúc Microservices
Phân tách hệ thống thành các service độc lập:

| Service | Chức năng |
|---|---|
| `user-service` | Đăng ký, đăng nhập, quản lý tài khoản |
| `product-service` | CRUD sản phẩm, danh mục, tồn kho |
| `order-service` | Tạo và quản lý đơn hàng |
| `payment-service` | Xử lý thanh toán |
| `notification-service` | Gửi email, SMS, push notification |
| `api-gateway` | Định tuyến, xác thực, rate limiting |

#### 2.2.3 Thiết kế cơ sở dữ liệu
- Áp dụng pattern: **Database per Service**
- Công nghệ: `MySQL` / `PostgreSQL` / `MongoDB` (tùy service)

#### 2.2.4 Thiết kế API Gateway
- Định tuyến request từ client đến các microservices
- Xác thực và phân quyền tập trung

#### 2.2.5 Giao tiếp giữa các services
- **Đồng bộ (Synchronous):** REST API, gRPC
- **Bất đồng bộ (Asynchronous):** Message Queue – RabbitMQ hoặc Kafka

#### 2.2.6 Kế hoạch triển khai Kubernetes
- Namespace phân tách môi trường
- Resource Quotas
- Network Policies

---

### 2.3 Triển khai hệ thống

#### 2.3.1 Container hóa ứng dụng
- Viết Dockerfile cho từng service
- Build và push image lên Docker Registry
- Kiểm tra image với Docker Compose (local)

#### 2.3.2 Triển khai cụm Kubernetes
- Viết Kubernetes manifests (YAML): `Deployment`, `Service`, `Ingress`, `ConfigMap`, `Secret`
- Đóng gói bằng Helm Charts
- Deploy lên cluster (GKE / EKS / AKS / Minikube / Kind)

#### 2.3.3 Cấu hình Auto-scaling
- Thiết lập HPA dựa trên CPU/Memory utilization
- Cấu hình VPA cho các service phù hợp
- Tích hợp Cluster Autoscaler (nếu dùng cloud)

#### 2.3.4 Giám sát và Logging
- Deploy Prometheus + Grafana stack
- Cấu hình alert rules
- Triển khai hệ thống logging (ELK / Loki + Promtail)

#### 2.3.5 Bảo mật
- RBAC (Role-Based Access Control)
- Network Policies
- Secret management
- TLS/HTTPS qua Ingress

---

### 2.4 Kiểm thử và đánh giá

#### 2.4.1 Kiểm thử chức năng
- Unit test từng microservice
- Integration test toàn bộ hệ thống
- API testing (Postman / Newman)

#### 2.4.2 Load Testing
Công cụ sử dụng:
- **Apache JMeter**
- **K6**
- **Locust**

Mục tiêu: mô phỏng lưu lượng truy cập cao và đánh giá ngưỡng chịu tải.

#### 2.4.3 Đánh giá Auto-scaling
Các chỉ số theo dõi:
- Thời gian phản hồi (Response Time / Latency)
- Số lượng pods được tạo / xóa theo thời gian
- Resource Utilization (CPU, Memory)

#### 2.4.4 Chaos & Failure Testing
- Pod crash simulation
- Node failure simulation
- Kiểm tra khả năng **self-healing** và **high availability**

#### 2.4.5 Phân tích tối ưu hóa
- Thu thập metrics từ Prometheus
- Phân tích logs từ ELK/Loki
- Tối ưu hóa cấu hình resource requests/limits

---

### 2.5 Tổng kết và đề xuất

#### 2.5.1 Đánh giá kết quả
- Kết quả đạt được
- Ưu điểm và hạn chế của giải pháp

#### 2.5.2 So sánh kiến trúc
- **Microservices** vs **Monolithic**: hiệu năng, khả năng mở rộng, độ phức tạp vận hành

#### 2.5.3 Đề xuất hướng phát triển
- **CI/CD pipeline** với GitOps: ArgoCD, Flux
- **Service Mesh**: Istio, Linkerd
- **Serverless integration**
- **Multi-cluster management**

#### 2.5.4 Tài liệu đầu ra
- Báo cáo đồ án chi tiết
- Tài liệu trình bày (slides)
- Source code + README

---

## 3. Công Cụ và Công Nghệ

### 3.1 Container và Orchestration

| Công cụ | Mục đích |
|---|---|
| Docker | Container hóa ứng dụng |
| Docker Compose | Chạy multi-container local |
| Docker Registry | Lưu trữ Docker images |
| Kubernetes | Orchestration platform |
| Helm | Package manager cho K8s |

> **Kubernetes options:** GKE, EKS, AKS (cloud) hoặc Minikube, Kind (local development)

### 3.2 Ngôn ngữ và Framework

| Layer | Lựa chọn |
|---|---|
| Backend | Node.js (Express), Python (Flask/FastAPI), Java (Spring Boot), Go |
| Frontend | React.js / Vue.js / Angular |
| API Gateway | Kong, NGINX, Traefik |

### 3.3 Monitoring & Observability

| Công cụ | Mục đích |
|---|---|
| Prometheus | Thu thập metrics |
| Grafana | Visualization & alerting |
| ELK Stack | Centralized logging |
| Loki | Log aggregation (lightweight) |

### 3.4 Testing

| Công cụ | Mục đích |
|---|---|
| Apache JMeter | Load testing |
| K6 | Modern load testing |
| Locust | Python-based load testing |
| Postman / Newman | API testing |

---

## 4. Tài Liệu Tham Khảo

### Sách
1. *Kubernetes in Action, 2nd Edition* – Marko Lukša (Manning Publications)
2. *Building Microservices, 2nd Edition* – Sam Newman (O'Reilly)
3. *Kubernetes Patterns* – Bilgin Ibryam & Roland Huß (O'Reilly)
4. *Kubernetes Best Practices* – Brendan Burns, Eddie Villalba, Dave Strebel, Lachlan Evenson (O'Reilly)

### Tài liệu chính thức
- Kubernetes Docs: https://kubernetes.io/docs/
- Docker Docs: https://docs.docker.com/
- Prometheus Docs: https://prometheus.io/docs/
- Helm Docs: https://helm.sh/docs/

---


## 6. Checklist Tiến Độ

### Giai đoạn 1 – Nghiên cứu lý thuyết
- [ ] Hoàn thành nghiên cứu Microservices vs Monolithic
- [ ] Hoàn thành nghiên cứu Docker
- [ ] Hoàn thành nghiên cứu Kubernetes core components
- [ ] Hoàn thành nghiên cứu Auto-scaling (HPA/VPA/Cluster Autoscaler)
- [ ] Hoàn thành nghiên cứu Helm Charts
- [ ] Hoàn thành nghiên cứu Prometheus + Grafana + Logging

### Giai đoạn 2 – Phân tích & Thiết kế
- [ ] Phân tích yêu cầu chức năng
- [ ] Thiết kế kiến trúc Microservices
- [ ] Thiết kế Database per Service
- [ ] Thiết kế API Gateway
- [ ] Thiết kế message queue / giao tiếp giữa services
- [ ] Lập kế hoạch triển khai K8s

### Giai đoạn 3 – Triển khai
- [ ] Container hóa tất cả services
- [ ] Triển khai lên Kubernetes cluster
- [ ] Cấu hình HPA / VPA
- [ ] Triển khai monitoring stack (Prometheus + Grafana)
- [ ] Triển khai logging stack
- [ ] Cấu hình bảo mật (RBAC, TLS)

### Giai đoạn 4 – Kiểm thử & Đánh giá
- [ ] Kiểm thử chức năng từng service
- [ ] Load testing với K6 / JMeter / Locust
- [ ] Đánh giá auto-scaling
- [ ] Chaos testing (failure simulation)
- [ ] Phân tích metrics & tối ưu hóa

### Giai đoạn 5 – Tổng kết
- [ ] Viết báo cáo đồ án
- [ ] Chuẩn bị slide trình bày
- [ ] Code review và clean up repository
- [ ] Nộp đồ án