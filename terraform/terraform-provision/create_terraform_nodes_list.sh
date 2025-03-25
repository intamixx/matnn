#!/bin/bash

# Quick script to test something

COUNT=`terraform output -json server_names | jq .[] | wc -l`

#echo "There are ${COUNT} servers provisioned"

echo "nodes = {"
for ((i = 0 ; i < COUNT ; i++ ));
  do
        echo "  node$((i+1)) : {"
        #echo "$i"
        if [[ $i == 0 ]];
                then
                echo '          role : ["controlplane", "worker", "etcd"]'
        fi
        if [[ $i > 0 ]];
                then
                echo '          role : ["worker", "etcd"]'
        fi
        SERVER_IP=`terraform output -json server_ips | jq .[$i]`
        echo "          address : ${SERVER_IP}"
        PRIVATE_IP=`terraform output -json private_ips | jq .[$i][]`
        echo "          internal_address : ${PRIVATE_IP}"
        echo '          ssh_key : "~/.ssh/id_rsa"'
        echo '          user : "root"'
        echo "  },"
  done
echo "}"
