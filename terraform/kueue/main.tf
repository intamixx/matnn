# Configure Terraform for RKE / Kubernetes / Kueue
# (workload schema errors during installation -> kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/manifests.yaml --force-conflicts)
terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.15.0"
    }
    rke = {
      source = "rancher/rke"
      version = "1.5.0"
    }
  }
}

resource "rke_cluster" "cluster" {
  # Other configurations for RKE cluster

  # Using dynamic block to loop through nodes
  dynamic "nodes" {
    for_each = var.nodes

    content {
      address          = nodes.value.address
      internal_address = nodes.value.internal_address
      user             = nodes.value.user
      role             = nodes.value.role
      ssh_key          = file(nodes.value.ssh_key)
    }
  }
  enable_cri_dockerd = true
    addons_include = [
    "https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/manifests.yaml",
    "https://raw.githubusercontent.com/kubernetes-sigs/kueue/main/site/static/examples/admin/single-clusterqueue-setup.yaml",
    #"https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/prometheus.yaml"
    ]
}

resource "local_file" "kube_cluster_yaml" {
  filename = "${path.root}/kube_config_cluster.yml"
  sensitive_content  = "${rke_cluster.cluster.kube_config_yaml}"

  # Establishes connection to be used by all
  # generic remote provisioners (i.e. file/remote-exec)
  connection {
    type     = "ssh"
    user     = "root"
    #password = var.root_password
    #private_key = file("${path.module}/hello.txt")
    private_key = file("~/.ssh/id_rsa")
    host     = "40.118.87.219"
  }

  provisioner "file" {
    source      = "kube_config_cluster.yml"
    destination = "/root/.kube/config"
  }

  provisioner "remote-exec" {
    inline = [
      "kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/manifests.yaml --force-conflicts",
      "sleep 10",
      "kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/kueue/main/site/static/examples/admin/single-clusterqueue-setup.yaml",
      "sleep 5",
      #"kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.10.1/prometheus.yaml"
    ]
  }
}
