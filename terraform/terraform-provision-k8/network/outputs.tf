output "subnet_id" { value = azurerm_subnet.mtc-subnet.id }
output "public_ip_ids" { value = { for k,v in azurerm_public_ip.mtc-ip : k => v.id } }
output "public_ip_addresses" { value = { for k,v in azurerm_public_ip.mtc-ip : k => v.ip_address } }
