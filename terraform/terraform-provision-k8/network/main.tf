resource "azurerm_virtual_network" "mtc-vn" {
  name                = "mtc-network"
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = ["10.123.0.0/16"]
  dns_servers         = ["8.8.8.8", "8.8.4.4"]
  tags                = var.tags
}

resource "azurerm_subnet" "mtc-subnet" {
  name                 = "mtc-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.mtc-vn.name
  address_prefixes     = ["10.123.1.0/24"]
}

resource "azurerm_public_ip" "mtc-ip" {
  for_each            = toset(var.server_names)
  name                = each.value
  resource_group_name = var.resource_group_name
  location            = var.location
  allocation_method   = "Static"
  tags                = var.tags
}
