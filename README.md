# matnn

Website https://matnn.intamixx.uk:9090/upload

Uses musicnn to determine genres of music uploaded using API or website.
Uses Kueue (https://kueue.sigs.k8s.io) to schedule musicnn pods work loads and return result to API.

Musicnn
https://github.com/jordipons/musicnn

API Usage example
Currently files must be MP3 and under 8 MB.

# Upload
curl -X POST 'https://matnn.intamixx.uk:9090/upload' -H 'Content-Type: multipart/form-data' -F "file=@/path/to/audio.mp3;type=audio/mpeg"
{"message":"Successfully uploaded xxxxxx-xxxxx.mp3 as 01f436c22d490885a90853d7d048c5ff-ntrh9"}

Wait of around 30 seconds for a typical job to complete

# Status
to check if kueue job complete

curl -k 'https://matnn.intamixx.uk:9090/api/status/01f436c22d490885a90853d7d048c5ff-ntrh9' 

# Result
of kueue Job

curl -k 'https://matnn.intamixx.uk:9090/api/result/01f436c22d490885a90853d7d048c5ff-ntrh9'

