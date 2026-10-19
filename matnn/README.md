kubectl expose deployment matnn --type=LoadBalancer --name=matnn-service

kubectl -n default create token admin-user


self signed cert

openssl req -x509 -nodes -days 365   -newkey rsa:2048   -keyout tls.key   -out tls.crt   -subj "/CN=matnn-app.intamixx.uk/O=intamixx/"

kubectl create secret tls matnn-app-tls-secret --cert=tls.crt --key=tls.key -n default


kubectl scale deployment matnn --replicas=2
```
kubectl get node -o jsonpath --template='{range .items[*]}{.metadata.name}{"\n"}{range .status.conditions[*]}{"\t"}{.type}{" : "}{.status}{" -> "}{.reason}{" ("}{.message}{")"}{"\n"}{end}{end}'
```

kube-proxy into ipvs mode
kubectl -n kube-system edit configmap/kube-proxy

use keepalived, unicast mode

ingress add;
optionally: nginx.ingress.kubernetes.io/affinity-mode: "persistent"

This prevents random routing to any node in the cluster, and ensures traffic consistently lands on a pod that can see and honor the session cookie.

kubectl -n ingress-nginx scale deployment ingress-nginx-controller --replicas=2

🛠 How to patch:
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  -p '{"spec":{"externalTrafficPolicy":"Local"}}'


patch ingress with VIP for external access
 kubectl -n ingress-nginx patch svc ingress-nginx-controller   -p '{"spec": {"externalIPs": ["10.123.1.100"]}}'


Forward traffic to metallb VIP

iptables -t nat -A PREROUTING -d 10.123.1.4/32 -p tcp -m tcp --dport 443 -j DNAT --to-destination 10.233.100.100:443

iptables -t nat -A PREROUTING -d 10.123.1.4/32 -p tcp -m tcp --dport 80 -j DNAT --to-destination 10.233.100.100:80



kubectl auth can-i create jobsets.jobset.x-k8s.io  -n default  --as=system:serviceaccount:default:default

kubectl auth can-i get localqueues.kueue.x-k8s.io  -n default  --as=system:serviceaccount:default:default

kubectl auth can-i create jobsets.jobset.x-k8s.io   -n default   --as=system:serviceaccount:default:matnn-jobset-submitter

kubectl get deployment matnn -n default -o jsonpath='{.spec.template.spec.serviceAccountName}{"\n"}'

kubectl get clusterrole kueue-batch-admin-role -o yaml
kubectl get clusterrolebinding matnn-clusterrole -o yaml


kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl top nodes
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}
]'

kubectl apply -f ./matnn-vpa.yaml
kubectl get vpa
kubectl logs  vpa/matnn-vpa
kubectl describe vpa matnn-vpa -n default

kubectl get pods -n default -l app=matnn   -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{range .spec.containers[*]}{.name}{" requests="}{.resources.requests}{" limits="}{.resources.limits}{"\n"}{end}{end}'

kubectl get deployment vpa-updater -n kube-system   -o jsonpath='{.spec.template.spec.containers[0].args}' 

kubectl get deployment matnn -n default   -o jsonpath='{.spec.template.spec.containers[?(@.name=="matnn")].resources}{"\n"}'

kubectl get pod -n default -l app=matnn   -o custom-columns='POD:.metadata.name,CPU_REQUEST:.spec.containers[0].resources.requests.cpu,MEM_REQUEST:.spec.containers[0].resources.requests.memory,CPU_LIMIT:.spec.containers[0].resources.limits.cpu,MEM_LIMIT:.spec.containers[0].resources.limits.memory'imits.cpu,MEM_LIMIT:.spec.containers[0].resources.limits.memory'

kubectl logs -n kube-system   deployment/vpa-admission-controller   --since=30m --tail=250   | grep -Ei 'matnn|recommend|patch|error|fail|limit'
