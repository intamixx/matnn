output "nic_ids" { value = { for k,v in azurerm_network_interface.mtc-nic : k => v.id } }
output "vm_ids" { value = { for k,v in azurerm_linux_virtual_machine.mtc-vm : k => v.id } }
output "private_ips" { value = { for k,v in azurerm_network_interface.mtc-nic : k => v.ip_configuration[*].private_ip_address } }
output "vm_names" { value = [for k,v in azurerm_linux_virtual_machine.mtc-vm : v.name] }
