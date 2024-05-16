#// code/common.auto.tfvars.tf#L1-L30
#Resource Group Config - Object Values
#rg_config = {
#  create_rg = true
#  name      = "Demo-Terraform-RG"
#  location  = "uksouth"
#}

#Instance Configs - List of Objects Values
instances_config = [
  #Instance 1 (Object1)
  {
    name                      = "k8-01"
    ami                       = "ami1"  
    shape                     = "t2-micro"
    env                       = "dev"
    public_ip_address         = "172.201.14.9"
    internal_ip_address       = "10.123.1.5"
    role                      = ["controlplane", "worker", "etcd"]
    controlplane              = true
  },
  #Instance 2 (object2)
  {
    name                      = "k8-02"
    ami                       = "ami1"  
    shape                     = "t2-micro"
    env                       = "dev"
    public_ip_address         = "172.201.13.74"
    internal_ip_address       = "10.123.1.4"
    role                      = ["worker", "etcd"]
    controlplane              = false
  }
]

