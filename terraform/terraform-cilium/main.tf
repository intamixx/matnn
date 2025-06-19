provider "helm" {
  kubernetes = {
    config_path = "${path.root}/kube_config_cluster.yaml"
  }
}

resource "helm_release" "cilium" {
  name       = "cilium"
  repository = "https://helm.cilium.io/"
  chart      = "cilium"
  version    = "1.15.4"
  namespace  = "kube-system"

  set = [
    {
      name  = "kubeProxyReplacement"
      value = "strict"
    },
    {
      name  = "k8sServiceHost"
      value = var.nodes["node1"].address
    },
    {
      name  = "k8sServicePort"
      value = "6443"
    }
  ]
}
