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

curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

sudo mkdir /root/.kube

ssh-keygen -t rsa -f ~/.ssh/id_rsa -N "" <<< y

sudo cat > /root/.ssh/authorized_keys <<EOF
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDIVKQIn052nShq9YIxASQyvumGJS9hjc2QXJm5igzlcD94a+5YdP1eA0vjx3cRaawaenJm4VW68s2hp2SQEte2zS9uxAJ9ZnY6lLnYGr1uPQYNt7raEl0A596hQQ0fpKOyBph9cLUkasyfczTJQ/NptgYZisidx7EuTr32tLOXyrxWviav4HzFuLQTqMmRgqae20TNvRtKN33a+SjbJIAPlpkMGr2H11Gv73lmakxFY+zMV/SfquIYYID3yxeW9TdA+feSwbp1JjDppKRj9tuHa9vGTx4zgM8o6g29BgeWn4Ee5pS/zsX+l7Er3vX8vjjveaeNw4xJ2akY+C3jev2q2IxI83MuCppG1JjLhFBVkLCBuN+9svRYiGVDIZYeL4f67Uf6Recrd78lMbPxp76i3T1UGfMjEjjvWO/mz7Pp10FvT2g23mg+N41PWhU7jmyAtLPUEFL5UXpQEve8gcwpwnQ+IEbkghNbit3TAOwPuFLCmzihGNnC4x6YCT8Yrek= adm-ku66289@kuhpcgw04.kuhpc.local
EOF
