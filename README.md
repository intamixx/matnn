# matnn
Tested on a kubernetes cluster v1.26.4 with Kueue 0.4.2

Main Website: [https://matnn.intamixx.uk](https://matnn.intamixx.uk)

Direct service frontend GUI: [https://mat.intamixx.uk:9090/upload](https://mat.intamixx.uk:9090/upload)

Provide a simple web frontend for the API using nodejs, expressjs, multer, fetch etc
Kueue scheduler is controlled and queried by fastapi backend.

Uses [discogs-effnet](https://essentia.upf.edu/models.html#discogs-effnet) or [musicnn](https://github.com/jordipons/musicnn) to determine genres of music uploaded using API or website.
Uses [Kueue](https://kueue.sigs.k8s.io) to schedule musicnn pods work loads and return result to API.

API Usage example
Currently files must be MP3 and under 10 MB.  File mimetype and extension must be set as shown in curl example below.  Choose or select the tags required as below;
Music submission for analysis, setting tags required. Select either 'genre_discogs_effnet' or 'genre_musicnn' as shown below

# Upload
Shell
```
curl -k -X POST 'https://mat.intamixx.uk:9090/api/upload' -H 'Content-Type: multipart/form-data' -F "bpm=true" -F "key=true" -F "genre_discogs_effnet=true" -F "file=@/path/to/audio.mp3;type=audio/mpeg"
```
In Python
```
import requests
url = 'https://mat.intamixx.uk:9090/api/upload'
data = {'genre_discogs_effnet':'True', 'bpm':'True', 'key':'True'}
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

# Status
This will show the status of the prediction.
```
curl -k 'https://mat.intamixx.uk:9090/api/status/01f436c22d490885a90853d7d048c5ff-ntrh9'
```
```
{
  "id": "musicnn-01f436c22d490885a90853d7d048c5ff-ntrh9",
  "detail": "Successful Job musicnn-01f436c22d490885a90853d7d048c5ff-ntrh9"
  "started_at": "08-12-2023 03:36:25",
  "completed_at": "08-12-2023 03:41:19",
}
```

# Result
Provides the result of prediction

Bash
```
curl -k 'https://mat.intamixx.uk:9090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'
```
In Python
```
import requests
url = 'https://mat.intamixx.uk:9090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'
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
    "key": "Ab Minor"
  }
}
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
Provide API functionality for a webhook HTTPS URL to call when predictions are ready.


