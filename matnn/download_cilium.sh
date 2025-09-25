#!/bin/bash

# Get the latest Cilium CLI version
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)

curl -L --fail --remote-name-all \
  https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-amd64.tar.gz{,.sha256sum}

# Verify the checksum
sha256sum --check cilium-linux-amd64.tar.gz.sha256sum

# Unpack the binary into /usr/local/bin
sudo tar -C /usr/local/bin -xzvf cilium-linux-amd64.tar.gz

# Clean up
rm cilium-linux-amd64.tar.gz{,.sha256sum}
