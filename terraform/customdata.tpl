#!/bin/bash
sudo apt-get update -y &&
sudo apt-get install -y \
apt-transport-https \
ca-certificates \
curl \
gnupg-agent \
software-properties-common &&
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - &&
sudo add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" &&
sudo apt-get update -y &&
#sudo apt-get install docker-ce docker-ce-cli containerd.io -y &&
export VERSION_STRING=5:24.0.0-1~ubuntu.22.04~jammy
sudo apt-get install docker-ce=$VERSION_STRING docker-ce-cli=$VERSION_STRING containerd.io docker-buildx-plugin docker-compose-plugin -y
sudo usermod -aG docker ubuntu

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo mv kubectl /usr/bin/kubectl
chmod 755 /usr/bin/kubectl

sudo mkdir /root/.kube

ssh-keygen -t rsa -f ~/.ssh/id_rsa <<< y

cat > /root/.ssh/authorized_keys <<EOF
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC/OAoBajlyAw8Tn/b3pz4tvBnkY5jh86hT9fVotoQwq7cFv+/Lz3jswV12QByCPPiQNzwUgxbH3FscZdRYH7KR0CgYysr
w5+gE4nlmz4r/6eRz/+7T5h9xoS7cihwyxk3J6YLJjoXyq3zjaPz8q2A4ixm3DpfOrQJ6XLihaufyBcM0cPktY+jQH0KZ2cAuiVL8EohA3HGjKgDYHe8of7a/CdybE8TUSo
7tvHoK95kcHJXObqmZQyRWBESZrecgTbal7JHJBdijdMFmu3pybB8te7rJppd7IVvzUF/iuW4otFzLffdlnK0ddrxFFL/DOS+iCDSfrj+0okEf0AX6P29DF03t0xcHKKeTL
Jg5qx/wASRDnxMkLBtkJ7EG8+1+3jC8ZxvYxAi6Sw/WMhbMS1Y1CcEoWFFHqL8AUX3HMhX58MYpLAmOh9HLhISUiYg2EVQ/khKzfFAdG9euiwcKH61fXuVFo/Sf9WRo0/g+
BM/6Tjp7hvp8td2jAwOyEOGO+N8= root@plxrepapp01.kingston.ac.uk
EOF
