#!/bin/bash
set -e

# Install dependencies
apt-get update && apt-get install -y apt-transport-https ca-certificates curl gpg wget

# Install Kubernetes tools
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.32/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.32/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
apt-get update && apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

sudo systemctl restart kubelet.service
sudo systemctl enable --now kubelet

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - &&
sudo add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" &&
sudo apt-get update -y &&
sudo apt-get install containerd.io -y

# Install containerd
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
systemctl restart containerd
systemctl enable containerd

sudo sed -i 's/            SystemdCgroup = false/            SystemdCgroup = true/' /etc/containerd/config.toml

swapoff -a
modprobe overlay
modprobe br_netfilter
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system

VERSION="v1.30.0"  # change to latest version if needed
curl -LO https://github.com/kubernetes-sigs/cri-tools/releases/download/$VERSION/crictl-$VERSION-linux-amd64.tar.gz
sudo tar -C /usr/local/bin -xzvf crictl-$VERSION-linux-amd64.tar.gz


curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

sudo mkdir -p /root/.kube

ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" <<< y

sudo cat > /root/.ssh/authorized_keys <<EOF
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDIVKQIn052nShq9YIxASQyvumGJS9hjc2QXJm5igzlcD94a+5YdP1eA0vjx3cRaawaenJm4VW68s2hp2SQEte2zS9uxAJ9ZnY6lLnYGr1uPQYNt7raEl0A596hQQ0fpKOyBph9cLUkasyfczTJQ/NptgYZisidx7EuTr32tLOXyrxWviav4HzFuLQTqMmRgqae20TNvRtKN33a+SjbJIAPlpkMGr2H11Gv73lmakxFY+zMV/SfquIYYID3yxeW9TdA+feSwbp1JjDppKRj9tuHa9vGTx4zgM8o6g29BgeWn4Ee5pS/zsX+l7Er3vX8vjjveaeNw4xJ2akY+C3jev2q2IxI83MuCppG1JjLhFBVkLCBuN+9svRYiGVDIZYeL4f67Uf6Recrd78lMbPxp76i3T1UGfMjEjjvWO/mz7Pp10FvT2g23mg+N41PWhU7jmyAtLPUEFL5UXpQEve8gcwpwnQ+IEbkghNbit3TAOwPuFLCmzihGNnC4x6YCT8Yrek= adm-ku66289@kuhpcgw04.kuhpc.local
EOF

# Init Kubernetes
POD_CIDR=$1
kubeadm init --pod-network-cidr=${POD_CIDR} --upload-certs

# Setup kubeconfig for root
mkdir -p /root/.kube
cp /etc/kubernetes/admin.conf /root/.kube/config

# Save join command
kubeadm token create --print-join-command > /root/join.sh
chmod +x /root/join.sh

# Apply Calico
sleep 30
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.1/manifests/tigera-operator.yaml
sleep 10
curl https://raw.githubusercontent.com/projectcalico/calico/v3.28.1/manifests/custom-resources.yaml -O
sed -i 's/cidr: 192\.168\.0\.0\/16/cidr: 10.10.0.0\/16/g' custom-resources.yaml
sleep 5
kubectl create -f custom-resources.yaml
