from fastapi import FastAPI, File, Request, UploadFile, HTTPException, status, Header, Depends
from fastapi.responses import HTMLResponse
import aiofiles

from kubernetes import config, client
import hashlib, sys, os, shutil

from tinydb import TinyDB, Query
from datetime import datetime

import random
import string

app = FastAPI()

config.load_kube_config()
##crd_api = client.CustomObjectsApi()
#api_client = crd_api.api_client

@app.get("/upload/{matt_id}")
async def read_item(matt_id):
    return {"matt_id": matt_id}

async def valid_content_length(content_length: int = Header(..., lt=8000_000)):
    return content_length
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), file_size: int = Depends(valid_content_length)
):
    output_file = f"{file.filename}"
    real_file_size = 0
    try:
        async with aiofiles.open(f"{output_file}", "wb") as out_file:
            while content := await file.read(1024):  # async read chunk
                real_file_size += len(content)
                if real_file_size > file_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Too large",
                    )
                await out_file.write(content)  # async write chunk
        job_id = submit_job(file.filename)
        #return
        #sys.exit(0)
        #job_id = "iosdfjiosdjfiodfjiwejr-we334r"
        msg = f"Successfully uploaded {file.filename} as {job_id}"
    except IOError:
        raise HTTPException(status_code=500, detail=f'There was an error uploading your file')
        msg = "There was an error uploading your file"
    return {"message": msg}

# Upload the file and submit new job
#@app.post('/upload')
#async def upload(file: UploadFile):
#    try:
#        contents = await file.read()
#        async with aiofiles.open(file.filename, 'wb') as f:
#            await f.write(contents)
#    except Exception:
#        raise HTTPException(
#            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#            detail='There was an error uploading the file',
#        )
#    finally:
#        await file.close()

    # Submit Kueue Job
    #job_id = submit_job(file.filename)
#    return {'message': f'Successfully uploaded {file.filename} as {job_id}'}

# A utility function that can be used in your code
def compute_md5(file_name):
    hash_md5 = hashlib.md5()
    with open(file_name, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def status_kueue_job(listing, job_id):
    """
    Iterate and show job metadata.
    """
    if not listing:
        return {'status': f'There are no jobs'}

    #print("\n💼️ Jobs")
    for job in listing["items"]:
        jobname = job["metadata"]["name"]
        if job_id in jobname:
            status = (
                "TBA" if "succeeded" not in job["status"] else job["status"]["succeeded"]
            )
            ready = job["status"]["ready"]
            if ready == 1:
                raise HTTPException(status_code=202, detail=f'Processing Job {jobname}')
                return {'detail': f'Processing Job {jobname}'}
            try:
                if job["status"]["succeeded"] == 1:
                    #print (job["status"])
                    # Update completion into database
                    #if read_tags(job_id) == False:
                    #    return {'status': f'Reading tags for {jobname} failed'}
                    #else:
                    #    tags = (read_tags(job_id))
                    result = db_search(job_id)
                    if (result[0]['completed']) == "False":
                       db_update('', job_id, '', "True", '')
                    return {'detail': f'Successful Job {jobname}'}
            except:
                raise HTTPException(status_code=202, detail=f'Finalising Job {jobname}')
                return {'detail': f'Finalising Job {jobname}'}
    raise HTTPException(status_code=410, detail=f'Job status not available, try calling result api or please try again later')
    return {'detail': f'Job status not available, try calling result api or please try again later'}
            #print(f"Found job {jobname}")
            #print(f"  Succeeded: {status}")
            #print(f"  Ready: {ready}")

def read_tags(job_id):
    filename = check_uploaded_file_exists(job_id)
    if filename == False:
        raise HTTPException(status_code=404, detail=f'Upload for {job_id} not found')
        return {'detail': f'Upload for {job_id} not found'}
    tagfilename = filename+".tags"
    try:
        with open(tagfilename, 'r') as f_obj:
            #contents = f_obj.read()
            last_line = f_obj.readlines()[-1]
            f_obj.close()
            last_line = last_line.replace('\n', '').replace('\r', '')
            last_line = last_line.split(',') 
            last_line = (last_line[-3:])
            return (', '.join(last_line))
    except FileNotFoundError:
        return False
    #last_line = last_line.replace('\n', '').replace('\r', '')
    #last_line = last_line.split(',') 
    #last_line = (last_line[-3:])
    #return (', '.join(last_line))

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
    nfsvol = client.V1NFSVolumeSource(path="/exports", server="10.42.3.107")
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

def db_update(filename, job_id, epoch, completed, tags):
    db = TinyDB('/mnt/matnn.json')
    audio = Query()
    # update completed status and tags only
    if not filename and not epoch:
        try:
            db.upsert({'job_id': job_id, 'completed': completed, 'tags': tags}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
        return
    # update whole record
    try:
        db.upsert({'audiofile': filename, 'job_id': job_id, 'epoch': epoch, 'completed': completed}, audio.job_id == job_id)
    except:
        raise HTTPException(status_code=500, detail=f'Database insertion error')
        return {'detail': f'Database insertion error'}
    return

def db_search(job_id):
    # Check if file md5 exists in database
    db = TinyDB('/mnt/matnn.json')
    audio = Query()
    #results = db.search(audio.md5.search(job_id))
    return (db.search(audio.job_id == job_id))

# Get the result of the job
@app.get("/result/{job_id}")
async def result_job(job_id):
    # Check if in database and completed flag set to 1
    result = db_search(job_id)
    if not result:
        raise HTTPException(status_code=404, detail=f'Result {job_id} not found')
        return {'detail': f'Result {job_id} not found'}
    elif (result[0]['completed']) == "True":
        audiofile = (result[0]['audiofile'])
        # See if tags already set
        tags = result[0]['tags']
        if tags != "":
            #tag set
            return {'audiofile': f'{audiofile}', 'result': f'{tags}'}
        else:
            # Get the tags from filesystem
            tags = (read_tags(job_id))
            if tags == False:
                raise HTTPException(status_code=404, detail=f'Reading tags for {job_id} failed')
                return {'detail': f'Reading tags for {job_id} failed'}
            else:
                db_update('', job_id, '', "True", tags)
                return {'audiofile': f'{audiofile}', 'detail': f'{tags}'}
    elif (result[0]['completed']) == "False":
        audiofile = (result[0]['audiofile'])
        # Get the tags from filesystem
        tags = (read_tags(job_id))
        if tags == False:
            raise HTTPException(status_code=202, detail=f'Reading tags for {job_id} processing')
            return {'detail': f'Reading tags for {job_id} processing'}
        else:
            db_update('', job_id, '', "True", tags)
            return {'audiofile': f'{audiofile}', 'detail': f'{tags}'}
    else:
        raise HTTPException(status_code=404, detail=f'Result {job_id} not found')
        return {'detail': f'Result {job_id} not found'}

def check_uploaded_file_exists(job_id):
    try:
        if os.path.isdir('/mnt'):
            # Extract filename (md5 based) from job_id
            fn = job_id.split('-') 
            uploaded_file="{}/{}".format("/mnt",fn[0]) 
            if os.path.exists(uploaded_file):
               return uploaded_file
            else:
               return False
    except:
        return False

# Get the status of the job
@app.get("/status/{job_id}")
async def status_job(job_id):
    crd_api = client.CustomObjectsApi()
#    return {"matt_id": matt_id}
# Check status of job
    if not job_id:
        print ("ID not given")
        return
    results = db_search(job_id)
    #print ("-------------")
    if (results):
        #print (results[0]['audiofile'])
        #print ("job_id Found in database")
        # Check how old the job is
        job_epoch = int(results[0]['epoch'])
        curr_epoch = (datetime.now())
        curr_epoch = int(datetime.now().strftime('%s'))
        if job_epoch:
            #print (job_epoch)
            #print (curr_epoch)
            result = (curr_epoch - job_epoch) 
            if result > 18000000:
                raise HTTPException(status_code=410, detail=f'Job status not available, try calling result api or please try again later')
                return {'detail': f'Job status not available, try calling result api or please try again later'}
                # UPDATE STATUS OF JOB
                #return
            #else:
            #    print ("Job {} processing ....".format(job_id))
    else:
        #print ({'status': f'job_id {job_id} not found'})
        #raise HTTPException(status_code=404, detail={'status': f'job_id {job_id} not found'})
        raise HTTPException(status_code=404, detail=f'job_id {job_id} not found')
        return {'detail': f'job_id {job_id} not found'}
    #print ("-------------")

    # Check if file exists in nfs mount directory, if it does then jobs completed!!
    # This will run in a pod soon and will change here
    if (check_uploaded_file_exists(job_id)) == False:
           raise HTTPException(status_code=404, detail=f'Upload for {job_id} not found')
           return {'detail': f'Upload for {job_id} not found'}
    #if os.path.isdir('/data/nfs'):
    #    # Extract filename (md5 based) from job_id
    #    fn = job_id.split('-') 
    #    uploaded_file="{}/{}".format("/data/nfs",fn[0]) 
    #    if not os.path.exists(uploaded_file):
    #       #print ({'message': f'Filename {fn[0]} not found'})
    #       return {'message': f'Filename {fn[0]} not found'}

    # Check job is in localqueue
    #listing = crd_api.list_namespaced_custom_object(
    #    _request_timeout=1,
    #    group="kueue.x-k8s.io",
    #    version="v1beta1",
    #    #namespace=args.namespace,
    #    namespace="default",
    #    plural="localqueues",
    #)
    #list_queues(listing, job_id)
    # Check job has been admitted
    listing = crd_api.list_namespaced_custom_object(
        _request_timeout=1,
        group="batch",
        version="v1",
        #namespace=args.namespace,
        namespace="default",
        plural="jobs",
    )
    return (status_kueue_job(listing, job_id))

def id_generator(size=5, chars=string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
    # Check job has been admitted


def submit_job(filename):
    """
    Run a job.
    """
    #print (filename);

    md5=compute_md5(filename)
    # This will run in a pod soon and will change here
    nfs_file="/data/nfs/{}".format(md5)
    #nfs_file="/mnt/{}".format(md5)
    matnn_pod_nfs_file="/mnt/{}".format(md5)

    # Inside matnn container
    result_tag_output_file="/mnt/{}.tags".format(md5)
    #print (output_file)

    rand_id = id_generator()
    #print (rand_id)

    # Copy into nfs shared directory
    try:
        shutil.copy(filename, nfs_file)
        #print("File %s copied successfully into %s" % (filename, output_file))
    except:
        raise HTTPException(status_code=500, detail=f'Error copying upload file {filename}')
        return {'detail': f'Error copying upload file {filename}'}
        #sys.exit(1)

    #return
    #sys.exit(0)

    #parser = get_parser()
    #args, _ = parser.parse_known_args()

    #cmdargs=["python3", "-m", "musicnn.tagger", "/musicnn/audio/TRWJAZW128F42760DD_test.mp3", "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", output_file]
    cmdargs=["python3", "-m", "musicnn.tagger", matnn_pod_nfs_file, "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", result_tag_output_file]
    image="intamixx/musicnn"
    #job_name="musicnn-%s-%s" % (md5, rand_id)
    job_id = "{}-{}".format(md5, rand_id)
    job_name="musicnn-{}".format(job_id)
    
    # Generate a CRD spec
    try:
        crd = generate_job_crd(job_name, image, cmdargs)
        batch_api = client.BatchV1Api()
        #print(f"📦️ Container image selected is {image}...")
        #print(f"⭐️ Creating sample job with prefix {job_name}...")
        batch_api.create_namespaced_job("default", crd)
    except:
        raise HTTPException(status_code=500, detail=f'Error creating CRD for {job_id}')
        return {'detail': f'Error creating CRD for {job_id}'}
    #print(
    #    'Use:\n"kubectl get queue" to see queue assignment\n"kubectl get jobs" to see jobs'
    #)

    #print ("Inserting into Database")
    #print ("Current Date: {}".format(datetime.now()))
    epochtime = int(datetime.now().strftime('%s'))
    #print ("Epoch time: {}".format(epochtime))
    db_update(filename, job_id, epochtime, "False", "")

    return job_id
