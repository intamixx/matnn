variable "server_names" { type = list(string) }
variable "nic_ids" { type = map(string) }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }
variable "admin_cidr" {
  type        = string
  description = "CIDR allowed to SSH"
}
variable "app_cidr" {
  type        = string
  description = "CIDR allowed to access HTTP"
}
