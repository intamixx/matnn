#// code/variables.tf#L1-L20
#Resource Group Config - Object
#variable "rg_config" {
#  type = object({
#    create_rg = bool
#    name      = string
#    location  = string
#  })
#}

#Instance Config - List of Objects (Each object represents a instance config)
variable "instances_config" {
  type = list(object({
    name                      = string
    ami                       = string
    shape                     = string
    env                       = string
    public_ip_address         = string
    internal_ip_address       = string
    role                      = list(string)
    controlplane              = bool
  }))
}
