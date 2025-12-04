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

