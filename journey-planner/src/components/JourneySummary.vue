<script>
import { defineComponent, computed } from 'vue';

import { useJourneyStore } from '../stores/journeyStore';
import { useMapStore } from '../stores/mapStore';

export default defineComponent({
    setup() {
        const journeyStore = useJourneyStore()
        const mapStore = useMapStore()

        const displayTime = (time) => {
            if (time != undefined) {
                var sec_num = parseInt(time, 10); // don't forget the second param
                var hours = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds = sec_num - (hours * 3600) - (minutes * 60);

                if (hours < 10) { hours = "0" + hours; }
                if (minutes < 10) { minutes = "0" + minutes; }
                if (seconds < 10) { seconds = "0" + seconds; }
                return hours + ':' + minutes + ':' + seconds;
            } else {
                return "Veuillez sélectionner votre trajet"
            }
        }

        return {
            journeyStore,
            mapStore,
            displayTime,
        };
    },
});
</script>

<template>
    <n-progress type="line" :percentage="journeyStore.calcJourneyPersentage" :indicator-placement="'inside'"
        status="success" />
    <!-- {{ mapStore.geojson }}<br> -->
    <n-text>Temps de trajet total : {{ displayTime(journeyStore.timeTravel.totalTime) }}</n-text>
    <div style="overflow: auto">
        <n-timeline horizontal>
            <n-timeline-item type="info" title="Départ" :content="journeyStore.start.location" />
            <n-timeline-item type="success" v-for="time in journeyStore.timeTravel.detailedTime"
                title="Arret recharge batterie"
                :content="'trajet : ' + displayTime(time.travel) + ' | recharge = ' + displayTime(time.recharge)" />
            <n-timeline-item type="info" title="Arrivée" :content="journeyStore.end.location" />
        </n-timeline>
    </div>
</template>