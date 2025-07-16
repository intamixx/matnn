locals {
  # Pick first controlplane node as server
  controlplane_nodes = { for k, v in var.nodes : k => v if contains(v.role, "control-plane") }
  server_node_key    = length(keys(local.controlplane_nodes)) > 0 ? keys(local.controlplane_nodes)[0] : ""
  server_node        = local.controlplane_nodes[local.server_node_key]
}

# Install RKE2 server on first controlplane node
resource "null_resource" "rke2_server_install" {
  count = local.server_node_key != "" ? 1 : 0

  connection {
    host        = local.server_node.address
    user        = local.server_node.user
    private_key = file(local.server_node.ssh_key)
  }

  provisioner "remote-exec" {
    inline = [
      "curl -sfL https://get.rke2.io | sh -",

      # Write config.yaml with echo and redirect (simpler, avoid heredoc issues)
      "sudo mkdir -p /etc/rancher/rke2",
      "echo \"disable:\" | sudo tee /etc/rancher/rke2/config.yaml",
      "echo \"  - rke2-canal\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"  - rke2-ingress-nginx\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"node-name: ${local.server_node_key}\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"node-ip: ${local.server_node.internal_address}\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"tls-san:\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"  - ${local.server_node.address}\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      #"echo \"  - ${local.server_node.internal_address}\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"disable: rke2-ingress-nginx\" | sudo tee -a /etc/rancher/rke2/config.yaml",
      "echo \"write-kubeconfig-mode: '0644'\" | sudo tee -a /etc/rancher/rke2/config.yaml",

      "systemctl enable rke2-server.service",
      "systemctl start rke2-server.service"
    ]
  }
  provisioner "file" {
    source      = "cilium.yaml"
    destination = "/tmp/cni.yaml"
  }
# Copy kubeconfig to right place
  provisioner "remote-exec" {
    inline = [
      "sudo cp /etc/rancher/rke2/rke2.yaml /root/.kube/config"
    ]
  }
}

# Get node-token from server after install
data "external" "node_token" {
  depends_on = [null_resource.rke2_server_install]

  program = ["bash", "-c", <<EOT
ssh -o StrictHostKeyChecking=no -i ${local.server_node.ssh_key} ${local.server_node.user}@${local.server_node.address} cat /var/lib/rancher/rke2/server/node-token | jq -R '{token: .}'
EOT
  ]
}

# Install RKE2 agent on all other nodes (including controlplane nodes except server node)
resource "null_resource" "rke2_agents_install" {
  for_each = { for k, v in var.nodes : k => v if k != local.server_node_key }

  connection {
    host        = each.value.address
    user        = each.value.user
    private_key = file(each.value.ssh_key)
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mkdir -p /etc/rancher/rke2"
    ]
  }

  provisioner "file" {
        content = templatefile("config.yaml.tpl", {
        node_name      = each.key
        node_ip        = each.value.internal_address
        server_address = local.server_node.internal_address
        node_token     = data.external.node_token.result.token
        is_controlplane = contains(each.value.role, "controlplane")
        })
    destination = "/etc/rancher/rke2/config.yaml"
  }

  provisioner "remote-exec" {
    inline = [
      "curl -sfL https://get.rke2.io | sh -",

      # Decide whether agent or server based on role
      <<-EOT
        roles="${join(" ", each.value.role)}"
        if echo "$roles" | grep -qw controlplane; then
          systemctl enable rke2-server.service
          systemctl start rke2-server.service
        else
          systemctl enable rke2-agent.service
          systemctl start rke2-agent.service
        fi
      EOT
    ]
  }
}

resource "null_resource" "label_nodes" {
  depends_on = [null_resource.rke2_agents_install]

  connection {
    host        = local.server_node.address
    user        = local.server_node.user
    private_key = file(local.server_node.ssh_key)
  }

  provisioner "remote-exec" {
    inline = concat(
      ["sleep 20"],
      flatten([
        for node_name, node_data in var.nodes : [
          for role in node_data.role :
            "sudo /var/lib/rancher/rke2/bin/kubectl label node ${node_name} node-role.kubernetes.io/${role}='true' --overwrite"
        ]
      ])
    )
  }
}

# Install CNI on first controlplane node
#resource "null_resource" "cni_install" {
#  depends_on = [null_resource.label_nodes]
#  count = local.server_node_key != "" ? 1 : 0
#
#  connection {
#    host        = local.server_node.address
#    user        = local.server_node.user
#    private_key = file(local.server_node.ssh_key)
#  }
#  provisioner "remote-exec" {
#    inline = [
#    "kubectl apply -f /tmp/cni.yaml --force-conflicts --server-side"
#    ]
#  }
#}


resource "null_resource" "fetch_kubeconfig" {
  depends_on = [null_resource.rke2_server_install]

  provisioner "remote-exec" {
    connection {
      host        = local.server_node.address
      user        = local.server_node.user
      private_key = file(local.server_node.ssh_key)
    }

    inline = [
      "cat /etc/rancher/rke2/rke2.yaml"
    ]
  }

  provisioner "local-exec" {
    command = <<EOT
      ssh -o StrictHostKeyChecking=no -i ${local.server_node.ssh_key} ${local.server_node.user}@${local.server_node.address} \
      "sudo cat /etc/rancher/rke2/rke2.yaml" | sed 's|127.0.0.1|${local.server_node.address}|' > ./kube_config_cluster.yaml
    EOT
  }
}


data "local_file" "kubeconfig" {
  depends_on = [null_resource.fetch_kubeconfig]
  filename   = "${path.module}/kube_config_cluster.yaml"
}

locals {
  kubeconfig = yamldecode(data.local_file.kubeconfig.content)
  ca_cert    = local.kubeconfig.clusters[0].cluster["certificate-authority-data"]
}

output "kube_config_file" {
  value     = data.local_file.kubeconfig.content
  sensitive = true
}

output "ca_certificate" {
  value     = local.ca_cert
  sensitive = true
}
