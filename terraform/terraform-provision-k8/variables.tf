variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "West Europe"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "server_names" {
  type    = list(string)
  default = ["k8-03"]
}

variable "tags" {
  type    = map(string)
  default = {
    environment = "dev"
  }
}

variable "admin_username" {
  type    = string
  default = "adminuser"
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_rsa.pub"
}

variable "ssh_identity_file" {
  type    = string
  default = "~/.ssh/id_rsa"
}

variable "custom_data_template" {
  type    = string
  default = "customdata.tpl"
}
variable "admin_cidr" {
  type    = string
  default = "217.13.xx.xx/32"
}

variable "app_cidr" {
  type    = string
  default = "217.13.xx.xx/32"
}
