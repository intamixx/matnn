# matnn
Tested on a kubernetes cluster v1.26.4 with Kueue 0.4.2

Main Website: [https://matnn.intamixx.uk](https://matnn.intamixx.uk)

Direct service frontend GUI: [https://mat.intamixx.uk:9090/upload](https://mat.intamixx.uk:9090/upload)

Provide a simple web frontend for the API using nodejs, expressjs, multer, fetch etc
Kueue scheduler is controlled and queried by fastapi backend.

Uses discogs-effnet [discogs-effnet]([https://essentia.upf.edu/](https://essentia.upf.edu/models.html#discogs-effnet). or [musicnn](https://github.com/jordipons/musicnn) to determine genres of music uploaded using API or website.
Uses [Kueue](https://kueue.sigs.k8s.io) to schedule musicnn pods work loads and return result to API.

API Usage example
Currently files must be MP3 and under 8 MB.  File mimetype and extension must be set as shown in curl example below.  Choose or select the tags required as below;

# Upload
curl -k -X POST 'https://mat.intamixx.uk:9090/api/upload' -H 'Content-Type: multipart/form-data' -F "bpm=true" -F "key=true" -F "genre=true" -F  "file=@/path/to/audio.mp3;type=audio/mpeg"

{"message":"Successfully uploaded audio.mp3 as 01f436c22d490885a90853d7d048c5ff-ntrh9"}

Wait of around 30 seconds for a typical job to complete

# Status
to check if kueue job complete

curl -k 'https://mat.intamixx.uk:9090/api/status/01f436c22d490885a90853d7d048c5ff-ntrh9' 

# Result
of kueue Job

curl -k 'https://mat.intamixx.uk:9090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'

