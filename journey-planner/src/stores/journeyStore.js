import { ref } from "vue";
import { defineStore } from "pinia";

export const useJourneyStore = defineStore("journeyStore", () => {
    const journey = ref([
        {
            "step":"start",
            "location": null,
        },
        {
            "step":"end",
            "location": null,
        },
    ]);

    const addStep = (stepNo, stepInfo) => {
        journey.value.splice(stepNo, 0, stepInfo);
    }

    const removeStep = (stepNo) => {
        journey.value.splice(stepNo, 1);
    }

    const clearJourney = () => {
        journey.value = [
            {
                "step":"start",
                "location": null,
            },
            {
                "step":"end",
                "location": null,
            },
        ];
    }

    return {
        journey,
        addStep,
        removeStep,
        clearJourney,
    }
})