#!/usr/bin/python3

from kubernetes import client, config, watch
from kubernetes.client import ApiClient
import sys

# Configs can be set in Configuration class directly or using helper utility
config.load_kube_config()
#config.load_incluster_config()

# fetching the node api
api = client.resources.get(api_version="v1", kind="Node")
# api = client.resources.get(api_version="v1", kind="Node")
# Listing cluster nodes

print("%s\t\t%s\t\t%s" % ("NAME", "STATUS", "VERSION"))
for item in api.get().items:
    try:
        node = api.get(name=item.metadata.name, _request_time=30)
    except:
        print ("Get of Nodes list failed")
        sys.exit(1)
    print(
        "%s\t%s\t\t%s\n"
        % (
            node.metadata.name,
            node.status.conditions[3]["type"],
            node.status.nodeInfo.kubeProxyVersion,
     
