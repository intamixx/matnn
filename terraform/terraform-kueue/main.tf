terraform {
  required_providers {
    kubectl = {
      source = "alekc/kubectl"
      version = "2.1.3"
    }
  }
}

provider "kubectl" {
  # Configuration options
  config_path = "./kube_config_cluster.yaml"
}

# Configure the Kubernetes provider
provider "kubernetes" {
  # Ensure your kubeconfig is set correctly
  config_path = "./kube_config_cluster.yaml"
}

# Create Kubernetes Service Account
resource "kubernetes_service_account" "terraform_sa" {
  metadata {
    name      = "terraform-sa"
    namespace = "default"  # Modify if you want it in a different namespace
  }
}

# Create a ClusterRoleBinding to bind the service account to the cluster-admin role
resource "kubernetes_cluster_role_binding" "terraform_sa_binding" {
  metadata {
    name = "terraform-sa-binding"
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.terraform_sa.metadata[0].name
    namespace = kubernetes_service_account.terraform_sa.metadata[0].namespace
  }

  role_ref {
    kind     = "ClusterRole"
    name     = "cluster-admin"  # Modify this if you want to limit the permissions
    api_group = "rbac.authorization.k8s.io"
  }
}

data "kubernetes_secret" "terraform_sa_token" {
  metadata {
    # The secret name should be of the form <service-account-name>-token-<random-suffix>
    name      = "${kubernetes_service_account.terraform_sa.metadata[0].name}"
    namespace = kubernetes_service_account.terraform_sa.metadata[0].namespace
  }
  depends_on = [local_file.kube_cluster_yaml]
}

# Create the monitoring namespace
resource "kubectl_manifest" "monitoring_namespace" {
    yaml_body = <<YAML
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
YAML
}

# Create the terraform-sa secret
resource "kubectl_manifest" "terraform_sa_secret" {
    yaml_body = <<YAML
apiVersion: v1
kind: Secret
metadata:
  name: terraform-sa
  namespace: default
  annotations:
    kubernetes.io/service-account.name: "terraform-sa"
type: kubernetes.io/service-account-token
YAML
}

# Create the graphana ingress
resource "kubectl_manifest" "graphana_ingress" {
    yaml_body = <<YAML
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: prometheus-grafana
              port:
                number: 80
YAML
}

resource "local_file" "kube_cluster_yaml" {
  filename = "${path.root}/kube_config_cluster.yaml"
  source = "${path.root}/kube_config_cluster.yaml"
  #sensitive_content  = "${rke_cluster.cluster[each.key].kube_config_yaml}"
  #local_sensitive_file  = "${rke_cluster.cluster.kube_config_yaml}"

  # Establishes connection to be used by all
  # generic remote provisioners (i.e. file/remote-exec)
  connection {
    type     = "ssh"
    user     = "root"
    #password = var.root_password
    private_key = file("~/.ssh/id_rsa")
    host     = values(var.nodes)[0].address
  }
  provisioner "file" {
      source      = "./install_kueue.sh"  # Local script file path
      destination = "/tmp/install_kueue.sh"
  }
  provisioner "remote-exec" {
    inline = [
      "echo 'Running setup script...'",
      "bash /tmp/install_kueue.sh"
    ]
  }
}

output "terraform_sa_token" {
  value     = data.kubernetes_secret.terraform_sa_token.data["token"]
  sensitive = true
  depends_on = [local_file.kube_cluster_yaml]
}
