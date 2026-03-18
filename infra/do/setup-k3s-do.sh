#!/bin/bash
# Script này dùng để cấu hình K3s và Block Storage trên DigitalOcean Droplet

# 1. Cài đặt K3s (Master Node) và Disable Traefik
echo ">>> Cài đặt K3s (Master Node)..."
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

# 2. Đợi K3s sẵn sàng
echo ">>> Đang đợi K3s ready..."
sleep 20
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# 3. Cài đặt DigitalOcean CSI Driver (Dùng cho Block Storage)
echo ">>> 3. Cài đặt DigitalOcean CSI Driver (Phiên bản v4.16.0)..."
# Phiên bản mới đã chia nhỏ into nhiều file
kubectl apply -f https://raw.githubusercontent.com/digitalocean/csi-digitalocean/master/deploy/kubernetes/releases/csi-digitalocean-v4.16.0/crds.yaml
kubectl apply -f https://raw.githubusercontent.com/digitalocean/csi-digitalocean/master/deploy/kubernetes/releases/csi-digitalocean-v4.16.0/driver.yaml
kubectl apply -f https://raw.githubusercontent.com/digitalocean/csi-digitalocean/master/deploy/kubernetes/releases/csi-digitalocean-v4.16.0/snapshot-controller.yaml

# 4. Lưu ý: Người dùng CẦN cấu hình Secret trước khi sử dụng
echo ">>> Thông báo: Bạn cần cấu hình DigitalOcean Token trong file infra/do/do-secret.template.yaml và apply nó trước!"
echo ">>> Lệnh áp dụng: kubectl apply -f path/to/do-secret.yaml"

# 5. Cài đặt Nginx Ingress Controller
echo ">>> Cài đặt Helm và Nginx Ingress..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx --set controller.publishService.enabled=true
