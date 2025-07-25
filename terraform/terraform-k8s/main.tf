provider "null" {}

locals {
  controlplane_nodes = {
    for k, v in var.nodes : k => v if contains(v.role, "control-plane")
  }
  worker_nodes = {
    for k, v in var.nodes : k => v if contains(v.role, "worker")
  }
  server_node_key = length(keys(local.controlplane_nodes)) > 0 ? keys(local.controlplane_nodes)[0] : ""
  server_node = local.controlplane_nodes[local.server_node_key]

  pod_cidr = "10.10.0.0/16"

  kubeadm_join_cmd = trimspace(data.external.join_command.result["stdout"])
}

# Provision the bootstrap control-plane node
resource "null_resource" "bootstrap_control_plane" {
  connection {
    type        = "ssh"
    user        = local.server_node.user
    private_key = file(local.server_node.ssh_key)
    host        = local.server_node.address
  }

  provisioner "file" {
    source      = "cloudinit_master.sh"
    destination = "/tmp/cloudinit_master.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/cloudinit_master.sh",
      "/tmp/cloudinit_master.sh ${local.pod_cidr}"
    ]
  }
}

# Get join command from server after install
data "external" "join_command" {
  program = [
    "bash", "-c",
    "ssh -o StrictHostKeyChecking=no -i ${replace(local.server_node.ssh_key, "~", abspath("~"))} ${local.server_node.user}@${local.server_node.address} 'cat /root/join.sh'"
  ]

  depends_on = [null_resource.bootstrap_control_plane]
}

resource "null_resource" "pull_join_command" {
  depends_on = [null_resource.bootstrap_control_plane]

  provisioner "remote-exec" {
    inline = [
      "cat /root/join.sh"
    ]

    connection {
      type        = "ssh"
      user        = local.server_node.user
      private_key = file(local.server_node.ssh_key)
      host        = local.server_node.address
    }

    # Exports output to stdout, which is captured below
  }

  provisioner "local-exec" {
    command = <<EOT
ssh -o StrictHostKeyChecking=no -i ${local.server_node.ssh_key} ${local.server_node.user}@${local.server_node.address} 'cat /root/join.sh' > ./join-command.sh
chmod +x ./join-command.sh
echo "Join command saved to ./join-command.sh"
EOT
  }
}

resource "null_resource" "worker_nodes" {
  for_each = local.worker_nodes

  connection {
    type        = "ssh"
    user        = each.value.user
    private_key = file(each.value.ssh_key)
    host        = each.value.address
  }

  provisioner "file" {
    source      = "cloudinit_worker.sh"
    destination = "/tmp/cloudinit_worker.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/cloudinit_worker.sh",
      "/tmp/cloudinit_worker.sh '${local.kubeadm_join_cmd}'"
    ]
  }

  depends_on = [null_resource.bootstrap_control_plane]
}


  depends_on = [null_resource.bootstrap_control_plane]
}

resource "null_resource" "label_nodes" {
  depends_on = [null_resource.worker_nodes]

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
            "sudo kubectl label node ${node_name} node-role.kubernetes.io/${role}='true' --overwrite"
        ]
      ])
    )
  }
}

resource "null_resource" "fetch_kubeconfig" {
  depends_on = [null_resource.pull_join_command]

  provisioner "remote-exec" {
    connection {
      host        = local.server_node.address
      user        = local.server_node.user
      private_key = file(local.server_node.ssh_key)
    }

    inline = [
      "cat /etc/kubernetes/admin.conf"
    ]
  }

  provisioner "local-exec" {
    command = <<EOT
      ssh -o StrictHostKeyChecking=no -i ${local.server_node.ssh_key} ${local.server_node.user}@${local.server_node.address} \
      "sudo cat /etc/kubernetes/admin.conf" | sed 's|127.0.0.1|${local.server_node.address}|' > ./kube_config_cluster.yaml
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

output "kubeadm_join_command" {
  value = trimspace(data.external.join_command.result["command"])
  description = "Kubeadm join command from the control-plane node"
}
