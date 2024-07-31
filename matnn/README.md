kubectl expose deployment matnn --type=LoadBalancer --name=matnn-service

kubectl -n default create token admin-user
