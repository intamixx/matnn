<template>
  <h1>Matnn Job Status</h1>
  <div>
<div>Job ID: {{id}}</div>
<div>{{statustext}}</div>

  </div>
</template>

<script setup>

</script>

<script>
import axios from 'axios';

export default {
  name: "Status",
  data() {
    return {
      id: this.$route.params.id,
      statustext: {},
      componentKey: 0,
    }
  },
  mounted: function() {
    this.updatestatus();
    setInterval(this.updatestatus, 5000);
  },
  methods: {
    updatestatus: function() {
    this.loadStatus();
    },
    loadStatus: function(){
const url = window.location.href;
const lastParam = url.split("/").slice(-1)[0];
console.log(lastParam);

      //axios.get("/api/status/" + lastParam).then(function(response) {
      axios.get("/api/status/" + lastParam).then((response) => {
        console.log("Hello");
        console.log(response);
        console.log(response.data.id);
        console.log(response.data.detail);
        console.log(response.status);
        this.statustext = response.data.detail;
        if (response.status == 200) {
                delay(response.data.id);
        }
      })

      .catch((response)=>{
        console.log("Something Went Wrong");
        console.log(response);
        this.statustext = response.request.response;
        //console.log(this.results);
      })
    },
  }
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const delay = async (id) => {
  await sleep(1000)
  console.log("First")
  await sleep(1000)
  console.log("Second")
  await sleep(3000)
  console.log("Third")
location.replace("/result/" + id);
}
</script>
