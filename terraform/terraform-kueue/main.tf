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
    source      = "kube_config_cluster.yaml"
    destination = "/root/.kube/config"
  }

  provisioner "file" {
      source      = "./install_kueue.sh"  # Local script file path
      destination = "/tmp/install_kueue.sh"
  }
  provisioner "file" {
      source      = "./secret.yaml"  # Local script file path
      destination = "/tmp/secret.yaml"
  }
  provisioner "file" {
      source      = "./ingress.yaml"  # Local script file path
      destination = "/tmp/ingress.yaml"
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
