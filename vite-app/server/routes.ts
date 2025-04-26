import type { Express } from "express";
import express from 'express';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { formValidationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs";
import http from 'http';
import FormData from 'form-data';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var maxFileSizeInBytes = 11000000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

var start = async function start(filename, tagobj) {
    console.log("In START");
    const buffer = fs.readFileSync(filename);
    console.log(filename);
    const form = new FormData();

        var model = JSON.stringify(tagobj)
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

    console.log("HEREEEEEEEEEEEEEEEEE");
    console.log(tagobj);
     let result;
    try {
        const response = await axios.post( 'http://localhost:8000/upload',
          //formData,
          form,
          {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
          }
        ).then(function(response){
          console.log('SUCCESS!!');
          //result = response.data; // ▒~E▒~O Store the result in a variable
          result = response; // ▒~E▒~O Store the result in a variable
          console.log('Result:', result);
          console.log(response);
          //console.log(response.data);
          console.log(response.status);
        })
        .catch(function(error){
          console.log('FAILURE!!');
	  result = error;
          console.log(error);
        })
    } catch (error) {
        console.log("ERRORED START");
        console.log('I will execute after error')
        console.log('')
        console.log('Request failed:', error);
    }

//  try {
//    const response = await axios.post('http://localhost:8000/upload', form, {
//            headers: {
//                'Content-Type': 'multipart/form-data',
//            }
//          });
//    result = response.data; // ▒~E▒~O Store the result in a variable
//    console.log('Result:', result);
//  } catch (err) {
//    console.error('Request failed:', err);
//  }

  // You can now use `result` here
  return result;

//    return callback(filename, form);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Form submission endpoint
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
  app.post("/api/form", upload.single("file"), async (req, res) => {
    try {
      // Convert string boolean values to actual booleans
      const formData = {
        bpm: req.body.bpm === "true",
        key: req.body.key === "true",
        approachability: req.body.approachability === "true",
        modelType: req.body.modelType || 'discogs-effnet',
        fileName: req.body.fileName || null,
        fileSize: req.body.fileSize ? parseInt(req.body.fileSize) : null,
        fileType: req.body.fileType || null,
        faid: "null",
        submittedAt: req.body.submittedAt,
      };

      // Set the array format that fastapi will expect to process
       var tagobj = {
        tags:
        {
        }
       }

      // Validate form data
      const validatedData = formValidationSchema.parse(formData);

    if (formData.bpm === true) {
            console.log("Setting BPM");
            tagobj.tags.bpm = true;
    }
    if (formData.key === true) {
            console.log("Setting Key");
            tagobj.tags.key = true;
    }
    if (formData.approachability === true) {
            console.log("Setting Classifiers");
            tagobj.tags.classifiers = true;
    }
    if (formData.modelType === 'discogs-effnet') {
            console.log("Setting Discogs-Effnet");
            tagobj.tags.genre_discogs_effnet = true;
    }
    if (formData.modelType === 'musicnn') {
            console.log("Setting Musicnn");
            tagobj.tags.genre_musicnn = true;
    }
    if (formData.modelType === 'magnatagatune') {
            console.log("Setting Magnatagatune");
            tagobj.tags.genre_magnatagatune = true;
    }

    // If no filename found
    if (req.body.fileName == null) {
          return res.status(400).json({ message: "Please input a filename" });
    }
    if (req.fileValidationError) {
            var err = req.fileValidationError;
            if (err.match(/large/)) {
                //return res.status(413).json(req.fileValidationError);
                return res.status(415).json({ message: "File is too large" });
                return;
            } else if (err.match(/extension|mimetype/)) {
                //return res.status(415).json(req.fileValidationError);
                return res.status(415).json({ message: "Please submit valid MP3 files only" });
                return;
            }
    }

     const fileName = `${req.file.originalname}`;
     const filepath = path.join(uploadsDir, fileName);
     (async () => {
     console.log('before start');

      // Validate form data
      //const validatedData = formValidationSchema.parse(formData);

      // Save file if present
      if (req.file) {
        //const fileName = `${Date.now()}-${req.file.originalname}`;
        const fileName = `${req.file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        
        // Save file to disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Update file info
        validatedData.fileName = fileName;
        validatedData.fileSize = req.file.size;
        validatedData.fileType = req.file.mimetype;
      }

       console.log("FORMDATA !!!!!!!!!!!!!!!!!!!!")
       console.log(validatedData);

      // Store form submission in the database via TinyDB
      const storedSubmission = await storage.createFormSubmission(validatedData);
      console.log("Form submission received and stored:", storedSubmission);

     const fastapi_call = start(filepath, tagobj).then((response) => {
        console.log('*********************************Received outside:', response);
	console.log(response);
	switch (response.status) {
            case 200:
        	validatedData.faid = response.data.id;
        	console.log(response.data.id);
      		return res.status(200).json({ message: "Form submitted successfully", data: validatedData });
		break;
	    case 404:
	        return res.status(500).json({ message: "Error with backend" });
		break;
	    case 413:
	        return res.status(500).json({ message: "Error with backend" });
		break;
	    case 422:
	        return res.status(500).json({ message: "Error with backend" });
		break;
	    case 404:
	        return res.status(500).json({ message: "Error with backend" });
		break;
	    default:
	        return res.status(500).json({ message: "Error with backend" });
		break;
	}
 
     });

     await fastapi_call;
     console.log("BUDDDDDDDDDDDDDDDDDDD");

     // return res.status(200).json({ message: "Form submitted successfully", data: validatedData });
     })();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: validationError.message,
        });
      }
      console.error("Error processing form submission:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

app.get('/upload', function(req, res) {
    res.send('<!doctype html>' +
            '<html lang="en">' +
              '<head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>Matnn Demo</title> <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous"> </head> <body> <h1>Matnn (<u>M</u>usic <u>A</u>udio <u>T</u>agger <u>N</u>eural <u>N</u>et)</h1> <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>' +
            '<form method="post" action="/api/form" enctype="multipart/form-data">' +
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


app.get('/api/status/:id', (req, res) => {
    let userIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    console.log("Source IP is: " + userIp);
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, status) {
        //if (err) console.log('error', err)//error handling
        console.log(err);
        console.log(status);
                res.status(err).send(status);
        }, id, 'status');
});

app.get('/status/:id', (req, res) => {
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, status) {
        if (err) console.log('error', err)//error handling
        console.log("statuscode is " + err);
        console.log("status msg is " + status);
                res.status(err).render('status-wrapper', {
                    id: id,
                    status: JSON.stringify(status),
                    title: "Kueue Job Status",
                    header: "Some info about job status"
                  });
        }, id, 'status');
});

app.get('/api/result/:id', (req, res) => {
    let userIp = req.header('x-forwarded-for') || req.connection.remoteAddress;
    console.log("Source IP is: " + userIp);
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, result) {
        if (err) console.log('error', err)//error handling
        console.log(result);
                res.status(err).send(result);
        }, id, 'result');
});

app.get('/result/:id', (req, res) => {
    var id = req.params.id;
    console.log("!!!!!!!!");
    console.log(id);
    gethttp_api(function(err, result) {
        if (err) console.log('error', err)//error handling
        console.log(result);
                res.status(err).render('result-wrapper', {
                    id: id,
                    result: JSON.stringify(result),
                    title: "Kueue Job Result",
                    header: "Some info about job result"
                  });
        }, id, 'result');
});

function gethttp_api(callback, id, rtype) {

console.log("-----------------");
console.log("ID")
console.log(id);
console.log("RTYPE")
console.log(rtype);
console.log("-----------------");
http.get('http://localhost:8000/' + rtype + '/' + id, res => {
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

  const httpServer = createServer(app);
  return httpServer;
}
