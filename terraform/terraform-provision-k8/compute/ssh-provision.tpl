#!/bin/bash
ssh -o StrictHostKeyChecking=no -i "${identityfile}" ${user}@${hostname} << 'EOF'
echo "Provisioning VM..."
# Add VM commands here
EOF
