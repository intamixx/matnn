#!/usr/bin/env bash

# -------------------------
# CONFIGURATION
# -------------------------
HUBBLE_ENDPOINT="127.0.0.1:4245"

# Optional filters (set environment variables)
# NAMESPACE: only flows from this namespace
# POD: only flows from this pod
# VERDICT: "FORWARDED", "DROPPED", "SUCCESS"
# PROTO: "TCP" or "UDP"
# Examples:
#   NAMESPACE=default ./watch-flows.sh
#   POD=frontend VERDICT=DROPPED ./watch-flows.sh

echo "📡 Watching Hubble flows..."
echo "➡ Endpoint: $HUBBLE_ENDPOINT"
echo "➡ Filters: NAMESPACE=${NAMESPACE:-ALL}, POD=${POD:-ALL}, VERDICT=${VERDICT:-ALL}, PROTO=${PROTO:-ALL}"
echo "Press Ctrl+C to exit."
echo

# -------------------------
# Build gRPC request
# -------------------------
REQ='{}'
REQ=$(jq -n \
    --arg ns "${NAMESPACE:-}" \
    --arg pod "${POD:-}" \
    --arg verdict "${VERDICT:-}" \
    --arg proto "${PROTO:-}" \
    '{
        namespace: ($ns | select(length>0)),
        pod_name: ($pod | select(length>0)),
        verdict: ($verdict | select(length>0)),
        protocol: ($proto | select(length>0))
    }'
)

# -------------------------
# Stream flows
# -------------------------
grpcurl -plaintext -d "$REQ" "$HUBBLE_ENDPOINT" observer.Observer/GetFlows \
| jq -c '
  select(.flow != null) |
  {
    verdict: .flow.verdict,
    src_ns:  (.flow.source.namespace // ""),
    src_pod: (.flow.source.pod_name // ""),
    dst_ns:  (.flow.destination.namespace // ""),
    dst_pod: (.flow.destination.pod_name // ""),
    src_ip:  (.flow.IP.source // ""),
    dst_ip:  (.flow.IP.destination // ""),
    tcp:     (.flow.l4.TCP | if . != null then (.sourcePort|tostring) + "->" + (.destinationPort|tostring) else "" end),
    udp:     (.flow.l4.UDP | if . != null then (.sourcePort|tostring) + "->" + (.destinationPort|tostring) else "" end)
  }
' \
| while IFS= read -r event; do
    VERDICT=$(echo "$event" | jq -r .verdict)
    SRC=$(echo "$event" | jq -r '.src_ns + "/" + .src_pod')
    DST=$(echo "$event" | jq -r '.dst_ns + "/" + .dst_pod')
    PROTO=$(echo "$event" | jq -r 'if .tcp != "" then "TCP:" + .tcp elif .udp != "" then "UDP:" + .udp else "OTHER" end')
    IP=$(echo "$event" | jq -r '.src_ip + " → " + .dst_ip')

    # Apply verdict filter
    if [[ -n "$VERDICT" && -n "$VERDICT_FILTER" && "$VERDICT" != "$VERDICT_FILTER" ]]; then
        continue
    fi

    # Apply protocol filter
    if [[ -n "$PROTO" && -n "$PROTO_FILTER" && "$PROTO" != "$PROTO_FILTER" ]]; then
        continue
    fi

    # Color verdict
    case "$VERDICT" in
        DROPPED) COLOR="\033[0;31m";;    # red
        FORWARDED|SUCCESS) COLOR="\033[0;32m";;  # green
        *) COLOR="\033[0m";;
    esac

    printf "%b[%s]%b %s → %s  (%s)  %s\n" \
        "$COLOR" "$VERDICT" "\033[0m" "$SRC" "$DST" "$PROTO" "$IP"
done
