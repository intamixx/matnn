#!/bin/bash

SA_TOKEN=`terraform output -raw terraform_sa_token`
echo "kube_token = \"${SA_TOKEN}\""
