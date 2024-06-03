<template>
                <h1>Matnn Job Result</h1>
                <!-- <h4><%= id %> --- <%= status %></h4> -->
                <!-- <div id="h1_coverart"></div> -->
  <div>

<span v-if="resulttext">{{ resulttext }}</span>
<!--
        <span v-for="(msg, detail) in resulttext">
        <div>{{ detail }} - {{ msg }}</div>
        </span> -->
<div>ID: {{ jobresult.id }}</div>
<div>Audiofile: {{ jobresult.audiofile }}</div>
<br>
<div>Results:</div>
<span v-for="(value, name, index) in jobresult.result">
    <div>{{ name }} - {{ value }}</div>
</span>
<br>
<div>Started at: {{ jobresult.started_at }}</div>
<div>Completed at: {{ jobresult.completed_at }}</div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "Result",
  data() {
    return {
      id: this.$route.params.id,
      jobresult: {},
      resulttext: "",
    }
  },
  mounted: function() {
        this.loadResult();
  },
  methods: {
    loadResult: function(){
const url = window.location.href;
const lastParam = url.split("/").slice(-1)[0];
console.log(lastParam);

      axios.get("/api/result/" + lastParam).then((response) => {
        console.log("Hello");
        console.log(response);
        console.log(response.data.id);
        console.log(response.status);
        console.log(response.data.result);
        this.jobresult = response.data;
        this.id = response.data.id;
      })
      .catch((response)=>{
        console.log("Something Went Wrong");
        console.log(response);
        this.resulttext = response.request.response;
        //console.log(this.results);
      })
    },
  }
};

</script>
