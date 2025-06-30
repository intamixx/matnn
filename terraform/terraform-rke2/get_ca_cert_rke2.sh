#!/bin/bash

terraform output -raw ca_certificate > /tmp/cacert.crt
CA_CERT=`cat /tmp/cacert.crt`
echo "kube_ca_certificate = \"${CA_CERT}\""
