cd ~/velero-v1.18.4-linux-amd64

./velero version --client-only
kubectl get pods -n velero
kubectl get backupstoragelocations -n velero
kubectl get volumesnapshotlocations -n velero

Manual Backup
mkdir -p ~/backups/matnn

kubectl exec pod/matnn-dcf6b6999-5755h -- \
  tar -C /mnt -czf - . \
  > ~/backups/matnn/matnn-nfs-$(date +%F-%H%M%S).tar.gz


Option B — Use Velero to back up NFS data to local disk
Velero's filesystem backup feature supports NFS volumes, but it requires an object-storage destination. You could run MinIO inside your Kubesolo cluster and configure its data directory on local disk. Velero would then store both Kubernetes resource metadata and volume backup data there. 
File System Backup+1


The general architecture would be:
Kubernetes pod

NFS volume mounted at /mnt

Velero + node agent

Filesystem backup using Kopia

MinIO object storage

S3-compatible storage running locally

Local disk in WSL

Persistent backup files


# Confirm the cluster and node
kubectl get nodes -o wide

# Confirm the current NFS-backed workload
kubectl get pods -n default -o wide
kubectl get pvc longhorn-rwx-pvc -n default

# Confirm available storage and volume mounts
kubectl get pv
kubectl get storageclass

# Check Velero's installation prerequisites
kubectl get crd | grep -E 'velero.io|volumesnapshot'
kubectl get pods -A | grep -i velero

# Inspect the Kubesolo kubelet configuration and pod paths
sudo systemctl cat kubesolo
sudo find /var/lib/kubesolo -maxdepth 5 -type d \
  -path '*/pods' 2>/dev/null | head -30

# Check the local disk
df -h /




# Identify the actual mounted filesystem
kubectl exec -n default matnn-dcf6b6999-5755h -- \
  sh -c 'grep " /mnt " /proc/mounts; df -h /mnt'

# Get the pod UID
kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{.metadata.uid}{"\n"}'

# Check the Velero-related APIs
kubectl api-resources | grep -i velero

# Check whether the standard kubelet pod path exists
ls -ld /var/lib/kubelet/pods 2>/dev/null || echo "Standard kubelet path absent"

# Inspect Kubesolo service configuration
sudo systemctl cat kubesolo




./velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.14.4 \
  --bucket velero-backups \
  --secret-file ./credentials-velero \
  --backup-location-config region=us-east-1,s3ForcePathStyle=true,s3Url=http://minio.velero.svc:9000 \
  --use-node-agent \
  --use-volume-snapshots=false


# Identify the actual mounted filesystem
kubectl exec -n default matnn-dcf6b6999-5755h -- \
  sh -c 'grep " /mnt " /proc/mounts; df -h /mnt'

# Get the pod UID
kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{.metadata.uid}{"\n"}'

# Check the Velero-related APIs
kubectl api-resources | grep -i velero

# Check whether the standard kubelet pod path exists
ls -ld /var/lib/kubelet/pods 2>/dev/null || echo "Standard kubelet path absent"

# Inspect Kubesolo service configuration
sudo systemctl cat kubesolo







Step 1 — Verify Kubesolo's live volume path
The critical Velero requirement is that the node agent can see the NFS mount through the host's pod-volume directory. Velero's documentation notes that filesystem backups require mounted volumes under a pod-UID directory and that the node agent needs access to that path. 
File System Backup+1


Run this first:

POD_UID=667ea62d-e627-46d5-9251-c1a787f20c7d

sudo find /var/lib/kubelet/pods/"$POD_UID" \
  -maxdepth 5 -type d 2>/dev/null | head -80

sudo find /var/lib/kubesolo -type d \
  -path "*/pods/$POD_UID" 2>/dev/null | head -30





mkdir -p ~/velero-backup-setup
cd ~/velero-backup-setup

# Confirm the directory and free space
pwd
df -h .




POD_UID=667ea62d-e627-46d5-9251-c1a787f20c7d

sudo find "/var/lib/kubesolo/kubelet/pods/$POD_UID" \
  -maxdepth 7 -type d -print 2>/dev/null

sudo find "/var/lib/kubesolo/kubelet/pods/$POD_UID" \
  -maxdepth 7 -type l -ls 2>/dev/null




Step 2 — Deploy MinIO on local persistent storage
First, check where the local-path provisioner stores its data:
kubectl get configmap -n kube-system local-path-config -o yaml
kubectl get pods -A | grep local-path


This confirms the storage directory used by your provisioner. The MinIO PVC will use local-path, not longhorn-rwx, so the backup destination remains separate from the NFS volume.

The local-path provisioner is particularly important here because MinIO must use a local filesystem, not the NFS share it is protecting. MinIO documents that NFS-backed storage does not provide its expected consistency guarantees. 
MinIO Object Storage for Container



# Find the provisioner's ConfigMap
kubectl get configmap -n local-path-storage

# Inspect its deployment and arguments
kubectl get deployment local-path-provisioner \
  -n local-path-storage -o yaml

# Inspect the provisioner's configuration
kubectl get configmap -n local-path-storage -o yaml

# Check the provisioner's logs
kubectl logs -n local-path-storage \
  deployment/local-path-provisioner --tail=100

Next: locate the correct local-path configuration
Your provisioner is running, but we still need its ConfigMap name and configured host directory. The standard Rancher deployment uses local-path-config in local-path-storage, but Kubesolo may package it differently. 
GitHub+1


Run this single block to locate the configuration and storage path:


Your local-path provisioner is configured to store PVC data under:

/var/lib/kubesolo/local-path-storage


kubectl create namespace velero

# Generate credentials locally; don't commit these to Git
MINIO_USER=velero-admin
MINIO_PASSWORD="$(openssl rand -hex 24)"

kubectl create secret generic minio-credentials \
  -n velero \
  --from-literal=root-user="$MINIO_USER" \
  --from-literal=root-password="$MINIO_PASSWORD"

# Keep a local copy of the credentials for the later Velero setup
umask 077
cat > ~/velero-backup-setup/minio-credentials.env <<EOF
MINIO_USER=$MINIO_USER
MINIO_PASSWORD=$MINIO_PASSWORD
EOF

unset MINIO_PASSWORD


3.2 Create MinIO's persistent volume and deployment
Save the following as ~/velero-backup-setup/minio.yaml:

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-data
  namespace: velero
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: velero
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
        - name: minio
          image: quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z
          args:
            - server
            - /data
            - --console-address
            - ":9001"
          env:
            - name: MINIO_ROOT_USER
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-user
            - name: MINIO_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-password
          ports:
            - name: api
              containerPort: 9000
            - name: console
              containerPort: 9001
          volumeMounts:
            - name: data
              mountPath: /data
          readinessProbe:
            httpGet:
              path: /minio/health/ready
              port: 9000
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: minio-data
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: velero
spec:
  selector:
    app: minio
  ports:
    - name: api
      port: 9000
      targetPort: api
    - name: console
      port: 9001
      targetPort: console


kubectl apply -f ~/velero-backup-setup/minio.yaml

kubectl get pvc,pods,svc -n velero -w

kubectl rollout status deployment/minio -n velero --timeout=180s

Step 4 — Create the backup bucket
Once MinIO is running, we'll create the velero-backups bucket and configure the Velero S3 credentials. We'll then install Velero with the AWS plugin and configure its node agent using Kubesolo's actual kubelet root directory.

kubectl get pvc -n velero
kubectl get pods -n velero -w

Wait for the minio-data PVC to become Bound and the MinIO pod to become Running and ready. Press Ctrl+C to stop watching.

kubectl get pvc,pods,svc -n velero
kubectl describe pvc minio-data -n velero
kubectl logs deployment/minio -n velero --tail=50

MinIO's free community images are no longer published through the public Docker Hub and Quay repositories. A maintained alternative is Chainguard's MinIO image, cgr.dev/chainguard/minio:latest, which supports the same server command and S3-compatible API.

kubectl set image deployment/minio \
  minio=cgr.dev/chainguard/minio:latest \
  -n velero

kubectl rollout status deployment/minio -n velero --timeout=180s

Your local-path provisioner is configured to store PVC data under:

/var/lib/kubesolo/local-path-storage

Step 3 — Deploy MinIO
We'll start with MinIO alone and verify that it gets a persistent local-path volume. This avoids installing Velero before its storage destination is ready.
3.1 Create the namespace and credentials
Run from your Ubuntu terminal:

kubectl create namespace velero

# Generate credentials locally; don't commit these to Git
MINIO_USER=velero-admin
MINIO_PASSWORD="$(openssl rand -hex 24)"

kubectl create secret generic minio-credentials \
  -n velero \
  --from-literal=root-user="$MINIO_USER" \
  --from-literal=root-password="$MINIO_PASSWORD"

# Keep a local copy of the credentials for the later Velero setup
umask 077
cat > ~/velero-backup-setup/minio-credentials.env <<EOF
MINIO_USER=$MINIO_USER
MINIO_PASSWORD=$MINIO_PASSWORD
EOF

unset MINIO_PASSWORD


3.2 Create MinIO's persistent volume and deployment
Save the following as ~/velero-backup-setup/minio.yaml:

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-data
  namespace: velero
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: velero
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
        - name: minio
          image: quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z
          args:
            - server
            - /data
            - --console-address
            - ":9001"
          env:
            - name: MINIO_ROOT_USER
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-user
            - name: MINIO_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-password
          ports:
            - name: api
              containerPort: 9000
            - name: console
              containerPort: 9001
          volumeMounts:
            - name: data
              mountPath: /data
          readinessProbe:
            httpGet:
              path: /minio/health/ready
              port: 9000
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: minio-data
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: velero
spec:
  selector:
    app: minio
  ports:
    - name: api
      port: 9000
      targetPort: api
    - name: console
      port: 9001
      targetPort: console


kubectl apply -f ~/velero-backup-setup/minio.yaml

kubectl get pvc,pods,svc -n velero -w

Step 4 — Create the backup bucket
Once MinIO is running, we'll create the velero-backups bucket and configure the Velero S3 credentials. We'll then install Velero with the AWS plugin and configure its node agent using Kubesolo's actual kubelet root directory.



1. Create the backup bucket
Create a temporary Kubernetes Job that uses the MinIO credentials already stored in your Secret:

The simplest way is to run the MinIO client in a temporary pod.

Save this manifest:
cat > ~/velero-backup-setup/create-bucket.yaml <<'EOF'
apiVersion: batch/v1
kind: Job
metadata:
  name: create-velero-bucket
  namespace: velero
spec:
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: mc
          image: cgr.dev/chainguard/minio-client:latest
          args:
            - mb
            - --ignore-existing
            - local/velero-backups
          env:
            - name: MINIO_ROOT_USER
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-user
            - name: MINIO_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: minio-credentials
                  key: root-password
            - name: MC_HOST_local
              value: http://$(MINIO_ROOT_USER):$(MINIO_ROOT_PASSWORD)@minio.velero.svc:9000
EOF

kubectl apply -f ~/velero-backup-setup/create-bucket.yaml
kubectl wait --for=condition=complete job/create-velero-bucket \
  -n velero --timeout=180s
kubectl logs job/create-velero-bucket -n velero


kubectl apply -f ~/velero-backup-setup/create-bucket.yaml
kubectl wait --for=condition=complete job/create-velero-bucket \
  -n velero --timeout=180s
kubectl logs job/create-velero-bucket -n velero


2. Prepare Velero's S3 credentials
Once the bucket job succeeds, run:

set -a
source ~/velero-backup-setup/minio-credentials.env
set +a

umask 077
printf '[default]\naws_access_key_id = %s\naws_secret_access_key = %s\n' \
  "$MINIO_USER" "$MINIO_PASSWORD" \
  > ~/velero-backup-setup/credentials-velero

unset MINIO_USER MINIO_PASSWORD


kubectl delete job create-velero-bucket -n velero


if issues;

sed -i \
  's|image: minio/mc:latest|image: cgr.dev/chainguard/minio-client:latest|' \
  ~/velero-backup-setup/create-bucket.yaml

kubectl apply -f ~/velero-backup-setup/create-bucket.yaml

kubectl wait --for=condition=complete job/create-velero-bucket \
  -n velero --timeout=180s

kubectl logs job/create-velero-bucket -n velero



kubectl get pods -n velero
kubectl get backupstoragelocation -n velero
kubectl describe backupstoragelocation default -n velero


1. Check Velero health
Run:
kubectl get pods -n velero -o wide
kubectl get backupstoragelocation -n velero
kubectl describe backupstoragelocation default -n velero


Check the logs:
kubectl logs deployment/velero -n velero --tail=100

2. Verify the node-agent mount paths
This is particularly important for your NFS-backed Matnn volume:
kubectl get daemonset node-agent -n velero
kubectl get daemonset node-agent -n velero -o yaml \
  | grep -A8 -B4 -E 'kubelet|mountPath|hostPath|mountPropagation'


The node-agent needs access to the live pod-volume directory under:
/var/lib/kubesolo/kubelet/pods

3. Identify Matnn's volume name
Once the above checks look healthy, run:
kubectl get deployment -n default
kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{range .spec.volumes[*]}{.name}{"\n"}{end}'

Then inspect the current Matnn pod's volume mounts:
kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{range .spec.containers[*]}{"Container: "}{.name}{"\n"}{range .volumeMounts[*]}{"  Volume: "}{.name}{"  Mount: "}{.mountPath}{"\n"}{end}{end}'


And list the pod's volume definitions:
kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{range .spec.volumes[*]}{"Volume: "}{.name}{"  PVC: "}{.persistentVolumeClaim.claimName}{"\n"}{end}'


POD_UID=$(kubectl get pod matnn-dcf6b6999-5755h -n default \
  -o jsonpath='{.metadata.uid}')

sudo findmnt -t nfs,nfs4
sudo ls -ld "/var/lib/kubesolo/kubelet/pods/$POD_UID/volumes"


kubectl patch deployment matnn -n default --type=merge \
  -p '{"spec":{"template":{"metadata":{"annotations":{"backup.velero.io/backup-volumes":"nfs"}}}}}'


kubectl get pods -n default -l app=matnn \
  -o jsonpath='{range .items[*]}{.metadata.name}{"  "}{.metadata.annotations.backup\.velero\.io/backup-volumes}{"\n"}{end}'


2. Create a test backup
Once the new pod is Running and Ready, create a backup of the default namespace:
~/velero-v1.18.4-linux-amd64/velero backup create matnn-test \
  --include-namespaces default \
  --wait


Then inspect the result:
~/velero-v1.18.4-linux-amd64/velero backup describe matnn-test --details
~/velero-v1.18.4-linux-amd64/velero backup logs matnn-test
kubectl get podvolumebackups -n velero


1. Create the test backup
Run:
~/velero-v1.18.4-linux-amd64/velero backup create matnn-test \
  --include-namespaces default \
  --wait


If that command reports an error, paste the output.
2. Inspect the backup and volume status
After the command finishes, run:
~/velero-v1.18.4-linux-amd64/velero backup get
~/velero-v1.18.4-linux-amd64/velero backup describe matnn-test --details
kubectl get podvolumebackups -n velero


If the backup is PartiallyFailed or Failed, collect the logs:
~/velero-v1.18.4-linux-amd64/velero backup logs matnn-test
kubectl logs daemonset/node-agent -n velero --tail=100
kubectl logs deployment/velero -n velero --tail=100



1. Check the backup contents
Run:
~/velero-v1.18.4-linux-amd64/velero backup describe matnn-test --details


This should show the included Kubernetes resources and the volume backup details.
2. Make backups automatic
I recommend a daily backup at 02:00, retaining backups for 30 days. You can create a schedule with:
~/velero-v1.18.4-linux-amd64/velero schedule create matnn-daily \
  --schedule="0 2 * * *" \
  --include-namespaces default \
  --ttl 720h

~/velero-v1.18.4-linux-amd64/velero schedule get

1. Start the port-forward
In a separate terminal, run:
kubectl port-forward -n velero svc/minio 9000:9000


Leave it running. In your original terminal, test:
curl -I --max-time 5 http://localhost:9000/minio/health/live


A 200 OK response is ideal. Even if curl -I returns an unusual status, share the result.
2. If MinIO is reachable, update the storage location
kubectl patch backupstoragelocation.velero.io default \
  -n velero --type merge \
  -p '{"spec":{"config":{"publicUrl":"http://localhost:9000"}}}'


Check the result:
kubectl get backupstoragelocation.velero.io default -n velero -o yaml


You should see publicUrl: http://localhost:9000 under spec.config.
3. Retry the backup description
Keep the port-forward running and execute:
timeout 20s ~/velero-v1.18.4-linux-amd64/velero backup describe matnn-test
echo "exit code: $?"



2. Next, test a restore
Before scheduling daily backups, I recommend testing that the backup can actually restore. Since this backup includes the entire default namespace, avoid restoring over your live Matnn application initially.

A safer first test is to restore into a separate namespace:
~/velero-v1.18.4-linux-amd64/velero restore create matnn-restore-test \
  --from-backup matnn-test \
  --namespace-mappings default:matnn-restore-test \
  --wait


Check the result:
~/velero-v1.18.4-linux-amd64/velero restore describe matnn-restore-test --details

kubectl get restores.velero.io -n velero

kubectl get pods,pvc -n matnn-restore-test


