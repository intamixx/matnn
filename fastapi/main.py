from fastapi import FastAPI, Form, File, Request, UploadFile, HTTPException, status, Header, Depends
from fastapi.exceptions import HTTPException
from fastapi.responses import HTMLResponse
import aiofiles

from kubernetes import config, client
import hashlib, sys, os, shutil, ast

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

async def valid_content_length(content_length: int = Header(..., lt=10000_000)):
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
        msg = f"Successfully uploaded {file.filename}"
    except IOError:
        raise HTTPException(status_code=500, detail=f'There was an error uploading your file')
        msg = "There was an error uploading your file"
    return { "id": job_id, "detail": msg }

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
                return {'id': job_id, 'detail': f'Processing Job {jobname}'}
            try:
                if job["status"]["succeeded"] == 1:
                    result = db_search(job_id)
                    # Job succeeded, update the db
                    if (result[0]['completed']) == False:
                       db_update('', job_id, '', '', True, '')
                       (tags, completed_at) = (read_tags(job_id))
                       db_update('', job_id, '', completed_at, '', '')
                    else:
                       completed_at = (result[0]['finish_epoch'])
                    started_at = (result[0]['start_epoch'])
                    return {'id': job_id, 'detail': f'Successful Job {jobname}', 'started_at': f'{epochtodatetime(started_at)}', 'completed_at': f'{epochtodatetime(completed_at)}'}
            except:
                raise HTTPException(status_code=202, detail=f'Finalising Job {jobname}')
                return {'id': job_id, 'detail': f'Finalising Job {jobname}'}
    raise HTTPException(status_code=410, detail=f'Job status not available, try calling result api or please try again later')
    return {'detail': f'Job status not available, try calling result api or please try again later'}
            #print(f"Found job {jobname}")
            #print(f"  Succeeded: {status}")
            #print(f"  Ready: {ready}")

def mtime_epoch(filename):
    m_timestamp = os.stat(filename).st_mtime
    print (m_timestamp)
    return m_timestamp

def read_tags(job_id):
# Reads tag information and stat for epoch complete time
    finish_epoch_times = []
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
                m_timestamp = mtime_epoch(tagfilename)
                finish_epoch_times.append(m_timestamp)
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
                m_timestamp = mtime_epoch(tagfilename)
                finish_epoch_times.append(m_timestamp)
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
                m_timestamp = mtime_epoch(tagfilename)
                finish_epoch_times.append(m_timestamp)
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
        if key == 'classifiers':
            print ("APPROACHABILITY / ENGAGEMENT!")
            tagfilename = filename+".ae"
            try:
                m_timestamp = mtime_epoch(tagfilename)
                finish_epoch_times.append(m_timestamp)
                with open(tagfilename, 'r') as f_obj:
                    json_string = f_obj.readlines()[-1]
                    json_string = json_string.replace('\n', '').replace('\r', '')
                    json_format = json.dumps(ast.literal_eval(json_string))
                    contents = json.loads(json_format)
                    f_obj.close()
                    # Form the tag
                    tagdata['classifiers'] = contents
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f'Classifier detail for {job_id} not found')
                return False
    print (f"TUTTTI {tagdata}")
    #hello = json.dumps(tagdata)
    #print (hello)
    # form the tags and return it to the calling function
    print (finish_epoch_times)
    finish_epoch_time = max(finish_epoch_times)
    finish_epoch_time = round(finish_epoch_time)
    finish_epoch_time = int(finish_epoch_time)
    print (finish_epoch_time)
    # This sets the job completion time
    #db_update('', job_id, '', finish_epoch_time, '', '')
    return (tagdata, finish_epoch_time)

    #tagdata = result[0]['tags']
    #for value in tagdata.values())

def confparser(section, key):
    try:
        # Get the ip of the nfs storage server from config
        config = configparser.ConfigParser()
        config.read('config/matnn.ini')
        #print (config.sections())
        value = (config[section][key])
        return value
    except configparser.Error:
        raise HTTPException(status_code=500, detail=f'Read of config failed')
        return {'detail': f'Read of config failed'}

def generate_job_crd(job_name, image, args):
    """
    Generate an equivalent job CRD to sample-job.yaml
    """
    nfs_server = confparser('nfs-server', 'host')
    print (nfs_server)

    metadata = client.V1ObjectMeta(
        generate_name=job_name, labels={"kueue.x-k8s.io/queue-name": "user-queue"}
    )

    # Job container
    container = client.V1Container(
        image=image,
        name="musicnn-job",
        args=args,
        resources=client.V1ResourceRequirements(requests={'cpu': 1, 'memory': '200Mi',} ),
        security_context=client.V1SecurityContext(run_as_user=1000),
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

def db_update(filename, job_id, start_epoch, finish_epoch, completed, tags):
    db = TinyDB('./matnn.json')
    audio = Query()
    # Status update, update the 'completed'
    if not filename and not start_epoch and not finish_epoch and not tags:
        print ("ONEEE")
        try:
            db.upsert({'job_id': job_id, 'completed': completed}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
        return
    # Status / Result update, finish_epoch
    elif not filename and not start_epoch and not completed and not tags:
        print ("TWOOO")
        try:
            db.upsert({'job_id': job_id, 'finish_epoch': finish_epoch}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
    # Result update, update the tags, completed
    elif not filename and not start_epoch:
        print ("THREEE")
        try:
            db.upsert({'job_id': job_id, 'completed': completed, 'finish_epoch': finish_epoch, 'tags': tags}, audio.job_id == job_id)
        except:
            raise HTTPException(status_code=500, detail=f'Database insertion error')
            return {'detail': f'Database insertion error'}
    # update whole record
    else:
        print ("FOURR")
        try:
            db.upsert({'audiofile': filename, 'job_id': job_id, 'start_epoch': start_epoch, 'finish_epoch': finish_epoch, 'completed': completed, 'tags': tags}, audio.job_id == job_id)
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

def epochtodatetime(epochtime):
    print ("EPOCHTIME TIME IS:")
    print (epochtime)
    print ("TYPE")
    print (type(epochtime))
    epochtime = int(epochtime)
    dt = datetime.fromtimestamp(epochtime).strftime('%d-%m-%Y %H:%M:%S')
    return dt

# Get the result of the job
@app.get("/result/{job_id}")
async def result_job(job_id):
    # Check if in database
    result = db_search(job_id)
    if not result:
        raise HTTPException(status_code=404, detail=f'Result {job_id} not found')
        return {'detail': f'Result {job_id} not found'}
        # Get all available data
    else:
        print ("RESULT IS")
        print (result)
        if (result[0]['completed']) == True:
            print ("COMPLETED TRUE!")
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
                audiofile = (result[0]['audiofile'])
                started_at = (result[0]['start_epoch'])
                completed_at = (result[0]['finish_epoch'])
                completed = (result[0]['completed'])
            else:
                # Get the tags from filesystem and get completed time
                (tags, completed_at) = (read_tags(job_id))
                if tags == False:
                    raise HTTPException(status_code=404, detail=f'Reading tags for {job_id} failed')
                    return {'detail': f'Reading tags for {job_id} failed'}
                else:
                    # Set completed to true with tag data
                    db_update('', job_id, '', completed_at, True, tags)
                    tagdict = (tags.items())
                    print (tagdict)
                    audiofile = (result[0]['audiofile'])
                    started_at = (result[0]['start_epoch'])
                    #completed_at = (result[0]['finish_epoch'])
                    completed = (result[0]['completed'])
        # Section run if results called without a status call. i.e. using api via cli
        elif (result[0]['completed']) == False:
            print ("COMPLETED FALSE!")
            audiofile = (result[0]['audiofile'])
            # Get the tags from filesystem and get completed time
            (tags, completed_at) = (read_tags(job_id))
            if tags == False:
                raise HTTPException(status_code=202, detail=f'Reading tags for {job_id} processing')
                return {'detail': f'Reading tags for {job_id} processing'}
            else:
                # Set completion to True with tagdata
                db_update('', job_id, '', completed_at, True, tags)
                started_at = (result[0]['start_epoch'])
                #completed_at = (result[0]['finish_epoch'])
                completed = True
                tagdict = (tags.items())
                print ("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
                print (tagdict)
        else:
            raise HTTPException(status_code=404, detail=f'Result {job_id} not found')
            return {'detail': f'Result {job_id} not found'}
        print ("STARTED AT")
        print (type(started_at))
        print ("COMPLETED AT")
        print (type(completed_at))
        return {'id': job_id, 'audiofile': f'{audiofile}', 'started_at': f'{epochtodatetime(started_at)}', 'completed_at': f'{epochtodatetime(completed_at)}', 'completed': completed, 'result': tagdict}

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
        job_epoch = int(results[0]['start_epoch'])
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
    try:
        listing = crd_api.list_namespaced_custom_object(
            _request_timeout=1,
            group="batch",
            version="v1",
            #namespace=args.namespace,
            namespace="default",
            plural="jobs",
    )
    except:
        raise HTTPException(status_code=500, detail=f'Internal server error: {job_id}')
        return {'detail': f'Internal server error: {job_id}'}
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
    webhook = {}
    #print (filename);
    mn_args_genre = "-x"
    #mn_args_genre_type = "-x"

    # split out webhook into another dict
    try:
        webhook_url = tagselection['tags']['webhook_url']
        print (f"Webhook URL: {webhook_url}")
        webhook['webhook_url'] = webhook_url
        mn_args_webhook = "-w"
        mn_args_webhook_url = webhook_url
    except:
        print ("Webhook not selected")
        mn_args_webhook = "-x"
        mn_args_webhook_url = "-x"

    try:
        genre = tagselection['tags']['genre_musicnn']
        print (f"Genre musicnn: {genre}")
        tags['genre'] = ''
        mn_args_genre = "-g"
        mn_args_genre_type = "musicnn"
        #result_genre_output_file="/mnt/{}.genre".format(md5)
    except:
        print ("Genre musicnn not selected")

    try:
        genre = tagselection['tags']['genre_discogs_effnet']
        print (f"Genre discogs_effnet: {genre}")
        tags['genre'] = ''
        mn_args_genre = "-g"
        mn_args_genre_type = "discogseffnet"
        #result_genre_output_file="/mnt/{}.genre".format(md5)
    except:
        print ("Genre discogs-effnet not selected")

    try:
        bpm = tagselection['tags']['bpm']
        print (f"BPM: {bpm}")
        tags['bpm'] = ''
        mn_args_bpm = "-b"
        #result_bpm_output_file="/mnt/{}.bpm".format(md5)
    except:
        print ("BPM not selected")
        mn_args_bpm = "-x"

    try:
        key = tagselection['tags']['key']
        print (f"Key: {key}")
        tags['key'] = ''
        mn_args_key = "-k"
        #result_key_output_file="/mnt/{}.key".format(md5)
    except:
        print ("Key not selected")
        mn_args_key = "-x"

    try:
        key = tagselection['tags']['classifiers']
        print (f"Classifiers: {key}")
        tags['classifiers'] = ''
        mn_args_classifiers = "-a"
        #result_classifiers_output_file="/mnt/{}.ae".format(md5)
    except:
        print ("APPR / ENGAGE not selected")
        mn_args_classifiers = "-x"

    # if tags empty
    #if not bool(tags) or webhook['webhook_url'] and len(tags) == 1:
    if not bool(tags):
        print ("Tags Dict is Empty, put in analysis defaults")
        mn_args_genre = "-g"
        mn_args_genre_type = "discogseffnet"
        mn_args_bpm = "-b"
        mn_args_key = "-k"
        mn_args_classifiers = "-a"
        tags['genre'] = ''
        tags['bpm'] = ''
        tags['key'] = ''
        tags['classifiers'] = ''

    print ("oooooooooooooo")
    print (tags)
    print (webhook)
    print ("oooooooooooooo")
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
        shutil.move(filename, nfs_file)
        #print("File %s copied successfully into %s" % (filename, output_file))
    except:
        raise HTTPException(status_code=500, detail=f'Error copying upload file {filename}')
        return {'detail': f'Error copying upload file {filename}'}
        #sys.exit(1)

######## Just to test database
    job_id = "{}-{}".format(md5, rand_id)
    try:
        job_name="{}-{}".format(mn_args_genre_type, job_id)
    except:
        # mn_args_genre_type not set, so job_name is default for now and send a blank genre_type
        job_name="default-{}".format(job_id)
        mn_args_genre_type = "-x"
    #print ("Inserting into Database")
    #print ("Current Date: {}".format(datetime.now()))
    start_epochtime = int(datetime.now().strftime('%s'))
    #print ("Epoch time: {}".format(epochtime))
    db_update(filename, job_id, start_epochtime, 0, False, tags)

    #cmdargs=["/musicnn/run.sh", "-f", matnn_pod_nfs_file, mn_args_genre, mn_args_genre_type, mn_args_bpm, mn_args_key]
    #print (cmdargs)

    #return job_id
########

    #sys.exit(0)

    #parser = get_parser()
    #args, _ = parser.parse_known_args()

    #cmdargs=["python3", "-m", "musicnn.tagger", "/musicnn/audio/TRWJAZW128F42760DD_test.mp3", "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", output_file]
    #cmdargs=["python3", "-m", "musicnn.tagger", matnn_pod_nfs_file, "--model", "MSD_musicnn", "--topN", "3", "--length", "3", "--overlap", "1", "--print", "--save", result_genre_output_file]
    #cmdargs=["/musicnn/run.sh", "-f", matnn_pod_nfs_file, container_args_str]
    cmdargs=["/musicnn/run.sh", "-f", matnn_pod_nfs_file, mn_args_genre, mn_args_genre_type, mn_args_bpm, mn_args_key, mn_args_classifiers, mn_args_webhook, mn_args_webhook_url, "-i", job_id]
    print (cmdargs)

    image = confparser('dockerhub', 'image')
    print (image)
    #image="intamixx/musicnn_v2:latest"
    #job_name="musicnn-%s-%s" % (md5, rand_id)
    ##job_id = "{}-{}".format(md5, rand_id)
    ##job_name="musicnn-{}".format(job_id)

    #print ("Inserting into Database")
    #print ("Current Date: {}".format(datetime.now()))
    ##epochtime = int(datetime.now().strftime('%s'))
    #print ("Epoch time: {}".format(epochtime))
    ##db_update(filename, job_id, epochtime, False, tags)

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
