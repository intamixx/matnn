provider "azurerm" {
  subscription_id            = var.subscription_id
  features {}
}

resource "azurerm_resource_group" "mtc-rg" {
  name     = "mtc-resources"
  location = var.location
  tags     = var.tags
}

module "network" {
  source              = "./network"
  server_names        = var.server_names
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = var.location
  tags                = var.tags
}

module "compute" {
  source                = "./compute"
  server_names          = var.server_names
  subnet_id             = module.network.subnet_id
  public_ip_ids         = module.network.public_ip_ids
  resource_group_name   = azurerm_resource_group.mtc-rg.name
  location              = var.location
  tags                  = var.tags
  admin_username        = var.admin_username
  ssh_public_key_path   = var.ssh_public_key_path
  ssh_identity_file     = var.ssh_identity_file
  custom_data_template  = var.custom_data_template
}

module "security" {
  source              = "./security"
  server_names        = var.server_names
  nic_ids             = module.compute.nic_ids
  resource_group_name = azurerm_resource_group.mtc-rg.name
  location            = var.location
  tags                = var.tags
  admin_cidr          = var.admin_cidr
  app_cidr            = var.app_cidr
}
