<script>
import { defineComponent, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useJourneyStore } from "../stores/journeyStore";
import { useMapStore } from "../stores/mapStore";
import { MAP_API_KEY } from "../env.js";

export default defineComponent({
    name: "Map",
    setup() {
        const journeyStore = useJourneyStore();
        const journey = storeToRefs(journeyStore, "journey");
        const mapStore = useMapStore();

        const mapDivStore = storeToRefs(mapStore, "mapDiv");
        const mapDiv = mapDivStore.mapDiv;
        const b8c = [45.641393, 5.868942];
        const home = [45.551363, 5.941973];
        const middle = [b8c[0] + (home[0] - b8c[0]) / 2, b8c[1] + (home[1] - b8c[1]) / 2];
        var b8cMarker;
        var homeMarker;
        var lineGeoJSON = [{
            "type": "LineString",
            "coordinates": [[b8c[1], b8c[0]], [home[1], home[0]]],
        },{
            "type": "LineString",
            "coordinates": [[-180, 0], [180, 0]],
        }, {
            "type": "LineString",
            "coordinates": [[0, -90], [0, 90]],
        }, {
            "type": "LineString",
            "coordinates": [[-180, 90], [180, 90]],
        }, {
            "type": "LineString",
            "coordinates": [[180, -90], [-180, -90]],
        }, {
            "type": "LineString",
            "coordinates": [[180, 90], [180, -90]],
        }, {
            "type": "LineString",
            "coordinates": [[-180, 90], [-180, -90]],
        }];
        const x = ref(0);
        const y = ref(0);
        const showPopover = ref(false);

        const markers = ref([]);

        return {
            journey,
            b8c,
            home,
            middle,
            b8cMarker,
            homeMarker,
            markers,
            lineGeoJSON,
            x,
            y,
            showPopover,
            useLocation: middle,
            mapDiv,
        }
    }, methods: {
        setupLeafletMap: function () {
            this.mapDiv = L.map("mapContainer").setView(this.useLocation, 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.mapDiv);
            L.geoJSON(this.lineGeoJSON, { style: { "color": "#A512B7" } }).addTo(this.mapDiv);
            this.b8cMarker = L.marker(this.b8c).addTo(this.mapDiv);
            this.homeMarker = L.marker(this.home).addTo(this.mapDiv);

            this.mapDiv.on('click', this.onMapClick);
            this.mapDiv.on('zoomstart', () => {
                if(this.markers.length > 0){
                    this.markers.forEach((marker) => {
                        this.mapDiv.removeLayer(marker);
                    });
                }
            });
            this.mapDiv.on('zoomend', () => {
                this.markers = [];
                for (let step of this.journey.journey.value) {
                    if (step.coord.length > 0) {
                        this.markers.push(L.marker([step.coord[1], step.coord[0]]).addTo(this.mapDiv));
                    }
                }
            });

            watch(this.journey.journey, (newJourney) => {
                console.log("Journey changed");
                if (this.markers.length > 0) {
                    this.markers.forEach((marker) => {
                        this.mapDiv.removeLayer(marker);
                    });
                }
                this.markers = [];
                for (let step of newJourney) {
                    if (step.coord.length > 0) {
                        this.markers.push(L.marker([step.coord[1], step.coord[0]]).addTo(this.mapDiv));
                    }
                }
            }, { deep: true });

        }, onMapClick: function (e) {
            // console.log(e)
            console.log(`You clicked the map at ${e.latlng}`);
            this.x = e.layerPoint.x;
            this.y = e.layerPoint.y;
            this.showPopover = true;
            setTimeout(() => {
                this.showPopover = false;
            }, 3000);
        }, switchDestination: function () {
            if(this.markers.length == 0){
                if (this.useLocation === this.b8c) {
                    this.useLocation = this.home;
                } else if (this.useLocation === this.home) {
                    this.useLocation = this.middle;
                } else {
                    this.useLocation = this.b8c;
                }
            } else {
                console.log(this.markers[0])
                if (this.useLocation === this.b8c) {
                    this.useLocation = this.markers[0]._latlng;
                } else if (this.useLocation === this.markers[0]._latlng) {
                    this.useLocation = this.markers[1]._latlng;
                } else {
                    this.useLocation = this.b8c;
                }
            }
            this.mapDiv.setView(this.useLocation, 10);
        }, findTravel: function () {
            axios.post(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
                "coordinates": [[this.b8c[1], this.b8c[0]], [this.home[1], this.home[0]]],
            }, {
                headers: {
                    Authorization: MAP_API_KEY,
                }
            }).then((data) => {
                console.log(data);
                var travelGeoJSON = data.data;
                L.geoJSON(travelGeoJSON, { style: { "color": "#B5B512" } }).addTo(this.mapDiv);
            }).catch((err) => {
                console.log(err);
            })
        },
    }, mounted() {
        this.setupLeafletMap();
    },

});
</script>

<template>
    <button @click="switchDestination">Switch</button>
    <button @click="findTravel">Find travel between b8c et home</button>
    <div id="container">
        <div id="mapContainer"></div>
    </div>
    <n-popover :show="showPopover" :x="x" :y="y" trigger="manual">
        Vous avez cliqué sur la carte à [{{ x }},{{ y }}]<br>
        Que vouliez-vous faire ?
    </n-popover>
</template>

<style scoped>
#mapContainer {
    width: 80vw;
    height: 100vh;
}
</style>