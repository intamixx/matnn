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

# Define provider for Kubernetes
provider "kubernetes" {
  #host                   = "https://${var.kube_host}:6443"
  host                   = "https://${values(var.nodes)[0].address}:6443"
  cluster_ca_certificate = base64decode(var.kube_ca_certificate)
  token                  = var.kube_token
}

# Define provider for Helm
provider "helm" {
  kubernetes {
    #host                   = "https://${var.kube_host}:6443"
    host                   = "https://${values(var.nodes)[0].address}:6443"
    cluster_ca_certificate = base64decode(var.kube_ca_certificate)
    token                  = var.kube_token
  }
}

resource "kubectl_manifest" "nginx_ingress_patch" {
    yaml_body = <<YAML
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
spec:
  type: NodePort
  externalTrafficPolicy: Cluster
  selector:
    app.kubernetes.io/component: controller
    app.kubernetes.io/instance: ingress-nginx
    app.kubernetes.io/name: ingress-nginx
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: http
      nodePort: 31000
    - name: https
      protocol: TCP
      port: 443
      targetPort: https
      nodePort: 32000
YAML
  depends_on = [helm_release.prometheus]
}


# Install Prometheus using Helm
resource "helm_release" "prometheus" {
  name       = "prometheus"
  namespace  = "monitoring"
  repository = "https://prometheus-community.github.io/helm-charts"  # Helm repo URL
  chart      = "kube-prometheus-stack"
  version    = "69.4.1" # Adjust version as necessary
  create_namespace = true

  values = [
    # Optional values you want to override in the default chart values
    # You can add configurations like the following:
    # - Set replicas
    # - Adjust resource limits/requests
    # - Set the persistence volume settings, etc.
    #<<-EOT
    #prometheus:
    #  prometheusSpec:
    #    replicas: 2
    #EOT
    <<-EOT
    prometheus:
      prometheusSpec:
        additionalScrapeConfigs:
          - authorization:
              credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
            job_name: kubernetes-service-endpoints
            scheme: https
            tls_config:
              insecure_skip_verify: true
            kubernetes_sd_configs:
            - role: service
            relabel_configs:

            # annotation 'prometheus.io/scrape' must be set to 'true'
            - action: keep
              regex: true
              source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]

            # service cannot be in kube-system or prom namespaces
            - action: drop
              regex: (kube-system|monitoring)
              source_labels: [__meta_kubernetes_namespace]

            # allow override of default /metrics path
            - action: replace
              regex: (.+)
              source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
              target_label: __metrics_path__

            # allow override of default port
            - action: replace
              regex: ([^:])(?::\d+)?;(\d+)
              replacement: $1:$2
              source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
              target_label: __address__
            - {action: labelmap, regex: __meta_kubernetes_service_label_(.+)}
            - action: replace
              source_labels: [__meta_kubernetes_namespace]
              target_label: kubernetes_namespace
            - action: replace
              source_labels: [__meta_kubernetes_service_name]
              target_label: kubernetes_name
    EOT
  ]
}

resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  namespace  = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = "4.10.0"

  create_namespace = true

  values = [
    <<-EOF
      controller:
        service:
          type: NodePort
          nodePorts:
            http: 31000
            https: 32000
          externalTrafficPolicy: Cluster
    EOF
  ]
}
