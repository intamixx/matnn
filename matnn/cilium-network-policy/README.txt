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

kubectl -n kube-system port-forward pod/hubble-relay-6c849fddf8-kxfsn 4245:4245 &
hubble observe flows --to-pod nfs
hubble observe --pod matnn --protocol tcp
hubble observe --pod matnn --verdict DROPPED
hubble observe --pod matnn --verdict FORWARDED

kubectl get cep

kubectl -n kube-system exec -it pod/cilium-87bn8  -- bash
cilium bpf lb list^C



          +---------------------------+
          |       Linkerd Mesh        |
          |  (mTLS, traffic, metrics) |
          +---------------------------+
                     ▲   ▲
                     |   |
         eBPF (node) |   | Sidecar proxy (per pod)
                     |   |
         +----------------------------------+
         |        Cilium CNI + Hubble       |
         | (networking, L3/L4 policy, eBPF) |
         +----------------------------------+

Cilium handles networking at the kernel level.
Linkerd handles service-to-service mTLS and L7 behavior via sidecars.

Think of it like this:

Pod
 ├─ Linkerd proxy  → L7 + mTLS
 ├─ Cilium eBPF    → L3/L4 networking
 └─ Kernel         → Fast path

helm upgrade cilium cilium/cilium --namespace kube-system   --set kubeProxyReplacement=false  --set hubble.enabled=true   --set hubble.ui.enabled=true   --set hubble.relay.enabled=true   --set bpf.masquerade=true   --set bpf.hostRouting=true   --set proxy.enabled=false   --set enableCiliumMesh=false


root@node1:~# kubectl -n kube-system get configmap cilium-config -o yaml | grep enable-l7-proxy
  enable-l7-proxy: "true"
root@node1:~# helm upgrade cilium cilium/cilium -n kube-system \
  --set kubeProxyReplacement=false \
  --set hubble.enabled=true \
  --set hubble.ui.enabled=true \
  --set hubble.relay.enabled=true \
  --set bpf.masquerade=true \
  --set bpf.hostRouting=true \
  --set proxy.enabled=false \
  --set l7Proxy=false \
  --set enableCiliumMesh=false
Release "cilium" has been upgraded. Happy Helming!
NAME: cilium
LAST DEPLOYED: Thu Dec 18 13:38:46 2025
NAMESPACE: kube-system
STATUS: deployed
REVISION: 7
TEST SUITE: None
NOTES:
You have successfully installed Cilium with Hubble Relay and Hubble UI.

Your release version is 1.18.4.

For any further help, visit https://docs.cilium.io/en/v1.18/gettinghelp
root@node1:~#
root@node1:~#
root@node1:~# kubectl -n kube-system get configmap cilium-config -o yaml | grep enable-l7-proxy                                                                enable-l7-proxy: "false"





helm upgrade cilium cilium/cilium -n kube-system \
  --set kubeProxyReplacement=false \
  --set proxy.enabled=false \
  --set l7Proxy=false \
  --set bpf.masquerade=false \
  --set bpf.hostRouting=true \
  --set hubble.enabled=true \
  --set hubble.ui.enabled=true \
  --set hubble.relay.enabled=true \
  --set enableCiliumMesh=false \
  --force


The --force flag forces Helm to replace existing resources, including the ConfigMap, so that stale values like bpf.masquerade=true are cleared.


helm upgrade cilium cilium/cilium -n kube-system \
  --set kubeProxyReplacement=false \
  --set proxy.enabled=false \
  --set l7Proxy=false \
  --set bpf.masquerade=false \
  --set bpf.hostRouting=true \
  --set hubble.enabled=true \
  --set hubble.ui.enabled=true \
  --set hubble.relay.enabled=true \
  --set enableCiliumMesh=false \
  --set cluster.name=cluster1 \
  --force

kubectl -n kube-system rollout restart daemonset cilium
kubectl -n kube-system rollout restart deploy hubble-relay


How it works in Cilium

Envoy DaemonSet

When Envoy is enabled, Cilium can offload L7 (HTTP, gRPC, Kafka, etc.) policy enforcement and observability to Envoy proxies.

Each node runs an Envoy pod (or sidecar) that handles L7 traffic.

L3/L4 policies are enforced directly by BPF in the kernel.

L7 policies require Envoy because BPF cannot fully parse L7 protocols.

Embedded mode vs. Envoy DaemonSet

Embedded mode (your current setup: Envoy DaemonSet: disabled (using embedded mode)) uses Cilium’s built-in proxy instead of deploying a separate Envoy.

It supports basic L7 policies for some protocols, but it’s less feature-rich than a full Envoy DaemonSet.

Advanced L7 observability and certain policies (like detailed HTTP headers or gRPC method restrictions) require Envoy.

Hubble + L7

Hubble Relay and UI collect flow data.

If L7 proxy is disabled, Hubble will only see L3/L4 flow information, not full L7 details.

To see L7 traffic (HTTP/gRPC) in Hubble UI, you must enable:

proxy.enabled=true
envoy.enabled=true
enable-l7-proxy=true



root@node1:~# curl -sL https://run.linkerd.io/install | sh
Downloading linkerd2-cli-edge-25.12.2-linux-amd64...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100 79.0M  100 79.0M    0     0  39.7M      0  0:00:01  0:00:01 --:--:-- 51.9M
Download complete!

Linkerd edge-25.12.2 was successfully installed 🎉


*******************************************
* This script is deprecated and no longer *
* installs stable releases.               *
*                                         *
* The latest edge release has been        *
* installed. In the future, please use    *
*   run.linkerd.io/install-edge           *
* for this behavior.                      *
*                                         *
* For stable releases, please see         *
*  https://linkerd.io/releases/           *
*******************************************

Add the linkerd CLI to your path with:

  export PATH=$PATH:/root/.linkerd2/bin

Now run:

  # install the GatewayAPI CRDs
  kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml

  linkerd check --pre                         # validate that Linkerd can be installed
  linkerd install --crds | kubectl apply -f - # install the Linkerd CRDs
  linkerd install | kubectl apply -f -        # install the control plane into the 'linkerd' namespace
  linkerd check                               # validate everything worked!

You can also obtain observability features by installing the viz extension:

  linkerd viz install | kubectl apply -f -  # install the viz extension into the 'linkerd-viz' namespace
  linkerd viz check                         # validate the extension works!
  linkerd viz dashboard                     # launch the dashboard

Looking for more? Visit https://linkerd.io/2/tasks


root@node1:~# linkerd version
Client version: edge-25.12.2
Server version: edge-25.12.2


kubectl -n linkerd-viz edit deployment web

      automountServiceAccountToken: false
      containers:
      - args:
        - -linkerd-metrics-api-addr=metrics-api.linkerd-viz.svc.cluster.local:8085
        - -cluster-domain=cluster.local
        - -controller-namespace=linkerd
        - -log-level=info
        - -log-format=plain
        - -enforced-host=^(localhost|127\.0\.0\.1|web\.linkerd-viz\.svc\.cluster\.local|web\.linkerd-viz\.svc|\[::1\])(:\d+)?$
        - -enable-pprof=false
        - web
        - --disable-dns-rebinding-check

kubectl annotate namespace default linkerd.io/inject=enabled
namespace/default annotated
kubectl annotate namespace kube-system linkerd.io/inject=disabled

# kubectl get deploy matnn -o yaml | linkerd inject - | kubectl apply -f -

deployment "matnn" injected

deployment.apps/matnn configured



📌 Summary of required Linkerd traffic when using Cilium

For any meshed namespace with restrictive policies, you must allow:

EGRESS (from workload)
To	Namespace	Port
linkerd-identity	linkerd	8080
linkerd-dst	linkerd	8086
linkerd-policy	linkerd	8090
INGRESS (to workload)
From	Namespace	Port
linkerd-viz (prometheus)	linkerd-viz	4191

If any one of these is missing → proxies break.


🔎 What each Linkerd port is for
Port	Direction	Purpose	Needs policy?
4140	loopback	Outbound proxy (127.0.0.1 only)	❌ NO
4143	ingress	Inbound proxy data plane	⚠️ YES (workload traffic)
4190	control	Proxy control plane	⚠️ YES (Linkerd control plane)
4191	admin	Proxy admin / metrics / probes	✅ YES (viz + kubelet)


🔍 Application ports vs mesh ports (this is correct)

Your app exposes:

Ports:
  8000
  8090
  9090


But Linkerd intercepts them and advertises:

LINKERD2_PROXY_INBOUND_PORTS: 8000,8090,9090


⚠️ You do NOT open these ports in Cilium ingress anymore

Only 4143 is needed.


root@node1:~/matnn/matnn/cilium-network-policy# linkerd viz edges po -n default
SRC                           DST                     SRC_NS        DST_NS    SECURED
prometheus-6bd7796686-5xj78   matnn-97dd4b8cd-hm4g4   linkerd-viz   default   √
prometheus-6bd7796686-5xj78   matnn-97dd4b8cd-kl4hc   linkerd-viz   default   √
root@node1:~/matnn/matnn/cilium-network-policy# linkerd viz edges po -n linkerd
SRC                           DST                                       SRC_NS        DST_NS    SECURED
prometheus-6bd7796686-5xj78   linkerd-destination-67c8c7bfc7-62vdc      linkerd-viz   linkerd   √
prometheus-6bd7796686-5xj78   linkerd-identity-6bd87bd5b9-bwwc7         linkerd-viz   linkerd   √
prometheus-6bd7796686-5xj78   linkerd-proxy-injector-69f9ccd5fb-l2bvh   linkerd-viz   linkerd   √
