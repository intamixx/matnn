cilium upgrade --version v1.18.2
cilium hubble enable

# cilium status
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       OK
    \__/       ClusterMesh:        disabled

DaemonSet              cilium                   Desired: 2, Ready: 2/2, Available: 2/2
DaemonSet              cilium-envoy             Desired: 2, Ready: 2/2, Available: 2/2
Deployment             cilium-operator          Desired: 1, Ready: 1/1, Available: 1/1
Deployment             hubble-relay             Desired: 1, Ready: 1/1, Available: 1/1
Containers:            cilium                   Running: 2
                       cilium-envoy             Running: 2
                       cilium-operator          Running: 1
                       clustermesh-apiserver
                       hubble-relay             Running: 1
Cluster Pods:          21/21 managed by Cilium
Helm chart version:    1.18.2
Image versions         cilium             quay.io/cilium/cilium:v1.18.2@sha256:858f807ea4e20e85e3ea3240a762e1f4b29f1cb5bbd0463b8aa77e7b097c0667: 2
                       cilium-envoy       quay.io/cilium/cilium-envoy:v1.34.7-1757592137-1a52bb680a956879722f48c591a2ca90f7791324@sha256:7932d656b63f6f866b6732099d33355184322123cfe1182e6f05175a3bc2e0e0: 2
                       cilium-operator    quay.io/cilium/operator-generic:v1.18.2@sha256:cb4e4ffc5789fd5ff6a534e3b1460623df61cba00f5ea1c7b40153b5efb81805: 1
                       hubble-relay       quay.io/cilium/hubble-relay:v1.18.2@sha256:6079308ee15e44dff476fb522612732f7c5c4407a1017bc3470916242b0405ac: 1


helm repo add cilium https://helm.cilium.io/
helm get values cilium -n kube-system > cilium-values.yaml
helm upgrade cilium cilium/cilium   --namespace kube-system   -f cilium-values.yaml
helm install cilium cilium/cilium \
  --namespace kube-system \
  --set kubeProxyReplacement=false \
  --set routing-mode=tunnel \
  --set ipam.mode=cluster-pool \
  --set cluster-pool-ipv4-cidr=10.233.0.0/16 \
  --set cluster-pool-ipv4-mask-size=24 \
  --set cluster.id=1 \
  --set cluster.name=cluster1

helm uninstall cilium -n kube-system
kubectl delete ds cilium -n kube-system --ignore-not-found
kubectl delete ds cilium-envoy -n kube-system --ignore-not-found
kubectl delete deploy cilium-operator -n kube-system --ignore-not-found
kubectl delete cm cilium-config -n kube-system --ignore-not-found

kubectl -n kube-system delete ds cilium
kubectl -n kube-system delete deploy cilium-operator
kubectl -n kube-system delete configmap cilium-config
kubectl -n kube-system delete serviceaccount cilium
kubectl -n kube-system delete clusterrole cilium
kubectl -n kube-system delete clusterrolebinding cilium
kubectl -n kube-system delete crds -l io.cilium=legacy-crd
kubectl -n kube-system delete clusterrole cilium-operator
kubectl -n kube-system delete clusterrolebinding cilium-operator
kubectl -n kube-system delete serviceaccount cilium-operator


kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.19.1/cert-manager.yaml
kubectl get pods --namespace cert-manager
kubectl apply -f ./matnn-ingress.yaml
 kubectl get certificate
NAME               READY   SECRET             AGE
letsencrypt-prod   False   letsencrypt-prod   63s


patch ingress with VIP for external access kubectl -n ingress-nginx patch svc ingress-nginx-controller -p '{"spec": {"externalIPs": ["10.123.1.100"]}}'
make it loadbalancer

Forward traffic to VIP 
 iptables -t nat -A PREROUTING -p tcp -d 10.123.1.4 --dport 443 -j DNAT --to-destination 10.233.100.100:443
 curl https://10.233.100.100 -k -H "Host: matnn-app.intamixx.uk"
 iptables -t nat -A PREROUTING -p tcp -d 10.123.1.4 --dport 80 -j DNAT --to-destination 10.233.100.100:80

node2
iptables -A PREROUTING -d 10.123.1.5/32 -p tcp -m tcp --dport 80 -j DNAT --to-destination 10.233.100.100:80
iptables -A PREROUTING -d 10.123.1.5/32 -p tcp -m tcp --dport 443 -j DNAT --to-destination 10.233.100.100:443
iptables -A PREROUTING -d 10.123.1.5/32 -p tcp -m tcp --dport 8090 -j DNAT --to-destination xxxx:8090

Then restart the cert-manager Order:

kubectl delete challenge --all -n default
kubectl delete order --all -n default


kubectl describe certificaterequest letsencrypt-prod-1 -n default
kubectl get certificaterequest -n default







cilium hubble enable --ui
iptables -t nat -A PREROUTING -p tcp -d 10.123.1.5 --dport 32000 -j DNAT --to-destination 10.0.1.145:8081

# grpcurl -plaintext 127.0.0.1:4245 list
Handling connection for 4245
grpc.health.v1.Health
grpc.reflection.v1.ServerReflection
grpc.reflection.v1alpha.ServerReflection
observer.Observer

grpcurl -plaintext -d '{"service":""}' 127.0.0.1:4245 grpc.health.v1.Health/Check

grpcurl -plaintext 127.0.0.1:4245 observer.Observer/GetNodes
grpcurl -plaintext -d '{}' 127.0.0.1:4245 observer.Observer/GetFlows | more

grpcurl -plaintext 127.0.0.1:4245 describe observer.Observer
Handling connection for 4245
observer.Observer is a service:
service Observer {
  rpc GetAgentEvents ( .observer.GetAgentEventsRequest ) returns ( stream .observer.GetAgentEventsResponse );
  rpc GetDebugEvents ( .observer.GetDebugEventsRequest ) returns ( stream .observer.GetDebugEventsResponse );
  rpc GetFlows ( .observer.GetFlowsRequest ) returns ( stream .observer.GetFlowsResponse );
  rpc GetNamespaces ( .observer.GetNamespacesRequest ) returns ( .observer.GetNamespacesResponse );
  rpc GetNodes ( .observer.GetNodesRequest ) returns ( .observer.GetNodesResponse );
  rpc ServerStatus ( .observer.ServerStatusRequest ) returns ( .observer.ServerStatusResponse );
}

