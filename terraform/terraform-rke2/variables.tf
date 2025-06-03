variable "nodes" {
  type = map(object({
    address          = string
    internal_address = string
    user             = string
    ssh_key          = string
    role             = list(string)
  }))
}

variable "cni" {
  type    = string
  default = "cilium"
  description = "CNI plugin to install. Supported: cilium, calico, none"
  validation {
    condition     = contains(["cilium", "calico", "none"], var.cni)
    error_message = "cni must be one of cilium, calico, or none"
  }
}
