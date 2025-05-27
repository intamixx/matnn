kubectl expose deployment matnn --type=LoadBalancer --name=matnn-service

kubectl -n default create token admin-user


self signed cert

openssl req -x509 -nodes -days 365   -newkey rsa:2048   -keyout tls.key   -out tls.crt   -subj "/CN=matnn-app.intamixx.uk/O=intamixx/"

kubectl create secret tls matnn-app-tls-secret --cert=tls.crt --key=tls.key -n default
