variable "nodes" {
  type = map(object({
    address           = string
    internal_address  = string
    user              = string
    role              = list(string)
    ssh_key           = string
  }))
}
