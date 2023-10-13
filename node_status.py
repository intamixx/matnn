#!/usr/bin/python3

from kubernetes import client, config, watch
from kubernetes.client import ApiClient
import sys

# Configs can be set in Configuration class directly or using helper utility
config.load_kube_config()
#config.load_incluster_config()

kube_client = client.CoreV1Api()

node_list = kube_client.list_node(watch=False, pretty=True, limit=1000)
if len(node_list.items) > 0:
    print("NODE\t\t\t\t\t\tSTATUS")
    for node in node_list.items:
        node_name = node.metadata.name
        node_status = "Not Ready"   # Unknown, not ready, unhealthy, etc.
        node_scheduling = node.spec.unschedulable
        for condition in node.status.conditions:
            if condition.type == "Ready" and condition.status:
                node_status = "Ready"
                break
        if node_scheduling is None or not node_scheduling:
            print(f"{node_name} {node_status}")
        else:
            print(f"{node_name} {node_status},SchedulingDisabled")
else:
    print("No nodes available in the cluster")
