#!/bin/bash

terraform output -raw ca_certificate > /tmp/cacert.crt
CA_CERT_BASE64=`base64 -w 0 < /tmp/cacert.crt`
echo "kube_ca_certificate = \"${CA_CERT_BASE64}\""
