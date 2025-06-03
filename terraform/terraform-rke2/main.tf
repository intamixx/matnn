terraform {
  required_version = ">= 1.3"
  required_providers {
    rancher = {
      source  = "rancher/rke2"
      version = "1.0.2"
    }
  }
}

locals {
  join_info = {
    url   = try(module.rke2_nodes["node1"].join_url, "")
    token = try(module.rke2_nodes["node1"].join_token, "")
  }
}

module "rke2_nodes" {
  source  = "rancher/rke2"
  version = "1.0.2"

  for_each = var.nodes

  server_use_strategy               = "create"
  server_address                    = each.value.address
  server_domain_name                = each.key
  server_add_domain                 = false
  server_direct_access_use_strategy = "ssh"
  server_cloudinit_use_strategy     = "skip"

  server_user = {
    user             = each.value.user
    public_ssh_key   = file("${each.value.ssh_key}.pub")
    ssh_private_key  = file(each.value.ssh_key)
    user_workfolder  = "/home/${each.value.user}"
    timeout          = 10
  }

  install_use_strategy     = "tar"
  install_rke2_version     = "v1.29.3+rke2r1"
  install_remote_file_path = "/home/${each.value.user}/rke2"
  install_start            = true
  install_role             = contains(each.value.role, "controlplane") ? "server" : "agent"

  join_url   = contains(each.value.role, "controlplane") && each.key == "node1" ? null : local.join_info.url
  join_token = contains(each.value.role, "controlplane") && each.key == "node1" ? null : local.join_info.token

  config_use_strategy     = "merge"
  config_supplied_name    = "51-custom.yaml"
  config_supplied_content = <<-EOT
node-label:
  - "node=${each.key}"
node-ip: "${each.value.internal_address}"
EOT

  retrieve_kubeconfig = each.key == "node1"
}

# Write kubeconfig to file
resource "local_file" "kube_config" {
  filename          = "${path.root}/kube_config_cluster.yml"
  sensitive_content = module.rke2_nodes["node1"].kube_config
}

# Write CA certificate to file
resource "local_file" "ca_crt" {
  filename          = "${path.root}/ca.crt"
  sensitive_content = module.rke2_nodes["node1"].ca_crt
}

# Write join token to file
resource "local_file" "join_token" {
  filename          = "${path.root}/rke2_join.token"
  sensitive_content = module.rke2_nodes["node1"].join_token
}

# Outputs
output "join_token" {
  value     = module.rke2_nodes["node1"].join_token
  sensitive = true
}

output "ca_certificate" {
  value     = module.rke2_nodes["node1"].ca_crt
  sensitive = true
}

output "kube_config_file" {
  value = local_file.kube_config.filename
}

output "ca_crt_file" {
  value = local_file.ca_crt.filename
}

output "join_token_file" {
  value = local_file.join_token.filename
}
