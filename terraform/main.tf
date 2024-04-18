# Configure Terraform
terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.15.0"
    }
    rke = {
      source = "rancher/rke"
      version = "1.5.0"
    }
  }
}

provider "azurerm" {
  skip_provider_registration = true
  features {}
}

resource "azurerm_resource_group" "mtc-rg" {
  name     = "mtc-resources"
  location = "West Europe"
  tags = {
    environment = "dev"
  }
}

resource "azurerm_virtual_network" "mtc-vn" {
  name                = "mtc-network"
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = azurerm_resource_group.mtc-rg.location
  address_space       = ["10.123.0.0/16"]
  dns_servers         = ["8.8.8.8", "8.8.4.4"]

  #subnet {
  #  name           = "subnet1"
  #  address_prefix = "10.0.1.0/24"
  #}

  #subnet {
  #  name           = "subnet2"
  #  address_prefix = "10.0.2.0/24"
  #  security_group = azurerm_network_security_group.example.id
  #}

  tags = {
    environment = "dev"
  }
}

resource "azurerm_subnet" "mtc-subnet" {
  name                 = "mtc-subnet"
  resource_group_name  = azurerm_resource_group.mtc-rg.name
  virtual_network_name = azurerm_virtual_network.mtc-vn.name
  address_prefixes     = ["10.123.1.0/24"]

  #delegation {
  #  name = "delegation"
#
#    service_delegation {
#      name    = "Microsoft.ContainerInstance/containerGroups"
#      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action", "Microsoft.Network/virtualNetworks/subnets/prepareNetwor
kPolicies/action"]
#    }
#  }
}

resource "azurerm_network_security_group" "mtc-sg" {
  name                = "mtc-sg"
  location            = azurerm_resource_group.mtc-rg.location
  resource_group_name = azurerm_resource_group.mtc-rg.name

  security_rule {
    name                       = "rule-2379"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "2379"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "rule-6443"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "rule-10250"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "10250"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    environment = "dev"
  }
}

resource "azurerm_public_ip" "mtc-ip-1" {
  name                = "mtc-ip-1"
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = azurerm_resource_group.mtc-rg.location
  allocation_method   = "Static"

  tags = {
    environment = "dev"
  }
}

resource "azurerm_public_ip" "mtc-ip-2" {
  name                = "mtc-ip-2"
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = azurerm_resource_group.mtc-rg.location
  allocation_method   = "Static"

  tags = {
    environment = "dev"
  }
}

resource "azurerm_network_interface" "mtc-nic-1" {
  name                = "mtc-nic-1"
  location            = azurerm_resource_group.mtc-rg.location
  resource_group_name = azurerm_resource_group.mtc-rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.mtc-subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.mtc-ip-1.id
  }
}

resource "azurerm_network_interface" "mtc-nic-2" {
  name                = "mtc-nic-2"
  location            = azurerm_resource_group.mtc-rg.location
  resource_group_name = azurerm_resource_group.mtc-rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.mtc-subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.mtc-ip-2.id
  }
}

resource "azurerm_linux_virtual_machine" "mtc-vm-1" {
  name                = "mtc-vm-1"
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = azurerm_resource_group.mtc-rg.location
  size                = "Standard_A4_v2"
  admin_username      = "adminuser"
  network_interface_ids = [ azurerm_network_interface.mtc-nic-1.id, ]

  custom_data = filebase64("customdata.tpl")

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("/tmp/mtcazurekey.pub")
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
      command = templatefile("${var.host_os}-ssh-script.tpl", {
      #command = templatefile("linux-ssh-script.tpl", {
          hostname = self.public_ip_address,
          user = "adminuser",
          identityfile = "~/.ssh/mtcazurekey"
      })
      #interpreter = var.host_os == "windows" ? ["Powershell", "-Command"] : ["bash", "-c"]
      #interpreter = "linux" == "windows" ? ["Powershell", "-Command"] : ["bash", "-c"]
      interpreter = ["bash", "-c"]
  }

  tags = {
    environment = "dev"
  }
}

resource "azurerm_linux_virtual_machine" "mtc-vm-2" {
  name                = "mtc-vm-2"
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = azurerm_resource_group.mtc-rg.location
  size                = "Standard_A4_v2"
  admin_username      = "adminuser"
  network_interface_ids = [ azurerm_network_interface.mtc-nic-2.id, ]

  custom_data = filebase64("customdata.tpl")

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("/tmp/mtcazurekey.pub")
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
      command = templatefile("${var.host_os}-ssh-script.tpl", {
      #command = templatefile("linux-ssh-script.tpl", {
          hostname = self.public_ip_address,
          user = "adminuser",
          identityfile = "~/.ssh/mtcazurekey"
      })
      #interpreter = var.host_os == "windows" ? ["Powershell", "-Command"] : ["bash", "-c"]
      #interpreter = "linux" == "windows" ? ["Powershell", "-Command"] : ["bash", "-c"]
      interpreter = ["bash", "-c"]
  }

  tags = {
    environment = "dev"
  }
}

data "azurerm_public_ip" "mtc-ip-data-1" {
    name = azurerm_public_ip.mtc-ip-1.name
    resource_group_name = azurerm_resource_group.mtc-rg.name
}
data "azurerm_public_ip" "mtc-ip-data-2" {
    name = azurerm_public_ip.mtc-ip-2.name
    resource_group_name = azurerm_resource_group.mtc-rg.name
}

output "public_ip_address-1" {
    value = "${azurerm_linux_virtual_machine.mtc-vm-1.name}: ${data.azurerm_public_ip.mtc-ip-data-1.ip_address}"
}
output "public_ip_address-2" {
    value = "${azurerm_linux_virtual_machine.mtc-vm-2.name}: ${data.azurerm_public_ip.mtc-ip-data-2.ip_address}"
}
