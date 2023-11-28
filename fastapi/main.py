from fastapi import FastAPI, Form, File, Request, UploadFile, HTTPException, status, Header, Depends
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
import aiofiles

from kubernetes import config, client
import hashlib, sys, os, shutil

from tinydb import TinyDB, Query
from datetime import datetime

import random
import string
import configparser

from pydantic import BaseModel
import json
#from typing import Optional, List

app = FastAPI()

config.load_incluster_config()
#config.load_kube_config()
##crd_api = client.CustomObjectsApi()
#api_client = crd_api.api_client

@app.get("/upload/{matt_id}")
async def read_item(matt_id):
    return {"matt_id": matt_id}

class Base(BaseModel):
    name: str
    #point: Optional[float] = None
    #is_accepted: Optional[bool] = False

    def is_json(myjson):
        try:
            #json.loads(myjson)
            json_object = json.loads(myjson)
        except ValueError as e:
            return False
        return json_object

def checker(tagselection: str = Form(...)):
    print (tagselection)
    try:
        return Base.is_json(tagselection)
    #except ValidationError as e:
    except:
        print("ERRRORRR 422")
        raise HTTPException(
            #detail=jsonable_encoder(e.errors()),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

async def valid_content_length(content_length: int = Header(..., lt=8000_000)):
    return content_length
@app.post("/upload")
async def upload_file(
    #file: UploadFile = File(...), file_size: int = Depends(valid_content_length)
    tagselection: Base = Depends(checker), file: UploadFile = File(...), file_size: int = Depends(valid_content_length)
):
    output_file = f"{file.filename}"
    real_file_size = 0
    print(f"JSON Payload : {tagselection}")
    print(type(tagselection))
    #print(f"BPM : {tagselection['tags']['bpm']}")
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
        job_id = submit_job(file.filename, tagselection)
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
                    result = db_search(job_id)
                    if (result[0]['completed']) == False:
                       db_update('', job_id, '', True, '')
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

    print ("ttttttttttttttttttttttT")
    # Get the tag keys required by user
    # Is genre key set in db?
    result = db_search(job_id)
    print (result[0]['audiofile'])
    tagdata = result[0]['tags']
    for key, value in (tagdata.items()):
        print (f"KEY : {key}")
        if key == 'genre':
            print ("GENRE!")
            tagfilename = filename+".genre"
            try:
                with open(tagfilename, 'r') as f_obj:
                    #contents = f_obj.read()
                    g_last_line = f_obj.readlines()[-1]
                    f_obj.close()
                    g_last_line = g_last_line.replace('\n', '').replace('\r', '')
                    g_last_line = g_last_line.split(',') 
                    g_last_line = (g_last_line[-3:])
                    print (g_last_line)
                    # Form the tag
                    tagdata['genre'] = g_last_line
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f'Genre detail for {job_id} not found')
                return False
        if key == 'bpm':
            print ("BPM!")
            tagfilename = filename+".bpm"
            try:
                with open(tagfilename, 'r') as f_obj:
                    #contents = f_obj.read()
                    b_last_line = f_obj.readlines()[-1]
                    b_last_line = b_last_line.replace('\n', '').replace('\r', '')
                    f_obj.close()
                    # Form the tag
                    tagdata['bpm'] = b_last_line
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f'BPM detail for {job_id} not found')
                return False
        if key == 'key':
            print ("KEY!")
            tagfilename = filename+".key"
            try:
                with open(tagfilename, 'r') as f_obj:
                    #contents = f_obj.read()
                    k_last_line = f_obj.readlines()[-1]
                    k_last_line = k_last_line.replace('\n', '').replace('\r', '')
                    f_obj.close()
                    # Form the tag
                    tagdata['key'] = k_last_line
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f'Key detail for {job_id} not found')
                return False
    print (f"TUTTTI {tagdata}")
    #hello = json.dumps(tagdata)
    #print (hello)
    # form the tags and return it to the calling function
    return (tagdata)

    #tagdata = result[0]['tags']
    #for value in tagdata.values())

def generate_job_crd(job_name, image, args):
    """
    Generate an equivalent job CRD to sample-job.yaml
    """
    try:
        # Get the ip of the nfs storage server from config
        config = configparser.ConfigParser()
        config.read('config/matnn.ini')
        print (config.sections())
        nfs_server = config['nfs-server']['host']
        print (nfs_server)
    except configparser.Error:
        raise HTTPException(status_code=500, detail=f'Read of config for {job_id} failed')
        return {'detail': f'Read of config for {job_id} failed'}

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
    nfsvol = client.V1NFSVolumeSource(path="/exports", server=nfs_server)
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
    db = TinyDB('./matnn.json')
    audio = Query()
    # Status update, update the 'completed'
    if not filename and not epoch and not tags:
        try:
            db.upsert({'job_id': job_id, 'completed': completed}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
        return
    # Result update, update the tags
    elif not filename and not epoch:
        try:
            db.upsert({'job_id': job_id, 'completed': completed, 'tags': tags}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
    # update whole record
    else:
        try:
            db.upsert({'audiofile': filename, 'job_id': job_id, 'epoch': epoch, 'completed': completed, 'tags': tags}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
        return

def db_search(job_id):
    # Check if file md5 exists in database
    db = TinyDB('./matnn.json')
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
    elif (result[0]['completed']) == True:
        audiofile = (result[0]['audiofile'])
        # Go through tags list and see if values populated
        print (result[0]['tags'])
        print (type(result[0]['tags']))
        tagdata = result[0]['tags']
        values_blank_populated_check = all(value == '' for value in tagdata.values())
        print (f"Database values all blank?: {values_blank_populated_check}")
        # Get from database
        tagdict = (tagdata.items())
        print (tagdict)
        if values_blank_populated_check == False:
            return {'audiofile': f'{audiofile}', 'result': tagdict}
        else:
            # Get the tags from filesystem
            tags = (read_tags(job_id))
            if tags == False:
                raise HTTPException(status_code=404, detail=f'Reading tags for {job_id} failed')
                return {'detail': f'Reading tags for {job_id} failed'}
            else:
                db_update('', job_id, '', True, tags)
                tagdict = (tags.items())
                print (tagdict)
                return {'audiofile': f'{audiofile}', 'result': tagdict}
    elif (result[0]['completed']) == False:
        audiofile = (result[0]['audiofile'])
        # Get the tags from filesystem
        tags = (read_tags(job_id))
        tagdict = (tags.items())
        print (tagdict)
        if tags == False:
            raise HTTPException(status_code=202, detail=f'Reading tags for {job_id} processing')
            return {'detail': f'Reading tags for {job_id} processing'}
        else:
            db_update('', job_id, '', True, tags)
            return {'audiofile': f'{audiofile}', 'result': tagdict}
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
            if result > 18000:
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


def submit_job(filename, tagselection):
    """
    Run a job.
    """
    md5=compute_md5(filename)
    print (tagselection)
    # Form the json formatted tag to go into database
    tags = {}
    #print (filename);
    try:
        genre = tagselection['tags']['genre']
        print (f"Genre: {genre}")
        tags['genre'] = ''
        mn_args_genre = "-g"
        result_genre_output_file="/mnt/{}.genre".format(md5)
    except:
        print ("Genre not selected")
        mn_args_genre = "-x"
    try:
        bpm = tagselection['tags']['bpm']
        print (f"BPM: {bpm}")
        tags['bpm'] = ''
        mn_args_bpm = "-b"
        result_bpm_output_file="/mnt/{}.bpm".format(md5)
    except:
        print ("BPM not selected")
        mn_args_bpm = "-x"
    try:
        key = tagselection['tags']['key']
        print (f"Key: {key}")
        tags['key'] = ''
        mn_args_key = "-k"
        result_key="/mnt/{}.key".format(md5)
    except:
        print ("Key not selected")
        mn_args_key = "-x"
    
    #print (tags)
    #container_args_str = ' '.join(container_args)
    #print (container_args_str)
    # If empty checkboxes, default to genre
    #if bool(tags) == False:
    #    tags['genre'] = ''

    md5=compute_md5(filename)
    # This will run in a pod soon and will change here
    #nfs_file="/data/nfs/{}".format(md5)
    nfs_file="/mnt/{}".format(md5)
    matnn_pod_nfs_file="/mnt/{}".format(md5)

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

    #sys.exit(0)

    #parser = get_parser()
    #args, _ = parser.parse_known_args()

    #cmdargs=["python3", "-m", "musicnn.tagger", "/musicnn/audio/TRWJAZW128F42760DD_test.mp3", "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", output_file]
    #cmdargs=["python3", "-m", "musicnn.tagger", matnn_pod_nfs_file, "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", result_genre_output_file]
    #cmdargs=["/musicnn/run.sh", "-f", matnn_pod_nfs_file, container_args_str]
    cmdargs=["/musicnn/run.sh", "-f", matnn_pod_nfs_file, mn_args_genre, mn_args_bpm, mn_args_key]
    print (cmdargs)

    image="intamixx/musicnn_v2:0.4"
    #job_name="musicnn-%s-%s" % (md5, rand_id)
    job_id = "{}-{}".format(md5, rand_id)
    job_name="musicnn-{}".format(job_id)

    #print ("Inserting into Database")
    #print ("Current Date: {}".format(datetime.now()))
    epochtime = int(datetime.now().strftime('%s'))
    #print ("Epoch time: {}".format(epochtime))
    db_update(filename, job_id, epochtime, False, tags)
    
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

    return job_id
