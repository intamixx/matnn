#!/usr/bin/env python3
"""
JobSet Monitor
Monitors worker jobs in a JobSet and sends signed webhooks on completion/failure/timeout.
Removes finalizer after webhook delivery using JSON Patch.
"""

import os
import time
import json
import hmac
import hashlib
import requests
from kubernetes import client, config
from kubernetes.client.rest import ApiException

# -------------------------------
# Configuration from environment
# -------------------------------
NAMESPACE = os.environ.get("NAMESPACE", "default")
JOBSET_NAME = os.environ.get("JOBSET_NAME", "musicnn-jobset")
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")

if not WEBHOOK_URL:
    raise ValueError("WEBHOOK_URL environment variable is required")
if not WEBHOOK_SECRET:
    raise ValueError("WEBHOOK_SECRET environment variable is required")

POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", 5))  # seconds
WEBHOOK_MAX_RETRIES = int(os.environ.get("WEBHOOK_MAX_RETRIES", 5))
WEBHOOK_BACKOFF = int(os.environ.get("WEBHOOK_BACKOFF", 5))  # seconds
JOB_TIMEOUT = int(os.environ.get("JOB_TIMEOUT", 3600))  # seconds per job

# -------------------------------
# Kubernetes client
# -------------------------------
try:
    config.load_incluster_config()
    print("Loaded in-cluster config")
except Exception:
    config.load_kube_config()
    print("Loaded kubeconfig")

batch_api = client.BatchV1Api()
custom_api = client.CustomObjectsApi()

# -------------------------------
# Worker job utils
# -------------------------------
def get_worker_jobs():
    """
    Fetch all worker jobs for the JobSet (excluding monitor itself) and print debug info.
    """
    try:
        jobs = batch_api.list_namespaced_job(
            namespace=NAMESPACE,
            label_selector=f"jobset.sigs.k8s.io/jobset-name={JOBSET_NAME}"
        ).items

        if not jobs:
            print("No jobs found yet for JobSet:", JOBSET_NAME)
            return []

        print("Jobs detected:")
        for j in jobs:
            job_name = j.metadata.name
            labels = j.metadata.labels
            print(f"  - {job_name}")
            for k, v in labels.items():
                print(f"      {k}: {v}")

        # Exclude monitor job
        filtered_jobs = [
            j for j in jobs
            if j.metadata.labels.get("jobset.sigs.k8s.io/replicatedjob-name") != "monitor"
        ]
        print(f"Worker jobs count (excluding monitor): {len(filtered_jobs)}")
        return filtered_jobs

    except ApiException as e:
        print("Kubernetes API error fetching jobs:", e)
        return []
    except Exception as e:
        print("Unexpected error fetching jobs:", e)
        return []

# -------------------------------
# Webhook utils
# -------------------------------
def sign_payload(payload: dict) -> str:
    data = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    secret_bytes = WEBHOOK_SECRET.encode("utf-8")
    signature = hmac.new(secret_bytes, data, hashlib.sha256).hexdigest()
    return signature

def send_webhook(job_id: str, status: str):
    payload = {"id": job_id, "event": {"status": status}}
    signature = sign_payload(payload)
    headers = {"Content-Type": "application/json", "X-Matnn-Signature": signature}

    for attempt in range(1, WEBHOOK_MAX_RETRIES + 1):
        try:
            response = requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            print(f"✅ Webhook delivered: {response.status_code}")
            return True
        except requests.RequestException as e:
            print(f"❌ Webhook attempt {attempt} failed: {e}")
            if attempt < WEBHOOK_MAX_RETRIES:
                time.sleep(WEBHOOK_BACKOFF)
    print("❌ Webhook delivery failed after max retries")
    return False

# -------------------------------
# JobSet finalizer removal
# -------------------------------
def remove_jobset_finalizer():
    try:
        patch_body = {"metadata": {"finalizers": None}}
        custom_api.patch_namespaced_custom_object(
            group="jobset.x-k8s.io",
            version="v1alpha2",
            namespace=NAMESPACE,
            plural="jobsets",
            name=JOBSET_NAME,
            body=patch_body,
        )
        print(f"✅ Finalizer removed from JobSet {JOBSET_NAME}")
    except Exception as e:
        print(f"❌ Unexpected error removing finalizer: {e}")

# -------------------------------
# Main monitoring loop
# -------------------------------
def monitor_jobset():
    start_time = time.time()
    print("Monitor starting (Python client + retry)...")

    while True:
        jobs = get_worker_jobs()
        if not jobs:
            print("Waiting for worker jobs...")
            time.sleep(POLL_INTERVAL)
            continue

        # Count statuses
        succeeded = sum(1 for j in jobs if j.status.succeeded)
        failed = sum(1 for j in jobs if j.status.failed)
        total = len(jobs)

        print(f"Progress: {succeeded}/{total} succeeded | {failed} failed")

        if WEBHOOK_URL:
            # Check for timeout
            elapsed = time.time() - start_time
            if elapsed > JOB_TIMEOUT:
                print(f"❌ JobSet monitoring timed out after {elapsed:.1f}s")
                send_webhook(JOBSET_NAME, "timeout")
                break

            if failed > 0:
                print(f"❌ {failed} jobs failed")
                send_webhook(JOBSET_NAME, "failed")
                break

            if succeeded == total:
                print("✅ All jobs complete")
                send_webhook(JOBSET_NAME, "finished")
                break

            time.sleep(POLL_INTERVAL)

    # Remove finalizer
    remove_jobset_finalizer()
    print("Monitor job exiting.")

# -------------------------------
if __name__ == "__main__":
    monitor_jobset()
