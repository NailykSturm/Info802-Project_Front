<script>
import { defineComponent, ref} from "vue";
import { storeToRefs } from "pinia";

import { useJourneyStore } from "../stores/journeyStore";
import { useMapStore } from "../stores/mapStore";

export default defineComponent({
    name: "JourneyList",
    setup() {
        const journeyStore = useJourneyStore();
        const journey = storeToRefs(journeyStore, "journey");
        const mapStore = useMapStore();

        function handleCardSelected(journeyStep) {
            mapStore.mapDiv.setView([journeyStep.coord[1], journeyStep.coord[0]], 10);
        }
        return {
            journey,
            handleCardSelected,
        };
    },
});
</script>

<template>
    <n-card v-for="journeyStep in journey.journey.value" :title="journeyStep.location" @click="handleCardSelected(journeyStep)">
        <template #header-extra>{{ journeyStep.country }}</template>
        Étape {{ journeyStep.step == 'start' ? 'de départ' : journeyStep.step == 'end' ? 'd\'arrivée' : 'n°' + journeyStep.step + '/' + journey.journey.value.length }}
        <template #footer>Coordonnées : {{ journeyStep.coord }}</template>
    </n-card>
</template>

<style scoped>
.n-card {
    margin-top: 1%;
}
</style>