import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useJourneyStore = defineStore("journeyStore", () => {
    const journey = ref([
        {
            "step": "start",
            "location": null,
            "countryCode": "",
            "coord": [],
        },
        {
            "step": "end",
            "location": null,
            "countryCode": "",
            "coord": [],
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
                "step": "start",
                "location": null,
                "countryCode": "",
                "coord": [],
            },
            {
                "step": "end",
                "location": null,
                "countryCode": "",
                "coord": [],
            },
        ];
    }

    const start = computed(() => {
        let res = null;
        journey.value.forEach(step => {
            if (step.step === "start") {
                res = step;
            };
        });
        return res;
    });
    const end = computed(() => {
        let res = null;
        journey.value.forEach(step => {
            if (step.step === "end") {
                res = step;
            };
        })
        return res;
    });

    return {
        journey,
        start,
        end,
        addStep,
        removeStep,
        clearJourney,
    }
})