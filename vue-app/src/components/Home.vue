<style>
  input[type="file"]{
    position: absolute;
    top: -500px;
  }

  div.file-listing{
    width: 200px;
  }

  span.remove-file{
    color: red;
    cursor: pointer;
    float: right;
  }
</style>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col md-6">
      <div class="row mt-4">
      <div class="col-md-2">
      <label for="" class="mt-1">Files
        <input type="file" id="files" ref="files" multiple v-on:change="handleFilesUpload()"/>
      </label>
      </div>
      <div class="col-md-6">
    <div class="large-12 medium-12 small-12 cell">
      <button class="btn btn-primary" v-on:click="addFiles()">Add File</button>
    </div>
        <div v-for="(file, key) in files" class="file-listing">{{ file.name }} <span class="remove-file" v-on:click="removeFile( key )">Remove</span></div>
      </div>
      </div>

   <div class="row mt-4">
    <div class="col-md-4">
      <label for="" class="mt-1">Musicnn</label>
    </div>
      <div class="col-md-6">
        <input class="form-check-input" type="checkbox" id="Musicnncheckbox" @change="handleMusicnnCheckboxChange" v-model="MusicnnisChecked"/>
      <!-- <p>Musicnn: {{ MusicnnisChecked }}</p> -->
      </div>
    </div>

   <div class="row mt-4">
    <div class="col-md-4">
      <label for="" class="mt-1">Discogs-Effnet</label>
    </div>
      <div class="col-md-6">
        <input class="form-check-input" type="checkbox" id="DiscogsEffnetcheckbox" @change="handleDiscogsEffnetCheckboxChange" v-model="DiscogsEffnetisChecked"/>
      </div>
      <!-- <p>Discogs-Effnet: {{ DiscogsEffnetisChecked }}</p> -->
    </div>

   <div class="row mt-4">
    <div class="col-md-4">
      <label for="" class="mt-1">BPM</label>
    </div>
      <div class="col-md-6">
        <input class="form-check-input" type="checkbox" id="BPMcheckbox" @change="handleBPMCheckboxChange" v-model="BPMisChecked"/>
      </div>
      <!-- <p>BPM: {{ BPMisChecked }}</p> -->
    </div>

   <div class="row mt-4">
    <div class="col-md-4">
      <label for="" class="mt-1">Key</label>
    </div>
      <div class="col-md-6">
        <input class="form-check-input" type="checkbox" id="Keycheckbox" @change="handleKeyCheckboxChange" v-model="KeyisChecked"/>
      </div>
      <!-- <p>Key: {{ KeyisChecked }}</p> -->
    </div>

   <div class="row mt-4">
    <div class="col-md-4">
      <label for="" class="mt-1">Approachability / Engagement</label>
    </div>
      <div class="col-md-6">
        <input class="form-check-input" type="checkbox" id="Classifierscheckbox" @change="handleClassifiersCheckboxChange" v-model="ClassifiersisChecked"/>
      </div>
      <!-- <p>Classifiers: {{ ClassifiersisChecked }}</p> -->
    </div>

        <div class="row mt-4">
          <div class="col-md-2">
            <button class="btn btn-primary" v-on:click="submitFiles()">Predict!</button>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <!-- <img src="../../public/Images/Nerd-rafiki.svg" alt="" /> -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
    var tagobj = {
        tags:
        {
        }
        }
  export default {
    name: "App",
    components: {
        },
    /*
      Defines the data used by the component
    */
    data(){
      return {
        files: [],
        MusicnnisChecked: false, // Initialize the checkbox
        DiscogsEffnetisChecked: false, // Initialize the checkbox
        BPMisChecked: false, // Initialize the checkbox
        KeyisChecked: false, // Initialize the checkbox
        ClassifiersisChecked: false, // Initialize the checkbox
      };
    },

    /*
      Defines the method used by the component
    */
    methods: {
      /*
        Adds a file
      */
      handleMusicnnCheckboxChange () {
      // This method will be called when the checkbox state changes
      console.log("MusicnnCheckbox state changed. Checked:", this.MusicnnisChecked);
      if (this.MusicnnisChecked === true) {
        console.log("Musicnn checked");
        tagobj.tags.genre_musicnn = true;
      } else {
        delete tagobj.tags.genre_musicnn;
      }
      },
      handleDiscogsEffnetCheckboxChange () {
      // This method will be called when the checkbox state changes
      console.log("DiscogsEffnet state changed. Checked:", this.DiscogsEffnetisChecked);
      if (this.DiscogsEffnetisChecked === true) {
        console.log("DiscogsEffnet checked");
        tagobj.tags.genre_discogs_effnet = true;
      } else {
        delete tagobj.tags.genre_discogs_effnet;
      }
      },
      handleBPMCheckboxChange () {
      // This method will be called when the checkbox state changes
      console.log("BPM state changed. Checked:", this.BPMisChecked);
      if (this.BPMisChecked === true) {
        console.log("BPM checked");
        tagobj.tags.bpm = true;
      } else {
        delete tagobj.tags.bpm;
      }
      },
      handleKeyCheckboxChange () {
      // This method will be called when the checkbox state changes
      console.log("Key state changed. Checked:", this.KeyisChecked);
      if (this.KeyisChecked === true) {
        console.log("Key checked");
        tagobj.tags.key = true;
      } else {
        delete tagobj.tags.key;
      }
      },
      handleClassifiersCheckboxChange () {
      // This method will be called when the checkbox state changes
      console.log("Classifiers state changed. Checked:", this.ClassifiersisChecked);
      if (this.ClassifiersisChecked === true) {
        console.log("Classifiers checked");
        tagobj.tags.classifiers = true;
      } else {
        delete tagobj.tags.classifiers;
      }
      },
      addFiles(){
        this.$refs.files.click();
      },

      /*
        Submits files to the server
      */
      submitFiles(){
        /*
          Initialize the form data
        */
            if ((this.MusicnnisChecked === true) && (this.DiscogsEffnetisChecked === true)) {
                alert('Please select either Musicnn or Discogs-Effnet as the model to use');
                window.location.reload();
            }

    const FormData = require('form-data');
    const form = new FormData();

        tagobj = JSON.stringify(tagobj);

         //var model = JSON.stringify(tagobj)
        //formData.append('tagselection', model);
        form.append('tagselection', tagobj);
    //form.append('tagselection', tagobj, {
    //    contentType: 'application/json',
    //    name: 'tagselection',
    //    tagobj: tagobj,
    //});

        /*
          Iteate over any file sent over appending the files
          to the form data.

        for( var i = 0; i < this.files.length; i++ ){
          let file = this.files[i];

          formData.append('files[' + i + ']', file);
        }
        */
          var i = 0;
          let file = this.files[i];
          //formData.append('file', file);
          form.append('file', file);

        /*
          Make the request to the POST /select-files URL
        */
//      fetch( '/upload', {
//        method: 'POST',
//        body: form,
//      })
//        .then((response) => response.json())
//        .then((data) => console.log('Success:', data))
//        .catch((error) => console.error('Error:', error));

        axios.post( '/api/upload',
          //formData,
          form,
          {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
          }
        ).then(function(response){
          console.log('SUCCESS!!');
          console.log(response.data.id);
          console.log(response);
        //location.replace(response.request.responseURL);
        if (response.status == 200) {
                delay(response.data.id);
        }
         // alert('OK!!');
        })
        .catch(function(error){
          console.log('FAILURE!!');
          console.log(error);
          //alert('Something went wrong!!');
          alert(error.message);
          window.location.reload();
        })
      },
      /*
        Handles the uploading of files
      */
      handleFilesUpload(){
        let uploadedFiles = this.$refs.files.files;

        /*
          Adds the uploaded file to the files array
        */
        for( var i = 0; i < uploadedFiles.length; i++ ){
          this.files.push( uploadedFiles[i] );
        }
      },

      /*
        Removes a select file the user has uploaded
      */
      removeFile( key ){
        this.files.splice( key, 1 );
      }
    }
  }
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const delay = async (id) => {
  await sleep(1000)
  console.log("First")
  await sleep(1000)
  console.log("Second")
  await sleep(3000)
  console.log("Third")
location.replace("/status/" + id);
}
</script>
