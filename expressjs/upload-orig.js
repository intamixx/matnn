'use strict'

const http = require('http');
//const axios = require('axios');

/**
 * Module dependencies.
 */

//var express = require('../../');
const express = require('express');
var path = require('path');
var fs = require('fs');

//var app = module.exports = express();
const app = express();

var options = {
    key: fs.readFileSync('./ssl/privatekey.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem'),
};
var port = 9090;

// Register ejs as .html. If we did
// not call this, we would need to
// name our views foo.ejs instead
// of foo.html. The __express method
// is simply a function that engines
// use to hook into the Express view
// system by default, so if we want
// to change "foo.ejs" to "foo.html"
// we simply pass _any_ function, in this
// case `ejs.__express`.

app.engine('.html', require('ejs').__express);

// Optional since express defaults to CWD/views

app.set('views', path.join(__dirname, 'views'));

// Path to our public directory

app.use(express.static(path.join(__dirname, 'public')));

// Without this you would need to
// supply the extension to res.render()
// ex: res.render('users.html').
app.set('view engine', 'html');

// Dummy users
var users = [
  { name: 'tobi', email: 'tobi@learnboost.com' },
  { name: 'loki', email: 'loki@learnboost.com' },
  { name: 'jane', email: 'jane@learnboost.com' }
];

app.get('/', function(req, res){
  res.render('users', {
    users: users,
    title: "EJS example",
    header: "Some users"
  });
});

function gethttpaxios() {
axios.get('http://localhost:8000/status/0ba3c83ce691d814ee31c3b944177d96-u8jgk')
  .then(function (response) {
    // handle success
    console.log(response);
    return (response);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
}


function gethttp_api(callback) {

console.log("-----------------");
console.log(global.id);
console.log("-----------------");
http.get('http://localhost:8000/' + global.stype + '/' + global.id, res => {
  let data = [];
  const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
  console.log('Status Code:', res.statusCode);
  console.log('Date in Response header:', headerDate);

  res.on('data', chunk => {
    data.push(chunk);
  });

  res.on('end', () => {
    console.log('Response ended: ');
    var status = JSON.parse(Buffer.concat(data).toString());
    //console.log(status);
    callback(res.statusCode, status);
  });
}).on('error', err => {
  console.log('Error: ', err.message);
  //callback(err.message, null);
  //var errmsg = ("{" + err.message + "}")
  callback(500, err.message);
  //callback(500, errmsg);
});

}

var callback = function(data) {
  //if (err) throw err; // Check for the error and throw if it exists.
  console.log('got data: '+data); // Otherwise proceed as usual.
//  return ("TUTI");
};

var usingitnow = function(callback) {
  //var myError = new Error('My custom error!');
  //callback(myError, 'get it?'); // I send my error as the first argument.
  //return ("TUTI");
  var status = callback();
  console.log("!!!!!!!!!!!")
  console.log(status)
  console.log("!!!!!!!!!!!")
  //callback('2nd');
  //var status = gethttp_status();
  //var status = gethttpaxios();
  //var status = testshite();
  //return (status);
};

//const express = require('express');
const multer = require('multer');
const https = require('https');
//const app = express();
var fs = require('fs');

var maxFileSizeInBytes = 8000000;

//var options = {
//	    key: fs.readFileSync('./ssl/privatekey.pem'),
//	    cert: fs.readFileSync('./ssl/certificate.pem'),
//};
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
	      '<head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Matnn Demo</title> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous"> </head> <body> <h1>Matnn (<u>M</u>usic <u>A</u>udio <u>T</u>agger <u>N</u>eural <u>N</u>et)</h1> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>' + 
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
    var filepath = req.file['path'];
    var filename = req.file['originalname'];
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
        //console.log("BODY is " + fast_api_response['http_body']);
	console.log("JSON is " + JSON.stringify(fast_api_response['http_body']));
        console.log(typeof(fast_api_response['http_status']));
	var tokens = JSON.stringify(fast_api_response['http_body']).split(" ");
	var id = tokens[tokens.length - 1];
	//id = id.replace('}', '');
	//id = id.replace('{', '');
	id = id.replace(/["{}]/g, '');
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
		res.status(fast_api_response['http_status']).redirect("/status/" + id);
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

//app.listen(9090)
//var server = https.createServer(options, app).listen(port, function(){
//  console.log("Express server listening on port " + port);
//  });


// Then we will set the storage 
//const upload = multer({ storage: storage })


app.get('/status/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "status";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, status, id) {
        if (err) console.log('error', err)//error handling
	console.log("statuscode is " + err);
        console.log("status msg is " + status);
  		res.status(err).render('status-wrapper', {
		    users: users,
		    id: global.id,
		    status: JSON.stringify(status),
		    title: "Kueue Job Status",
		    header: "Some info about job status"
		  });
    	});
});


app.get('/render/status/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "status";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, status, id) {
        if (err) console.log('error', err)//error handling
	console.log(err);
        console.log(status);
  		res.status(err).render('status', {
		    users: users,
		    id: global.id,
		    status: JSON.stringify(status),
		    title: "Kueue Job Status",
		    header: "Some info about job status"
		  });
    	});
});

app.get('/api/status/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "status";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, status, id) {
        //if (err) console.log('error', err)//error handling
	console.log(err);
        console.log(status);
	        res.status(err).send(status);
    	});
});

app.get('/result/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "result";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, result, id) {
        if (err) console.log('error', err)//error handling
        console.log(result);
  		res.status(err).render('result-wrapper', {
		    users: users,
		    id: global.id,
		    result: JSON.stringify(result),
		    title: "Kueue Job Result",
		    header: "Some info about job result"
		  });
    	});
});

app.get('/render/result/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "result";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, result, id) {
        if (err) console.log('error', err)//error handling
        console.log(result);
  		res.status(err).render('result', {
		    users: users,
		    id: global.id,
		    result: JSON.stringify(result),
		    title: "Kueue Job Result",
		    header: "Some info about job result"
		  });
    	});
});

app.get('/api/result/:id', (req, res) => {
    global.id = req.params.id;
    global.stype = "result";
    console.log("!!!!!!!!");
    console.log(id);
    //var status = "";
    //var data = "";
    gethttp_api(function(err, result, id) {
        if (err) console.log('error', err)//error handling
        console.log(result);
	        res.status(err).send(result);
  		//res.status(err).render('result-api', {
    	});
});



/* istanbul ignore next */
//if (!module.parent) {
//  app.listen(9090);
//  console.log('Express started on port 9090');
//}
var server = https.createServer(options, app).listen(port, function(){
  console.log("Express server listening on port " + port);
});
