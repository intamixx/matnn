# Configure Terraform
# (workload schema errors during installation -> kubectl apply --server-side -f https://github.com/kubernetes-sigs/kueue/releases/download/v0.6.2/manifests.yaml --force-conflicts)
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
  nodes {
    address = "137.117.234.92"
    internal_address = "10.123.1.5"
    user    = "root"
    role    = ["controlplane", "worker", "etcd"]
    ssh_key = "${file("/tmp/rootprivkey")}"
  } 
  nodes {
    address = "137.117.234.108"
    internal_address = "10.123.1.4"
    user    = "root"
    role    = ["worker", "etcd"]
    ssh_key = "${file("/tmp/rootprivkey")}"
  }
  enable_cri_dockerd = true
    addons_include = [
    "https://github.com/kubernetes-sigs/kueue/releases/download/v0.6.2/manifests.yaml",
    "https://raw.githubusercontent.com/kubernetes-sigs/kueue/main/site/static/examples/admin/single-clusterqueue-setup.yaml"
    ]
}

resource "local_file" "kube_cluster_yaml" {
  filename = "${path.root}/kube_config_cluster.yml"
  sensitive_content  = "${rke_cluster.cluster.kube_config_yaml}"
}
