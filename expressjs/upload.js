const express = require('express');
const multer = require('multer');
const https = require('https');
const app = express();
var fs = require('fs');

var maxFileSizeInBytes = 8000000;

var options = {
	    key: fs.readFileSync('./ssl/privatekey.pem'),
	    cert: fs.readFileSync('./ssl/certificate.pem'),
};
var port = 9090;

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
        fields: 1,
        fieldSize: 10,
        fieldNameSize: 10
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
    res.send('<!doctype html>' + 
	    '<html lang="en">' + 
	      '<head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Bootstrap demo</title> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous"> </head> <body> <h1>Matnn (<u>M</u>usic <u>A</u>udio <u>T</u>agger <u>N</u>eural <u>N</u>et)</h1> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>' + 
	    '<form method="post" enctype="multipart/form-data">' + 
        //+ '<p>Title: <input type="text" name="title" /></p>'
        '<p>Audio File: <input type="file" name="file" /></p>' +
        '<p><input type="submit" value="Upload" /></p>' +
	'<h3>AI Powered by Sandman Technologies Inc</h3>' +
	'      </body>' +
	 '   </html>' +
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

//const upload = multer().single('avatar')

const uploadSingleImage = upload.single('file');

//app.post('/upload', upload.single('file'), function (req, res) {
app.post('/upload', function (req, res) {
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
    if (!req.file) {
        console.log("BAD FILE");
        res.status(400).json({
            detail: "Rejected"
        });
    	return;
    } else {
    console.log(req.file);
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
})

//app.listen(9090)
var server = https.createServer(options, app).listen(port, function(){
  console.log("Express server listening on port " + port);
  });


// Then we will set the storage 
//const upload = multer({ storage: storage })
