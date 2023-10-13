#!/usr/bin/python3

from kubernetes import client, config, watch
from kubernetes.client import ApiClient
import urllib3, sys, requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Configs can be set in Configuration class directly or using helper utility
config.load_kube_config()
#config.load_incluster_config()

def __format_data_for_nodes(client_output):
        temp_dict={}
        temp_list=[]

        json_data=ApiClient().sanitize_for_serialization(client_output)
        #print("JSON_DATA OF KUBERNETES OBJECT:{}".format(json_data))
        if len(json_data["items"]) != 0:
            for node in json_data["items"]:
                temp_dict={
                    "node": node["metadata"]["name"],
                    "labels": node["metadata"]["labels"],
                }
                temp_list.append(temp_dict)
        return temp_list

def __get_kubernetes_client(bearer_token,api_server_endpoint):
    try:
        configuration = client.Configuration()
        configuration.host = api_server_endpoint
        configuration.verify_ssl = False
        configuration.api_key = {"authorization": "Bearer " + bearer_token}
        client.Configuration.set_default(configuration)
        client_api = client.CoreV1Api()
        return client_api
    except Exception as e:
        print("Error getting kubernetes client \n{}".format(e))
        return None

def get_nodes(cluster_details, namespace="default",all_namespaces=False):
        client_api= __get_kubernetes_client(
            bearer_token=cluster_details["bearer_token"],
            api_server_endpoint=cluster_details["api_server_endpoint"],
        )

        try:
            node_list = client_api.list_node(_request_timeout=3)
            data=__format_data_for_nodes(node_list)
            print (data)
        except urllib3.exceptions.MaxRetryError:
            print ("Get of Kubernetes Nodes list timed out")
            sys.exit(1)

try:
    namespace = sys.argv[1]
except:
    print ("Require the first argument to be namespace")
    sys.exit(1)

v1 = client.CoreV1Api()

#print("Listing pods with their IPs:")

#ret = v1.list_pod_for_all_namespaces(watch=False, _request_timeout=3)
#for i in ret.items:
#    if (i.metadata.namespace == namespace):
#           print("%s\t%s\t%s" % (i.status.pod_ip, i.metadata.namespace, i.metadata.name))
#            print("%s\t%s" % (i.status.pod_ip, i.metadata.name))

#response = v1.list_node()
#print (response)

#try:
#    node_list = v1.list_node(_request_timeout=3)
#    data=__format_data_for_nodes(node_list)
#    print (data)
#except urllib3.exceptions.MaxRetryError:
#    print ("Get of Kubernetes Nodes list timed out")
#    sys.exit(1)


if __name__ == "__main__":
    cluster_details={
                "bearer_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IlhLTXJSLXg5cVZKSDJZNmxxSDdOX1FLMFJhSFkzblk5ZGN6d1RyNzdxX0UifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6InNvZnR3YXJlLXNlY3JldCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50Lm5hbWUiOiJzb2Z0d2FyZSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6ImFlYzRiMGYyLWVlMWItNDE2NC04MGExLTgxMDJiZjMzMWIzMyIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OnNvZnR3YXJlIn0.mU4x53gj8z02yUhcxr7UVHRxkcUFlaH2xbnGNPHKrPxOdX0lyogR1psVgUkuhiGRTe6CO4xuL_cjB3RTGruVlClH6IjoElhVZQACv2vHGzYP3E3P4sJDBNt9MqzGzWOJBa92PPVgnCmfvNgF4DjuZ4XQpQsyZrN7JNbhHZ6JeEl-Olp5UHNjtSwbq_RJXgSjYSgZyzB8QdhdPA5kyLoRco9ZeZrACK9CfOPgGz2NJ72PD1H5-41IOXLoU3X93wZdutowbiYSH5xeXB65updVW9llsmBPRH3O0iamAGd62XIZ5WWUY6GFmb-NDhsYcjslcniwpJ8FDu8ZRLM1kzUKWQ",
                "api_server_endpoint":"https://10.0.0.7:6443"
}


get_nodes(cluster_details)
sys.exit(0)
