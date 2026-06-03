#!/usr/bin/env python3

import argparse
import hashlib
import datetime
from kubernetes import client, config


# -------------------------------------------------
# Utility
# -------------------------------------------------
def compute_md5(file_name):
    hash_md5 = hashlib.md5()
    with open(file_name, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


# -------------------------------------------------
# Argument parser
# -------------------------------------------------
def get_parser():
    md5 = compute_md5("./sample-musicnn-job.py")
    output_file = f"/mnt/{md5}.tags"

    parser = argparse.ArgumentParser(
        description="Submit unique MusicNN JobSet to Kueue",
    )

    parser.add_argument("--namespace", default="default")
    parser.add_argument("--image", default="intamixx/musicnn_v3:latest")

    parser.add_argument(
        "--args",
        nargs="+",
        default=[
            "python3",
            "-m",
            "musicnn.tagger",
            "/musicnn/audio/TRWJAZW128F42760DD_test.mp3",
            "--model",
            "MSD_musicnn",
            "--topN",
            "3",
            "--length",
            "3",
            "--overlap",
            "1",
            "--print",
            "--save",
            output_file,
        ],
    )

    return parser


# -------------------------------------------------
# JobSet generator
# -------------------------------------------------
def generate_jobset(namespace, image, args):

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")

    return {
        "apiVersion": "jobset.x-k8s.io/v1alpha2",
        "kind": "JobSet",
        "metadata": {
            # Kubernetes appends random suffix automatically
            "generateName": f"musicnn-jobset-{timestamp}-",
            "namespace": namespace,
            "labels": {
                "kueue.x-k8s.io/queue-name": "user-queue"
            },
            "finalizers": [
                "jobset.finalizers.mycompany.com/webhook"
            ],
        },
        "spec": {
            "replicatedJobs": [

                # ---------------- MAIN WORKER ----------------
                {
                    "name": "main",
                    "replicas": 1,
                    "template": {
                        "metadata": {
                            "labels": {
                                "kueue.x-k8s.io/queue-name": "user-queue"
                            }
                        },
                        "spec": {
                            "parallelism": 1,
                            "completions": 1,
                            "suspend": False,
                            "template": {
                                "metadata": {
                                    "annotations": {
                                        "linkerd.io/inject": "disabled"
                                    }
                                },
                                "spec": {
                                    "containers": [
                                        {
                                            "name": "musicnn-job",
                                            "image": image,
                                            "args": args,
                                            "securityContext": {
                                                "runAsUser": 1000
                                            },
                                            "resources": {
                                                "requests": {
                                                    "cpu": "1",
                                                    "memory": "200Mi",
                                                }
                                            },
                                            "volumeMounts": [
                                                {
                                                    "name": "nfs",
                                                    "mountPath": "/mnt",
                                                }
                                            ],
                                        }
                                    ],
                                    "volumes": [
                                        {
                                            "name": "nfs",
                                            "persistentVolumeClaim": {
                                                "claimName": "pvc-rwx"
                                            },
                                        }
                                    ],
                                    "restartPolicy": "Never",
                                },
                            },
                            "backoffLimit": 1,
                        },
                    },
                },

                # ---------------- MONITOR ----------------
                {
                    "name": "monitor",
                    "replicas": 1,
                    "template": {
                        "spec": {
                            "parallelism": 1,
                            "completions": 1,
                            "suspend": False,
                            "template": {
                                "metadata": {
                                    "annotations": {
                                        "linkerd.io/inject": "disabled"
                                    }
                                },
                                "spec": {
                                    "serviceAccountName": "monitor-sa",
                                    "containers": [
                                        {
                                            "name": "monitor",
                                            "image": "intamixx/musicnn_monitor_pod_v3:latest",
                                            "env": [
                                                # Namespace
                                                {
                                                    "name": "NAMESPACE",
                                                    "value": namespace
                                                },

                                                # 🔥 Inject real JobSet name dynamically
                                                {
                                                    "name": "JOBSET_NAME",
                                                    "valueFrom": {
                                                        "fieldRef": {
                                                            "fieldPath":
                                                            "metadata.labels['jobset.sigs.k8s.io/jobset-name']"
                                                        }
                                                    }
                                                },

                                                {
                                                    "name": "WEBHOOK_URL",
                                                    "value": "https://yoursite.domain:1234",
                                                },
                                                {
                                                    "name": "WEBHOOK_SECRET",
                                                    "valueFrom": {
                                                        "secretKeyRef": {
                                                            "name": "webhook-secret",
                                                            "key": "secret",
                                                        }
                                                    },
                                                },
                                                {"name": "POLL_INTERVAL", "value": "5"},
                                                {"name": "WEBHOOK_MAX_RETRIES", "value": "5"},
                                                {"name": "WEBHOOK_BACKOFF", "value": "5"},
                                                {"name": "JOB_TIMEOUT", "value": "600"},
                                            ],
                                            "volumeMounts": [
                                                {
                                                    "name": "nfs",
                                                    "mountPath": "/mnt",
                                                }
                                            ],
                                        }
                                    ],
                                    "volumes": [
                                        {
                                            "name": "nfs",
                                            "persistentVolumeClaim": {
                                                "claimName": "pvc-rwx"
                                            },
                                        }
                                    ],
                                    "restartPolicy": "Never",
                                },
                            },
                            "backoffLimit": 0,
                        },
                    },
                },
            ]
        },
    }


# -------------------------------------------------
# Main
# -------------------------------------------------
def main():
    parser = get_parser()
    args = parser.parse_args()

    config.load_kube_config()
    crd_api = client.CustomObjectsApi()

    jobset_body = generate_jobset(
        args.namespace,
        args.image,
        args.args,
    )

    print("🚀 Creating unique JobSet...")

    response = crd_api.create_namespaced_custom_object(
        group="jobset.x-k8s.io",
        version="v1alpha2",
        namespace=args.namespace,
        plural="jobsets",
        body=jobset_body,
    )

    created_name = response["metadata"]["name"]

    print(f"✅ JobSet created: {created_name}")
    print("Use:")
    print(f"  kubectl get jobsets {created_name}")
    print("  kubectl get jobs")
    print("  kubectl get pods")

if __name__ == "__main__":
    main()
