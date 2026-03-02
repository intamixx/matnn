import time
import json
import hmac
import hashlib
import requests
import sys
from kubernetes import client, config
from kubernetes.client.rest import ApiException

# ================= CONFIG =================
JOBSET_NAME = "musicnn-jobset"
NAMESPACE = "default"

WEBHOOK_URL = "https://yoursite.domain:1234/"
WEBHOOK_SECRET = "webhookSecret"

GLOBAL_TIMEOUT_SECONDS = 1800   # 30 minutes
POLL_INTERVAL = 5              # seconds

SUCCESS_STATUS = "finished"
FAIL_STATUS = "failed"
TIMEOUT_STATUS = "timeout"

# Webhook retry config
WEBHOOK_MAX_RETRIES = 5
WEBHOOK_INITIAL_BACKOFF = 2     # seconds
WEBHOOK_MAX_BACKOFF = 60        # seconds
# ==========================================


def sign_payload(secret: str, payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()


def send_webhook_with_retry(job_id: str, status: str):
    body = {
        "id": job_id,
        "event": {
            "status": status
        }
    }

    signature = sign_payload(WEBHOOK_SECRET, body)

    headers = {
        "Content-Type": "application/json",
        "X-Matnn-Signature": signature
    }

    backoff = WEBHOOK_INITIAL_BACKOFF

    for attempt in range(1, WEBHOOK_MAX_RETRIES + 1):
        try:
            print(f"Webhook attempt {attempt}/{WEBHOOK_MAX_RETRIES} status={status}")
            r = requests.post(
                WEBHOOK_URL,
                json=body,
                headers=headers,
                timeout=10
            )

            # Success
            if 200 <= r.status_code < 300:
                print("✅ Webhook delivered:", r.status_code)
                return True

            # Retry on server errors
            if r.status_code >= 500:
                raise Exception(f"Server error {r.status_code}")

            # Client errors -> don't retry
            print("❌ Webhook rejected:", r.status_code, r.text)
            return False

        except Exception as e:
            print(f"⚠️ Webhook error: {e}")

            if attempt == WEBHOOK_MAX_RETRIES:
                print("❌ Webhook permanently failed after retries")
                return False

            sleep_time = min(backoff, WEBHOOK_MAX_BACKOFF)
            print(f"Retrying in {sleep_time}s...")
            time.sleep(sleep_time)
            backoff *= 2  # exponential backoff


def load_kube():
    try:
        config.load_incluster_config()
        print("Loaded in-cluster config")
    except:
        config.load_kube_config()
        print("Loaded kubeconfig")

def get_worker_jobs(batch_api):
    """
    Fetch all worker jobs for the JobSet and print debug info.
    Excludes the monitor job itself.
    """
    try:
        jobs = batch_api.list_namespaced_job(
            namespace=NAMESPACE,
            label_selector=f"jobset.sigs.k8s.io/jobset-name={JOBSET_NAME}"
        ).items

        if not jobs:
            print("No jobs found yet for JobSet:", JOBSET_NAME)
            return []

        # Debug: print all jobs and their labels
        print("Jobs detected:")
        for j in jobs:
            job_name = j.metadata.name
            labels = j.metadata.labels
            print(f"  - {job_name}")
            for k, v in labels.items():
                print(f"      {k}: {v}")

        # Exclude the monitor job itself
        filtered_jobs = [
            j for j in jobs
            if j.metadata.labels.get("jobset.sigs.k8s.io/replicatedjob-name") != "monitor"
        ]

        print(f"Worker jobs count (excluding monitor): {len(filtered_jobs)}")
        return filtered_jobs

    except Exception as e:
        print("Error fetching worker jobs:", str(e))
        return []

def main():
    print("Monitor starting (Python client + retry)...")
    load_kube()

    batch_api = client.BatchV1Api()

    start_time = time.time()
    job_id = None

    while True:
        try:
            jobs = get_worker_jobs(batch_api)

            if not jobs:
                print("Waiting for worker jobs...")
                time.sleep(POLL_INTERVAL)
                continue

            total = len(jobs)
            succeeded = 0
            failed = 0

            for j in jobs:
                if not job_id:
                    job_id = j.metadata.uid

                st = j.status
                if st.succeeded:
                    succeeded += 1
                if st.failed:
                    failed += 1

            print(f"Progress: {succeeded}/{total} succeeded | {failed} failed")

            # ❌ Failure
            if failed > 0:
                print("❌ Failure detected")
                send_webhook_with_retry(job_id, FAIL_STATUS)
                sys.exit(0)

            # ✅ Success
            if succeeded == total:
                print("✅ All jobs complete")
                send_webhook_with_retry(job_id, SUCCESS_STATUS)
                sys.exit(0)

            # ⏱ Timeout
            if time.time() - start_time > GLOBAL_TIMEOUT_SECONDS:
                print("⏱ Global timeout")
                send_webhook_with_retry(job_id, TIMEOUT_STATUS)
                sys.exit(0)

            time.sleep(POLL_INTERVAL)

        except ApiException as e:
            print("Kubernetes API error:", e)
            time.sleep(POLL_INTERVAL)

        except Exception as e:
            print("Monitor runtime error:", str(e))
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
