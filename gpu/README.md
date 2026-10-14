kubectl -n kube-system port-forward --address 0.0.0.0 svc/hubble-ui 12000:80 &
kubectl -n portainer port-forward --address 0.0.0.0 svc/portainer 9443:9443 &
kubectl port-forward -n longhorn-system   svc/longhorn-frontend 8080:80 &
kubectl -n ingress-nginx port-forward --address 0.0.0.0 svc/ingress-nginx-controller 8000:80 &

sudo mount --make-rshared /

echo "=== Verify root mount propagation ==="
findmnt -T / -o TARGET,SOURCE,FSTYPE,PROPAGATION

echo
echo "=== Verify Longhorn path propagation ==="
findmnt -T /var/lib/longhorn -o TARGET,SOURCE,FSTYPE,PROPAGATION

kubectl set env deployment/longhorn-driver-deployer \
  -n longhorn-system \
  KUBELET_ROOT_DIR=/var/lib/kubesolo/kubelet
deployment.apps/longhorn-driver-deployer env updated

helm repo add nvdp https://nvidia.github.io/k8s-device-plugin
helm repo update

helm upgrade --install nvdp nvdp/nvidia-device-plugin \
  --namespace nvidia-device-plugin \
  --create-namespace \
  --version 0.17.1 \
  --set runtimeClassName=nvidia \
  --set nfd.enabled=false

kubectl describe ds nvdp-nvidia-device-plugin   -n nvidia-device-plugin
kubectl get ds nvdp-nvidia-device-plugin   -n nvidia-device-plugin -o yaml
kubectl get events -n nvidia-device-plugin   --sort-by='.lastTimestamp'
helm list -n nvidia-device-plugin
helm get values nvdp -n nvidia-device-plugin --all
helm show values nvdp/nvidia-device-plugin --version 0.17.1   | grep -A35 -B5 -E '^affinity:|nodeAffinity:'
helm upgrade nvdp nvdp/nvidia-device-plugin   --namespace nvidia-device-plugin   --version 0.17.1   --reuse-values   --set affinity=null
kubectl get ds -n nvidia-device-plugin
kubectl get pods -n nvidia-device-plugin -o wide
kubectl logs -n nvidia-device-plugin   -l app.kubernetes.io/name=nvidia-device-plugin
kubectl get nodes -o jsonpath='{.items[0].status.allocatable.nvidia\.com/gpu}{"\n"}'
