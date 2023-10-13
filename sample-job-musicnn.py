#!/usr/bin/env python3

import argparse
from kubernetes import config, client

import hashlib, sys

# A utility function that can be used in your code
def compute_md5(file_name):
    hash_md5 = hashlib.md5()
    with open(file_name, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# create_job.py
# This example will demonstrate full steps to submit a Job.

# Make sure your cluster is running!
config.load_kube_config()
crd_api = client.CustomObjectsApi()
api_client = crd_api.api_client


def get_parser():
    md5=compute_md5("./sample-job-musicnn.py")
    output_file="/mnt/{}".format(md5)
    print (output_file)
    parser = argparse.ArgumentParser(
        description="Submit Kueue Job Example",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "--job-name",
        help="generateName field to set for job",
        default="sample-job-",
    )
    parser.add_argument(
        "--image",
        help="container image to use",
        default="intamixx/musicnn",
    )
    parser.add_argument(
        "--args",
        nargs="+",
        help="args for container",
        default=["python3", "-m", "musicnn.tagger", "/musicnn/audio/TRWJAZW128F42760DD_test.mp3", "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", output_file],
    )
    return parser


def generate_job_crd(job_name, image, args):
    """
    Generate an equivalent job CRD to sample-job.yaml
    """
    metadata = client.V1ObjectMeta(
        generate_name=job_name, labels={"kueue.x-k8s.io/queue-name": "user-queue"}
    )

    # Job container
    container = client.V1Container(
        image=image,
        name="musicnn-job",
        args=args,
        resources=client.V1ResourceRequirements(requests={'cpu': 1, 'memory': '200Mi',} ),
        #security_context=client.V1SecurityContext(run_as_user=1000),
        volume_mounts=[client.V1VolumeMount(name='nfs',mount_path='/mnt')],
        )
    nfsvol = client.V1NFSVolumeSource(path="/exports", server="10.42.3.214")
    volume = client.V1Volume(name='nfs', nfs=nfsvol)

    # Job template
    template = {"spec": {"containers": [container], "volumes": [volume], "restartPolicy": "Never"}}
    return client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=metadata,
        spec=client.V1JobSpec(
            parallelism=1, completions=1, suspend=True, template=template
        ),
    )


def main():
    """
    Run a job.
    """
    parser = get_parser()
    args, _ = parser.parse_known_args()

    # Generate a CRD spec
    crd = generate_job_crd(args.job_name, args.image, args.args)
    batch_api = client.BatchV1Api()
    print(f"📦️ Container image selected is {args.image}...")
    print(f"⭐️ Creating sample job with prefix {args.job_name}...")
    batch_api.create_namespaced_job("default", crd)
    print(
        'Use:\n"kubectl get queue" to see queue assignment\n"kubectl get jobs" to see jobs'
    )


if __name__ == "__main__":
    main()
