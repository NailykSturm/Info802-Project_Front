<script>
import { defineComponent, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useJourneyStore } from "../stores/journeyStore";
import { useMapStore } from "../stores/mapStore";

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
        var lineGeoJSON = [{
            "type": "LineString",
            "coordinates": [[b8c[1], b8c[0]], [home[1], home[0]]],
        }, {
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
            mapDivStore,
            b8c,
            home,
            markers,
            lineGeoJSON,
            x,
            y,
            showPopover,
            useLocation: b8c,
            mapDiv,
        }
    }, methods: {
        setupLeafletMap: function () {
            var journeyGeoJson = null;
            this.mapDiv = L.map("mapContainer").setView(this.useLocation, 12);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.mapDiv);
            // L.geoJSON(this.lineGeoJSON, { style: { "color": "#A512B7" } }).addTo(this.mapDiv);

            this.mapDiv.on('click', this.onMapClick);
            this.mapDiv.on('zoomstart', () => {
                if (this.markers.length > 0) {
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

            watch(this.mapDivStore.geojson, (newGeojson) => {
                console.log("Geojson changed");
                if (journeyGeoJson != null) {
                    this.mapDiv.removeLayer(journeyGeoJson);
                }
                journeyGeoJson = L.geoJSON(newGeojson, { style: { "color": "#0000FF" } }).addTo(this.mapDiv);
            })

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
        },
    }, mounted() {
        this.setupLeafletMap();
    },

});
</script>

<template>
    <div id="mapContainer"></div>
    <n-popover :show="showPopover" :x="x" :y="y" trigger="manual">
        Vous avez cliqué sur la carte à [{{ x }},{{ y }}]<br>
        Que vouliez-vous faire ?
    </n-popover>
</template>

<style scoped>
#mapContainer {
    width: 60vw;
    height: 100vh;
}
</style>