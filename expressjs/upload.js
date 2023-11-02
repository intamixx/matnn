const express = require('express');
const multer = require('multer');

const whitelist = [
	  'audio/mpeg'
]
const storage = multer.diskStorage({
          destination: (req, file, cb)=>{
                      // This part defines where the files need to be saved
                      cb(null, 'uploads/')
                    },
          filename: (req, file, cb)=>{
                      // This part sets the file name of the file
                      cb(null, file.originalname)
                    }
})

const upload = multer({ dest: 'uploads/', storage: storage, limits: { fileSize: 8000000, fields: 1, fieldSize: 10, fieldNameSize: 10 }, fileFilter: function (req, file, cb) {
 if (file.mimetype !== 'audio/mpeg') {
   req.fileValidationError = '{"detail": "goes wrong on the mimetype"}';
   return cb(null, false, new Error('goes wrong on the mimetype'));
  }
 cb(null, true);
}
})
const app =express()
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
        setTimeout(function () {
                  console.log("10 seconds later...");
        }, 10000);
};

function foo() {
var callback = function () {
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
const response = await fetch('http://localhost:8000/upload', { method: 'POST', body: form })
	  console.log(response.status);
	  if (response.status == "200") {
		  console.log(" START WORKED!");
	  }
	  if (response.status == "422") {
		  console.log("START Too big!");
	  }
	  console.log("I AM HERE START");
	  console.log(response.status);
   //await foo()
//	await (response);
	  return (response.status);
        }  catch (err) {
	  console.log("ERRORED START");
         console.log(err.stack);
      }
//    .then(res => res.json())
//    .then(json => console.log(json));

     console.log('I will execute after error')
}


app.get('/upload', function(req, res){
  res.send('<form method="post" enctype="multipart/form-data">'
    //+ '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Image: <input type="file" name="file" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.post('/upload',upload.single('file'),(req,res)=>{
	    // The req.file will contain your file data
	    // The req.body will contain your text data
	        if(req.fileValidationError) {
			              return res.end(req.fileValidationError);
			        }
	    console.log(req.file);
	    if (!req.file) {
		    console.log("BAD FILE"); 
		res.status(400).json({detail: "Rejected"});
	    }
	    filepath = req.file['path'];
	    filename = req.file['originalname'];
	    filename = req.file['originalname'];
	    console.log(filepath);
	    console.log(filename);
	    console.log("TUTI");
	    console.log(req.body);
	    //status = save(filepath, start); 
		(async() => {
			  console.log('before start');

			  const fast_api_response = await save(filepath, start);
			  //fast_api_response = parseInt(fast_api_response);
			  console.log(typeof (fast_api_response));
			  
			  console.log('after start ' + fast_api_response);
			  switch(fast_api_response) {
				  case 200:
					  res.status(fast_api_response).json({detail: "ok"});
					  break;
				  case 413:
					  res.status(fast_api_response).json({detail: "Too Big"});
					  break;
				  case 422:
			  		res.status(fast_api_response).json({detail: "Fast API rejected"});
					  break;
				  case 404:
			  		res.status(fast_api_response).json({detail: "Not Found"});
					  break;
				  default:
			  		res.status(500).json({detail: "Server Issue"});
					  break;
			}
		})();
})

app.listen(9090)

// Then we will set the storage 
//const upload = multer({ storage: storage })