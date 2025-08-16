#!/bin/bash

key_file="$1"
user="$2"
host="$3"

# Read join.sh content, escape for JSON properly
join_cmd=$(ssh -o StrictHostKeyChecking=no -i "$key_file" "$user@$host" "cat /root/join.sh" | python3 -c '
import json,sys
print(json.dumps(sys.stdin.read()))
')

# Output JSON map with key "command"
echo "{\"command\": $join_cmd}"
