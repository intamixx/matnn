#!/bin/bash

#kubectl apply -f /tmp/secret.yaml
kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/manifests.yaml --force-conflicts
sleep 5
#kubectl create namespace monitoring
sleep 10
kubectl apply --server-side -f https://raw.githubusercontent.com/kubernetes-sigs/kueue/main/site/static/examples/admin/single-clusterqueue-setup.yaml --force-conflicts
sleep 5
#kubectl apply -f /tmp/ingress.yaml
#sleep 5
kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/prometheus.yaml --force-conflicts
sleep 5
kubectl apply --server-side -f https://raw.githubusercontent.com/kubeflow/mpi-operator/master/deploy/v2beta1/mpi-operator.yaml --force-conflicts
sleep 5
kubectl annotate svc kueue-controller-manager-metrics-service prometheus.io/scrape='true' -n kueue-system
sleep 5
kubectl -n default create token terraform-sa
