output "server_names" { value = module.compute.vm_names }
output "public_ips" { value = module.network.public_ip_addresses }
output "private_ips" { value = module.compute.private_ips }
output "nic_ids" { value = module.compute.nic_ids }
output "nsg_id" { value = module.security.nsg_id }
