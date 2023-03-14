<script>
import { defineComponent, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import axios from 'axios';

import { useJourneyStore } from '../stores/journeyStore';
import { MAP_API_KEY } from '../env.js';

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

        const startInput = ref(null);
        const endInput = ref(null);

        const countryCodeList = ref([
            {
                'key': 'default',
                'label': 'Sélectionnez un pays',
                'value': null
            }
        ]);

        const CCL = ref([]);
        axios.get('https://restcountries.com/v3.1/all')
            .then((data) => {
                for (let country of data.data) {
                    CCL.value.push(country)
                    countryCodeList.value.push({
                        'label': country.name.common + ' (' + country.cca2 + ')',
                        'value': country.cca2
                    });
                }
            }).catch((err) => {
                console.log(err);
            });

        const cityList = ref([
            {
                'key': 'default',
                'label': 'Sélectionnez une ville',
                'value': null,
                'info': {
                    'city': 'none',
                    'country': 'none',
                    'coord': [],
                }
            }
        ]);
        const showCityListStart = ref(false);
        const showCityListEnd = ref(false);
        function handleSelectCountryCode(value) {
            CCL.value.find((country) => {
                country.cca2 === value ? journey.journey.value.find((step) => { step.countryCode === value ? step.coord = country.latlng : null; }) : null;
            });
        }
        function handleSelectCity(key, value) {
            console.log('poulet');
            console.log(key);
            console.log(value);
            var step = value.info.step;
            console.log(step);

            if (step === 'start') {
                journey.start.value.location = value.info.city;
                journey.start.value.country = value.info.country;
                journey.start.value.coord = value.info.coord;
                showCityListStart.value = false;
                startInput.value?.blur();
            } else if (step === 'end') {
                journey.end.value.location = value.info.city;
                journey.end.value.country = value.info.country;
                journey.end.value.coord = value.info.coord;
                showCityListEnd.value = false;
                endInput.value?.blur();
            }
        }
        function handleKeyUp(key, step) {
            if (key.code === 'Enter') {
                var citySearch = "";
                var countryCodeSearch = "";
                if (step === 'start') {
                    citySearch = journey.start.value.location;
                    countryCodeSearch = journey.start.value.countryCode;
                } else if (step === 'end') {
                    citySearch = journey.end.value.location;
                    countryCodeSearch = journey.end.value.countryCode;
                }

                axios.get(`https://api.openrouteservice.org/geocode/autocomplete?api_key=${MAP_API_KEY}&text=${citySearch}${countryCodeSearch != '' ? '&boundary.country=' + countryCodeSearch : ''}`)
                    .then((data) => {
                        console.log(data);
                        cityList.value = [];
                        for (let feature of data.data.features) {
                            if(!cityList.value.find((city) => { return city.key === feature.properties.label })){
                                cityList.value.push({
                                    'key': feature.properties.label,
                                    'label': feature.properties.label,
                                    'value': feature.geometry.coordinates,
                                    'info': {
                                        'city': feature.properties.name,
                                        'country': feature.properties.country,
                                        'coord': feature.geometry.coordinates,
                                        'step': step,
                                    }
                                });
                            }
                        }
                    }).catch((err) => {
                        console.log(err);
                    });

                if (step === 'start') {
                    showCityListStart.value = true;
                } else if (step === 'end') {
                    showCityListEnd.value = true;
                }
            }
        }
        function handleBlur(key, step) {
            if (step === 'start') {
                showCityListStart.value = false;
            } else if (step === 'end') {
                showCityListEnd.value = false;
            }
        }
        return {
            journeyStore,
            journey,
            startInput,
            endInput,
            countryCodeList,
            CCL,
            cityList,
            showCityListStart,
            showCityListEnd,
            addStep,
            search,
            handleSelectCountryCode,
            handleSelectCity,
            handleKeyUp,
            handleBlur,
        };
    }
});

</script>

<template>
    <!-- <n-space> -->
    <!-- <n-space> -->
    <n-dropdown :show="showCityListStart" :options="cityList" @select="handleSelectCity">
        <n-input ref="startInput" v-model:value="journey.start.value.location" type="text" placeholder="Ville de départ"
            @keyup="handleKeyUp($event, 'start')" @blur="handleBlur($event, 'start')" />
    </n-dropdown>
    <n-select v-model:value="journey.start.value.countryCode" filterable :options="countryCodeList"
        @update:value="handleSelectCountryCode" />
    <!-- </n-space> -->
    <!-- <n-space> -->
    <n-dropdown :show="showCityListEnd" :options="cityList" @select="handleSelectCity">
        <n-input ref="endInput" v-model:value="journey.end.value.location" type="text" placeholder="Ville d'arrivée"
            @keyup="handleKeyUp($event, 'end')" @blur="handleBlur($event, 'end')" />
    </n-dropdown>
    <n-select v-model:value="journey.end.value.countryCode" filterable :options="countryCodeList"
        @update:value="handleSelectCountryCode" />
    <!-- </n-space> -->

    <n-space>
        <n-button @click="addStep" secondary type="warning">Ajouter un étape</n-button>
        <n-button @click="search" secondary type="info">Rechercher</n-button>
    </n-space>
    <!-- </n-space> -->
</template>