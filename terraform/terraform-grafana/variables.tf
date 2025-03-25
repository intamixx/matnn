#variable "kube_host" {
#  description = "The host of the Kubernetes API server"
#  type        = string
#}

variable "nodes" {
  type = map(object({
    address           = string
    internal_address  = string
    user              = string
    role              = list(string)
    ssh_key           = string
  }))
}

variable "kube_ca_certificate" {
  description = "Base64-encoded Kubernetes CA certificate"
  type        = string
}

variable "kube_token" {
  description = "The authentication token for the Kubernetes API"
  type        = string
}
