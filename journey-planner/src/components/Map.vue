<script>
import { defineComponent } from "vue";
import { NButton } from "naive-ui";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MAP_API_KEY } from "../env.js";

export default defineComponent({
    name: "Map",
    data() {
        const b8c = [45.641393, 5.868942];
        const home = [45.551448, 5.941976];
        return {
            b8c,
            home,
            useLocation: b8c,
            mapDiv: null,
        }
    },
    methods: {
        setupLeafletMap: function () {
            this.mapDiv = L.map("mapContainer").setView(this.useLocation, 20);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.mapDiv);
            this.mapDiv.on('click', this.onMapClick);
        },
        onMapClick: function (e) {
            console.log(e)
            console.log(`You clicked the map at ${e.latlng}`);
        },
        switchDestination: function () {
            console.log("Switching destination");
            console.log(`before switch: ${this.useLocation}`)
            if (this.useLocation === this.b8c) {
                this.useLocation = this.home;
            } else {
                this.useLocation = this.b8c;
            }
            console.log(`after switch: ${this.useLocation}`)
            this.mapDiv.setView(this.useLocation, 20);
        }
    },
    mounted() {
        this.setupLeafletMap();
    },
    components(){
        return {
            NButton,
        }
    }
});
</script>

<template>
    <button @click="switchDestination">Switch</button>
    <div id="container">
        <div id="mapContainer"></div>
    </div>
</template>

<style scoped>
#mapContainer {
    width: 80vw;
    height: 100vh;
}
</style>