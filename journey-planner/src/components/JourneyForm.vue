<script>
import { defineComponent, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import axios from 'axios';

import { useJourneyStore } from '../stores/journeyStore';

export default defineComponent({
    name: 'JourneyForm',
    setup() {
        const msg = useMessage();
        const journeyStore = useJourneyStore();
        const journey = storeToRefs(journeyStore, 'journey');
        const addStep = () => {
            msg.warning('Not implemented yet :('
                + 'add Stap on journey');
        };
        const search = () => {
            msg.warning('Not implemented yet :('
                + 'search journey');
        };

        const countryCodeList = ref([
            {
                'label': 'Sélectionnez un pays',
                'value': null
            }
        ]);

        const CCL = ref([]);
        axios.get('https://restcountries.com/v3.1/all')
            .then((data) => {
                for( let country of data.data) {
                    CCL.value.push(country)
                    countryCodeList.value.push({
                        'label': country.name.common + ' (' + country.cca2 + ')',
                        'value': country.cca2
                    });
                }
            }).catch((err) => {
                console.log(err);
            });
        return {
            journeyStore,
            journey,
            countryCodeList,
            CCL,
            addStep,
            search,
        };
    }
});

</script>

<template>
    journey : {{ journey.journey }}<br>
    start : {{ journey.start }}<br>
    end : {{ journey.end }}<br>
    <!-- <n-space> -->
    <!-- <n-space> -->
    <n-input v-model:value="journey.journey.value[0].location" type="text" placeholder="Ville de départ" />
    <n-select v-model:value="journey.journey.value[0].countryCode" filterable :options="countryCodeList" />
    <!-- </n-space> -->
    <!-- <n-space> -->
    <n-input v-model:value="journey.journey.value[1].location" type="text" placeholder="Ville d'arrivée" />
    <n-select v-model:value="journey.journey.value[1].countryCode" filterable :options="countryCodeList" />
    <!-- </n-space> -->

    <n-space>
        <n-button @click="addStep" secondary type="warning">Ajouter un étape</n-button>
        <n-button @click="search" secondary type="info">Rechercher</n-button>
    </n-space>
    <!-- </n-space> -->
</template>