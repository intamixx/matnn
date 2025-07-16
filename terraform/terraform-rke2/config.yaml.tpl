disable:
  - rke2-canal            # disables the default CNI so you can install your own (e.g., Cilium)
  - rke2-ingress-nginx
node-name: ${node_name}
node-ip: ${node_ip}
server: https://${server_address}:9345
token: ${node_token}
%{ if is_controlplane }
tls-san:
  - ${server_address}
write-kubeconfig-mode: "0644"
%{ endif }
