variable "nodes" {
  type = map(object({
    address          = string
    internal_address = string
    user             = string
    ssh_key          = string
    role             = list(string)
  }))
}
