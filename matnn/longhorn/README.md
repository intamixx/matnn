kubectl describe backup pvc-matnnfull-backup-20260622 -n longhorn-system

kubectl get backuptarget default -n longhorn-system -o yaml

kubectl get volumeattachment.longhorn.io "$VOL" -n "$NS" -o json |   jq '{tickets: .spec.attachmentTickets, statuses: .status.attachmentTicketStatuses}'

kubectl get volumes.longhorn.io "$VOL" -n "$NS"   -o jsonpath='state={.status.state}{"\n"}robustness={.status.robustness}{"\n"}disableFrontend={.spec.disableFrontend}{"\n"}shareState={.status.shareState}{"\n"}shareEndpoint={.status.shareEndpoint}{"\n"}'
