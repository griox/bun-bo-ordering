# DigitalOcean & K3s Manual Setup (Phase 3)

## Goal
Prepare Droplet instances on DigitalOcean and install a lightweight Kubernetes cluster (K3s) manually, using Nginx Ingress instead of Traefik.

## Tasks
- [ ] **Task 1: Provision DigitalOcean Droplet** → Create 1 Ubuntu 22.04 Droplet (Size: Premium Intel, 4GB RAM). Verify: Can SSH into the Droplet (`doctl compute ssh <name>`).
- [ ] **Task 2: Cloud Firewall Configuration** → Setup DO Cloud Firewall to open Ports 80, 443 (HTTP/S) and 6443 (K8s API) from your local IP. Verify: `nc -zv <IP> 80` works.
- [ ] **Task 3: Install K3s (Master Node)** → Run command below to disable default Traefik:
  ```bash
  curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
  ```
  Verify: `sudo kubectl get nodes` shows "Ready" and no Traefik pods in `kube-system`.
- [x] **Task 4: Setup Local Access** → Use `doctl kubernetes cluster kubeconfig save <name>` (if using DOKS) or manually copy `/etc/rancher/k3s/k3s.yaml` to local `~/.kube/config`.
- [ ] **Task 5: Install DO CSI Driver** → Required for Block Storage (Volumes).
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/digitalocean/csi-digitalocean/master/deploy/kubernetes/releases/csi-digitalocean-v4.9.0/csi-digitalocean.yaml
  ```
- [ ] **Task 6: Install Helm & Nginx Ingress** → 
  ```bash
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm install nginx-ingress ingress-nginx/ingress-nginx --set controller.publishService.enabled=true
  ```

## Done When
- [ ] K3s cluster is running on DigitalOcean.
- [ ] Nginx Ingress Controller is active and has an External IP (Droplet IP).
- [ ] Block Storage Class is available for Databases.

## Droplet Specs Recommendation
- **OS:** Ubuntu 22.04 LTS
- **Size:** s-2vcpu-4gb-intel (Premium Intel - $28/mo)
- **Region:** sgp1 (Singapore)

