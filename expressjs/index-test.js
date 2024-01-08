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
//var options = {};
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
const https = require('https');
//const app = express();
var fs = require('fs');

//const FormData = require('form-data');
//const form = new FormData();
//let fetch = require('node-fetch');

app.get('/upload', function(req, res) {
    res.send('<!doctype html>' +
            '<html lang="en">' +
              '<head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Matnn Demo</title> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous"> </head> <body> <h1>Matnn (<u>M</u>usic <u>A</u>udio <u>T</u>agger <u>N</u>eural <u>N</u>et)</h1> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>' +
            '<form method="post" enctype="multipart/form-data">' +
        //+ '<p>Title: <input type="text" name="title" /></p>'
        '<p>Audio File: <input type="file" name="file" /></p>' +
        '<p>Genre (Musicnn): <input type="checkbox" name="genre_musicnn" value="genre_musicnn"></p>' +
        '<p>Genre (Discogs-effnet): <input type="checkbox" name="genre_discogs_effnet" value="genre_discogs_effnet"></p>' +
        '<p>BPM: <input type="checkbox" name="bpm" value="bpm"></p>' +
        '<p>Key: <input type="checkbox" name="key" value="key"></p>' +
        '<p>Approachability / Engagement: <input type="checkbox" name="classifiers" value="classifiers"></p>' +
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
const upload_post_route = require('./upload')
app.use('/upload', upload_post_route)
app.use('/api/upload', upload_post_route)

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
