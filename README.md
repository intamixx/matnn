# matnn
Tested on a kubernetes cluster v1.26.4 with Kueue 0.5.2

Main Website: [https://matnn.intamixx.uk](https://matnn.intamixx.uk)

Vue App - [https://matnn.intamixx.uk/predict](https://matnn.intamixx.uk/predict)

Direct service frontend GUI: [https://mat.intamixx.uk:8090/upload](https://mat.intamixx.uk:8090/upload)

Provide a simple web frontend for the API using nodejs, expressjs, multer, fetch etc
Kueue scheduler is controlled and queried by fastapi backend.

Matnn (Music Audio Tagger Neural Net) is a rest compliant music tag service utilizing a batch queuing system (Kueue) running on a Kubernetes cluster.
Enhance music metadata to improve music discoverability for any use case including music libraries, streaming, song selection.

Matnn utilizes the Discogs-EffNet model from Essentia to predict music classification, BPM (Beats per minute), tonal/key scale and approachability/engagement from over 400 genres of music. Musicnn is also offered as a prediction model from 50 genres of music.

To upload your music, use either the simple web form or the CLI driven API service.

Currently music files must be MP3 format and under 10 MB.

Web upload form

Uses [discogs-effnet](https://essentia.upf.edu/models.html#discogs-effnet) or [musicnn](https://github.com/jordipons/musicnn) to determine genres of music uploaded using API or website.
Uses [Kueue](https://kueue.sigs.k8s.io) to schedule musicnn pods work loads and return result to API.

API Usage example
Currently files must be MP3 and under 10 MB.  File mimetype and extension must be set as shown in curl example below.  Select musical attributes for analysis by specifying tags required. This reduces time taken for analysis to complete. Select either 'genre_discogs_effnet' OR 'genre_musicnn'.

# Application Architecture
![alt text](https://github.com/intamixx/matnn/blob/main/matnn-application-architecture.jpg?raw=true)

# Submission / Upload API (POST)
Select musical attributes for analysis by specifying tags required. This reduces time taken for analysis to complete. Select either 'genre_discogs_effnet' OR 'genre_musicnn'. Set just the filename with no options to perform a full set of predictions.

Shell
```
curl -k -X POST 'https://mat.intamixx.uk:8090/api/upload' -H 'Content-Type: multipart/form-data' -F "bpm=true" -F "key=true" -F "genre_discogs_effnet=true" -F "classifiers=true" -F "file=@/path/to/audio.mp3;type=audio/mpeg"
```
In Python
```
import requests
url = 'https://mat.intamixx.uk:8090/api/upload'
data = {'genre_discogs_effnet':'True', 'bpm':'True', 'key':'True', 'classifiers':'True'}
file = {'file': ('audio.mp3', open('audio.mp3', 'rb'), 'audio/mpeg')}
resp = requests.post(url=url, files=file, data=data, verify=False)
print(resp.json())
```
```
{
  "id": "01f436c22d490885a90853d7d048c5ff-ntrh9",
  "status": "Successfully uploaded audio.mp3"
}
```
There is an average wait of around 30 seconds for a typical prediction to complete. The result will not be available immediately.

# Status API (GET)
This will show the status of the prediction using the ID returned from the upload step above.
```
curl -k 'https://mat.intamixx.uk:8090/api/status/01f436c22d490885a90853d7d048c5ff-ntrh9'
```
```
{
  "id": "discogseffnet-01f436c22d490885a90853d7d048c5ff-ntrh9",
  "detail": "Successful Job discogseffnet-01f436c22d490885a90853d7d048c5ff-ntrh9"
  "started_at": "08-12-2023 03:36:25",
  "completed_at": "08-12-2023 03:41:19",
}
```

# Result API (GET)
Provides the result of prediction

Bash
```
curl -k 'https://mat.intamixx.uk:8090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'
```
In Python
```
import requests
url = 'https://mat.intamixx.uk:8090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'
resp = requests.get(url=url, verify=False)
print(resp.json())
```
```
{
  "id": "01f436c22d490885a90853d7d048c5ff-ntrh9",
  "audiofile": "audio.mp3",
  "started_at": "08-12-2023 03:36:25",
  "completed_at": "08-12-2023 03:41:19",
  "completed": true,
  "result": {
    "genre": [
      "Drum n Bass",
      "Halftime",
      "Dark Ambient"
    ],
    "bpm": "174.3",
    "key": "Ab Minor",
    "classifiers": {
      "approachability": "low",
      "engagement": "high"
    }
  }
}
```
# Webhook

HTTP-based callback function to desired URL with header signature created from a secret and the payload in attribute X-Matnn-Signature. Body contains original id and event status.
Please contact for the webhooksecret key

```
digest = hmac.new(bytes(key, 'UTF-8'), bytes(payload, 'UTF-8'), hashlib.sha256)
signature = digest.hexdigest()
```

Use webhook_url in the request

```
curl -k -X POST 'https://mat.intamixx.uk:8090/api/upload' -H 'Content-Type: multipart/form-data' -F "webhook_url=http://yoursite.domain:1234" -F "file=@/path/to/audio.mp3;type=audio/mpeg"
```

Webhook received at destination

```
POST / HTTP/1.1
Host: yoursite.domain:1234
User-Agent: python-requests/2.31.0
Accept-Encoding: gzip, deflate
Accept: */*
Connection: keep-alive
X-Matnn-Signature: 0cad7db6d6a210bacb734744770be2305ba69664c3497c97d05248c8e98df9eb
Content-Type: application/json
Content-Length: 81

{"id": "01f436c22d490885a90853d7d048c5ff-ntrh9", "event": {"status": "finished"}}
```

# Example Usage

BPM Tag a file
```
id3v2 --TBPM `curl -k 'https://matnn.intamixx.uk/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9' \
 | jq -r '.result["bpm"]'` audio.mp3
```
Genre Tag a file
```
id3v2 --TCON `curl -k 'https://matnn.intamixx.uk/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9' \
 | jq -r '.result["genre"]' | tr -d "\n" | sed 's/ //g; s/[]["]//g'` audio.mp3
```
Or use a method / language of your choice.

# Contact
Questions? - intamixx@hotmail.com

# To Do
Improve App frontend


