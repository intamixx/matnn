kubectl create serviceaccount terraform-sa -n default
kubectl create clusterrolebinding terraform-sa-binding --clusterrole=cluster-admin --serviceaccount=default:terraform-sa
kubectl -n default create token terraform-sa
