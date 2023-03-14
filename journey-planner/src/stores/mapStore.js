import { ref } from "vue";
import { defineStore } from "pinia";

export const useMapStore = defineStore("mapStore", () => {
    const mapDiv = ref(null);

    return {
        mapDiv,
    }
});