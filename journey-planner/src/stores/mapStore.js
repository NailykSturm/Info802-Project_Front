import { ref } from "vue";
import { defineStore } from "pinia";

export const useMapStore = defineStore("mapStore", () => {
    const mapDiv = ref(null);
    const geojson = ref(null);

    return {
        mapDiv,
        geojson,
    }
});