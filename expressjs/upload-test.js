const express = require('express');
const router = express.Router()

const multer = require('multer');
var fs = require('fs');

var maxFileSizeInBytes = 11000000;

var save = function save(filename, tagobj, callback) {
    console.log("IN SAVE");
    //console.log('got data: '+data);
    //const tuti = start(filename);
    console.log("NOW HERE SAVE");
    console.log(tagobj);
    //console.log(callback(filename));
    return (callback(filename, tagobj));
    console.log("after call to callback start " + status);
    //return (status);
    setTimeout(function() {
        console.log("10 seconds later...");
    }, 10000);
};

var start = async function(filename, tagobj) {
    console.log("In START");
    const buffer = fs.readFileSync(filename);
    const FormData = require('form-data');
    const form = new FormData();
    let fetch = require('node-fetch');

        model = JSON.stringify(tagobj)
        //model = JSON.parse(Buffer.concat(tagobj).toString())
        console.log(model);
        console.log(Buffer.from("Hello World").toString('base64'));
        //model = Buffer.from("Hello World").toString('base64');
    form.append('tagselection', model, {
        contentType: 'application/json',
        //contentType: 'application/octet-stream',
        //Content-Transfer-Encoding: base64,
        name: 'tagselection',
        //tagobj: '{genre: true}',
        tagobj: tagobj,
    });
    form.append('file', buffer, {
        contentType: 'multipart/form-data',
        name: 'file',
        filename: filename,
        //name: 'tagselection',
        //tagobj: tagobj,
    });

    console.log(tagobj);
    //console.log(JSON.stringify(form));

    try {
        const response = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: form
        })
        //console.log(response);
        console.log(response.status);
        if (response.status == "200") {
            console.log(" START WORKED!");
            console.log(tagobj);
        }
        console.log("I AM HERE START");
        //await foo()
        const body = await response.json();
        //      if (!response.ok) {
        //              throw new Error(`${response.status} ${response.statusText}`);
        //      }
        console.log("RESPONSE STATUS");
        console.log(response.status);
        console.log(response.statusText);
        console.log("RESPONSE STATUS");
        console.log("BODY");
        console.log(body);
        console.log("BODY");
        var obj = {
            http_status: response.status,
            http_body: body,
        };
    } catch (error) {
        console.log("ERRORED START");
        console.log('I will execute after error')
        var obj = {
            http_status: 503,
            http_body: error.errno,
        };
    }
    //    .then(res => res.json())
    //    .then(json => console.log(json));
    return obj;
}

const whitelist = [
    'audio/mpeg'
]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // This part defines where the files need to be saved
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        // This part sets the file name of the file
        cb(null, file.originalname)
    }
})

const upload = multer({
    dest: 'uploads/',
    storage: storage,
    limits: {
        fileSize: maxFileSizeInBytes,
        fields: 4,
        fieldSize: 25,
        fieldNameSize: 25
    },
    fileFilter: function(req, file, cb) {
        if (!(file.originalname.match(/\.(mp3|wav|flac)\b/))) {
            //return cb(undefined, true)
            req.fileValidationError = '{detail: Goes wrong on the extension}';
            return cb(null, false, new Error('Goes wrong on the extension'));
        }
      // added this
      const fileSize = parseInt(req.headers['content-length']);
        if (fileSize > maxFileSizeInBytes) {
            req.fileValidationError = '{detail: File too large}';
            return cb(null, false, new Error('File too large'));
      }
        if (file.mimetype !== 'audio/mpeg') {
            req.fileValidationError = '{detail: goes wrong on the mimetype}';
            return cb(null, false, new Error('goes wrong on the mimetype'));
        }
        cb(null, true);
    }
})

const uploadSingleImage = upload.single('file');

router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

function stringify(obj) {
  let cache = [];
  let str = JSON.stringify(obj, function(key, value) {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // reset the cache
  return str;
}

//app.post('/upload', upload.single('file'), function (req, res) {
router.post('/', function (req, res) {
    //console.log("REQUEST is " + stringify(req));
    uploadSingleImage(req, res, function (err) {
    // The req.file will contain your file data
    // The req.body will contain your text data
    // An unknown error occurred when uploading.
    if (err instanceof multer.MulterError) {
        console.log("TUTI" + err);
        res.status(400).json(err);
        return;
      // A Multer error occurred when uploading.
    } else if (err) {
        console.log("BUD" + err);
        res.status(400).json(err);
        return;
    }
    var tagobj = {
        tags:
        {
        }
    }
    if (req.body.genre_discogs_effnet) {
        console.log(req.body.genre_discogs_effnet);
        //tagobj.push({ "genre": "true"});
        //tagobj.push('genre');
        tagobj.tags.genre_discogs_effnet = true;
    }
    if (req.body.genre_musicnn) {
        console.log(req.body.genre_musicnn);
        //tagobj.push({ "genre": "true"});
        //tagobj.push('genre');
        tagobj.tags.genre_musicnn = true;
    }
    if (req.body.bpm) {
        console.log(req.body.bpm);
        //tagobj.push({ "bpm": "true"});
        //tagobj.push('bpm');
        tagobj.tags.bpm = true;
    }
    if (req.body.key) {
        console.log(req.body.key);
        //tagobj.push({ "key": "true"});
        //tagobj.push('key');
        tagobj.tags.key = true;
    }
    if (req.body.appr_engage) {
        console.log(req.body.key);
        //tagobj.push({ "appr_engage": "true"});
        //tagobj.push('appr_engage');
        tagobj.tags.appr_engage = true;
    }
    console.log("Selections are : " + JSON.stringify(tagobj));
    if (req.fileValidationError) {
            var err = req.fileValidationError;
            if (err.match(/large/)) {
                res.status(413).json(req.fileValidationError);
                return;
            } else if (err.match(/extension|mimetype/)) {
                res.status(415).json(req.fileValidationError);
                return;
            }
    }
    // Check if more one genre model selected
    if (req.body.genre_discogs_effnet && req.body.genre_musicnn) {
        console.log("More than one genre model selected");
        res.status(400).json({
            detail: "Please select one genre model type, discogs-effnet or musicnn"
        });
        return;
    }
    if (!req.file) {
        console.log("BAD FILE");
        res.status(400).json({
            detail: "Rejected"
        });
        return;
    } else {
    //console.log(req.file);
    if (req.file.size > maxFileSizeInBytes) {
       return res.status(413).json({detail: "File upload size limit exceeded"});
    }
    var filepath = req.file['path'];
    var filename = req.file['originalname'];
    console.log(filepath);
    console.log(filename);
    console.log("REQ BODY is ");
    console.log(req.body);
    console.log("TAG OBJ is ");
          tagobj = JSON.parse(JSON.stringify(tagobj));
          console.log(tagobj);
    //status = save(filepath, start);
    (async () => {
        console.log('before start');

        const fast_api_response = await save(filepath, tagobj, start);
        //fast_api_response = parseInt(fast_api_response);
        //console.log("RETURN 1");
        //console.log(fast_api_response);
        //console.log("RETURN 1");
        console.log('after start ' + fast_api_response);
        console.log("STATUS is " + fast_api_response['http_status']);
        //console.log("BODY is " + fast_api_response['http_body']);
        console.log("JSON is " + JSON.stringify(fast_api_response['http_body']));
        console.log(typeof(fast_api_response['http_status']));
        var JSONObject = JSON.parse(JSON.stringify(fast_api_response['http_body']));
        console.log(JSONObject);
        var id = JSONObject.id;
        ////var tokens = JSON.stringify(fast_api_response['http_body']).split(" ");
        ////var id = tokens[tokens.length - 1];
        //id = id.replace('}', '');
        //id = id.replace('{', '');
        //id = id.replace(/["{}]/g, '');
        console.log(id);

        if (!fast_api_response) {
            console.log("NOTHING");
        }
        //msg = "{ detail: " + fast_api_response['http_body'] + " }";
        switch (fast_api_response['http_status']) {
            case 200:
                // Extract the id from the response body
                //res.status(fast_api_response['http_status']).render('status-wrapper', {
                //    id: id,
                //    status: JSON.stringify(fast_api_response['http_body']),
                //    title: "Kueue Job Status",
                //    header: "Some info about job status"
                //  });
                //res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
                await sleep(1000);
                console.log("BASEURL is " + req.baseUrl);
                if (req.baseUrl.match(/api\/upload/)) {
                        res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                } else {
                        res.status(fast_api_response['http_status']).redirect("/status/" + id);
                }
                break;
            case 413:
                res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                break;
            case 422:
                res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                break;
            case 404:
                res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                break;
            case 503:
                // Special case of connection refused error to fastapi
                if (fast_api_response['http_body'] == "ECONNREFUSED") {
                    //fast_api_response['http_body'] = String.raw`{"detail": "ECONNREFUSED"}`;
                    fast_api_response['http_body'] = JSON.stringify({detail: 'ECONNREFUSED'});
                }
                res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
                break;
            default:
                console.log("default");
                res.status(500).json(fast_api_response['http_body']);
                break;
        }
    })();
    }
})
})
module.exports = router
