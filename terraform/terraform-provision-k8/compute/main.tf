resource "azurerm_network_interface" "mtc-nic" {
  for_each            = toset(var.server_names)
  name                = each.value
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = var.public_ip_ids[each.key]
  }
}

resource "azurerm_linux_virtual_machine" "mtc-vm" {
  for_each              = toset(var.server_names)
  name                  = each.value
  resource_group_name   = var.resource_group_name
  location              = var.location
  size                  = "Standard_A4_v2"
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.mtc-nic[each.key].id]

  custom_data = filebase64(var.custom_data_template)

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  provisioner "local-exec" {
    command = templatefile("${path.module}/ssh-provision.tpl", {
      hostname     = self.public_ip_address,
      user         = var.admin_username,
      identityfile = var.ssh_identity_file
    })
    interpreter = ["bash", "-c"]
  }

  tags = var.tags
}
