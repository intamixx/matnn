provider "helm" {
  kubernetes {
    config_path = "${path.root}/kube_config_cluster.yml"
  }
}

resource "helm_release" "cilium" {
  name       = "cilium"
  repository = "https://helm.cilium.io/"
  chart      = "cilium"
  version    = "1.15.4"
  namespace  = "kube-system"

  set {
    name  = "kubeProxyReplacement"
    value = "strict"
  }

  set {
    name  = "k8sServiceHost"
    value = module.rke2_nodes["node1"].server_address
  }

  set {
    name  = "k8sServicePort"
    value = "6443"
  }
}
