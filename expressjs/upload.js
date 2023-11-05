const express = require('express');
const multer = require('multer');
var maxFileSizeInBytes = 8000000;

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
        //fileSize: maxFileSizeInBytes,
        fields: 1,
        fieldSize: 10,
        fieldNameSize: 10
    },
    fileFilter: function(req, file, cb) {
    	if (!(file.originalname.match(/\.(mp3|wav|flac)\b/))) {
            //return cb(undefined, true)
	    req.fileValidationError = '{"detail": "Goes wrong on the extension"}';
            return cb(null, false, new Error('Goes wrong on the extension'));
        }
	if (file.size > maxFileSizeInBytes) {
	    req.fileValidationError = '{"detail": "File too large"}';
	    return cb(null, false, new Error('File too large'));
	}
        if (file.mimetype !== 'audio/mpeg') {
            req.fileValidationError = '{"detail": "goes wrong on the mimetype"}';
            return cb(null, false, new Error('goes wrong on the mimetype'));
        }
        cb(null, true);
    }
})
const app = express()
var fs = require('fs');
//const FormData = require('form-data');
//const form = new FormData();
//let fetch = require('node-fetch');

var save = function save(filename, callback) {
    console.log("IN SAVE");
    //console.log('got data: '+data);
    //const tuti = start(filename);
    console.log("NOW HERE SAVE");
    //console.log(callback(filename));
    return (callback(filename));
    console.log("after call to callback start " + status);
    //return (status);
    setTimeout(function() {
        console.log("10 seconds later...");
    }, 10000);
};

function foo() {
    var callback = function() {
        console.log("10 seconds later...");
    };
    setTimeout(callback, 10000);
}

var start = async function(filename) {
    console.log("In START");
    const buffer = fs.readFileSync(filename);
    const FormData = require('form-data');
    const form = new FormData();
    let fetch = require('node-fetch');

    form.append('file', buffer, {
        contentType: 'multipart/form-data',
        name: 'file',
        filename: filename,
    });

    try {
        const response = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: form
        })
        //console.log(response);
        console.log(response.status);
        if (response.status == "200") {
            console.log(" START WORKED!");
        }
        if (response.status == "422") {
            console.log("START Too big!");
        }
        console.log("I AM HERE START");
        //await foo()
        const body = await response.json();
        //	if (!response.ok) {
        //		throw new Error(`${response.status} ${response.statusText}`);
        //	}
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


app.get('/upload', function(req, res) {
    res.send('<form method="post" enctype="multipart/form-data">'
        //+ '<p>Title: <input type="text" name="title" /></p>'
        +
        '<p>Image: <input type="file" name="file" /></p>' +
        '<p><input type="submit" value="Upload" /></p>' +
        '</form>');
});

module.exports = (error, req, res, next) => {
	  if (error instanceof multer.MulterError) {
		      error.status = 413;
		      error.message = "image too large, max size is 1mb!";
	  }
	  const status = error.status || 500;
	  const message = error.message;
	  const response = { status: status, error: message };
	  res.status(status).json(response);
};
app.post('/upload', upload.single('file'), (req, res, error) => {
    // The req.file will contain your file data
    // The req.body will contain your text data
    if (req.fileValidationError) {
        return res.end(req.fileValidationError);
    }
    console.log(req.file);
    if (!req.file) {
        console.log("BAD FILE");
        res.status(400).json({
            detail: "Rejected"
        });
    } else {
    if (req.file.size > maxFileSizeInBytes) {
       return res.status(413).json({detail: "File upload size limit exceeded"});
    }
    filepath = req.file['path'];
    filename = req.file['originalname'];
    console.log(filepath);
    console.log(filename);
    //console.log(req.body);
    //status = save(filepath, start); 
    (async () => {
        console.log('before start');

        const fast_api_response = await save(filepath, start);
        //fast_api_response = parseInt(fast_api_response);
        //console.log("RETURN 1");
        //console.log(fast_api_response);
        //console.log("RETURN 1");
        console.log('after start ' + fast_api_response);
        console.log("STATUS is " + fast_api_response['http_status']);
        console.log("BODY is " + fast_api_response['http_body']);
        console.log(typeof(fast_api_response['http_status']));
        if (!fast_api_response) {
            console.log("NOTHING");
        }
        //msg = "{ detail: " + fast_api_response['http_body'] + " }";
        switch (fast_api_response['http_status']) {
            case 200:
                res.status(fast_api_response['http_status']).json(fast_api_response['http_body']);
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
                    fast_api_response['http_body'] = String.raw`{"detail": "ECONNREFUSED"}`;
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

app.listen(9090)

// Then we will set the storage 
//const upload = multer({ storage: storage })
