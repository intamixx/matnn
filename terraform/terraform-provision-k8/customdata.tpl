#!/bin/bash
sudo apt-get update -y &&
sudo apt-get install -y \
apt-transport-https \
ca-certificates \
curl \
gnupg-agent \
software-properties-common &&
sudo apt-get update -y &&
sudo usermod -aG ubuntu

VERSION="v1.30.0"  # change to latest version if needed
curl -LO https://github.com/kubernetes-sigs/cri-tools/releases/download/$VERSION/crictl-$VERSION-linux-amd64.tar.gz
sudo tar -C /usr/local/bin -xzvf crictl-$VERSION-linux-amd64.tar.gz

curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

curl -LO https://github.com/derailed/k9s/releases/download/v0.50.9/k9s_Linux_amd64.tar.gz
tar -xzvf k9s_Linux_amd64.tar.gz
sudo mv k9s /usr/local/bin

sudo mkdir /root/.kube

ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" <<< y

sudo mkdir -p /opt/cni/bin
sudo chmod 755 /opt/cni/bin
sudo chown root:root /opt/cni/bin

sudo cat > /root/.ssh/authorized_keys <<EOF
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDIVKQIn052nShq9YIxASQyvumGJS9hjc2QXJm5igzlcD94a+5YdP1eA0vjx3cRaawaenJm4VW68s2hp2SQEte2zS9uxAJ9ZnY6lLnYGr1uPQYNt7raEl0A596hQQ0fpKOyBph9cLUkasyfczTJQ/NptgYZisidx7EuTr32tLOXyrxWviav4HzFuLQTqMmRgqae20TNvRtKN33a+SjbJIAPlpkMGr2H11Gv73lmakxFY+zMV/SfquIYYID3yxeW9TdA+feSwbp1JjDppKRj9tuHa9vGTx4zgM8o6g29BgeWn4Ee5pS/zsX+l7Er3vX8vjjveaeNw4xJ2akY+C3jev2q2IxI83MuCppG1JjLhFBVkLCBuN+9svRYiGVDIZYeL4f67Uf6Recrd78lMbPxp76i3T1UGfMjEjjvWO/mz7Pp10FvT2g23mg+N41PWhU7jmyAtLPUEFL5UXpQEve8gcwpwnQ+IEbkghNbit3TAOwPuFLCmzihGNnC4x6YCT8Yrek= adm-ku66289@kuhpcgw04.kuhpc.local
EOF

sudo tee /etc/crictl.yaml > /dev/null <<EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
debug: false
EOF
