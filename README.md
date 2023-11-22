# matnn

Uses musicnn to determine genres of music uploaded using API or website.
Uses Kueue (https://kueue.sh) to schedule musicnn pods work loads and return result to API.

Musicnn
https://github.com/jordipons/musicnn

API Usage example

curl -X POST 'https://matnn.intamixx.uk:9090/upload' -H 'Content-Type: multipart/form-data' -F "file=@/path/to/audio.mp3;type=audio/mpeg"
