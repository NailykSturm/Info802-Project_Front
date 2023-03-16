<script>
import { defineComponent, ref } from 'vue';
import { Car } from '@vicons/ionicons5';
import { useMessage } from 'naive-ui';
import { request, GraphQLClient } from 'graphql-request';

import { useJourneyStore } from '../stores/journeyStore';
import { CHARGETRIP_API_HEADERS } from '../env';
import { carQuery, getCarDetailsQuery } from '../queries/queries';

export default defineComponent({
    setup() {
        const journeyStore = useJourneyStore();
        const msg = useMessage();
        
        const carList = ref([]);
        const graphQLClient = new GraphQLClient('https://api.chargetrip.io/graphql', {
            headers: CHARGETRIP_API_HEADERS,
        });

        const searchCar = ref('');
        function getCar() {
            graphQLClient.request(carQuery, {
                page: 1,
                size: 10,
                search: searchCar.value,
            }).then((data) => {
                console.log(data);
                carList.value = data.vehicleList;
            }).catch((err) => {
                console.log(err);
            });
        }

        const displayDrawer = ref(false);
        function handleCarButton() {
            displayDrawer.value = !displayDrawer.value;
        }

        function handleSelectCar(car) {
            graphQLClient.request(getCarDetailsQuery, {
                vehicleId: car.id,
            }).then((data) => {
                console.log(data);
                journeyStore.car = data.vehicle;
                displayDrawer.value = false;
                msg.info(`Vous avez sélectionner la voiture de chez ${journeyStore.car.naming.make} modèle ${journeyStore.car.naming.model}`);
            }).catch((err) => {
                console.log(err);
            });
        }
        function handleKeyup(key){
            if(key.code == 'Enter' || key.code == 'NumpadEnter'){
                getCar()
            }
        }
        return {
            carList,
            displayDrawer,
            searchCar,
            handleCarButton,
            getCar,
            handleSelectCar,
            handleKeyup,
        }
    },
    components: {
        Car,
    },
})
</script>

<template>
    <n-button secondary circle @click="handleCarButton" class="fixed"><template #icon>
            <Car />
        </template></n-button>
    <n-drawer v-model:show="displayDrawer" width="40%">
        <n-drawer-content>
            <n-card v-for="car in carList" @click="handleSelectCar(car)" :title="car.naming.model">
                <template #header-extra>
                    {{ car.naming.make }}
                </template>
                <template #cover>
                    <n-image :src="car.media.image.thumbnail_url"/>
                </template>
                Charge utilisable de la batterie: {{ car.battery.usable_kwh }} kWh<br>
                {{ car.routing.fast_charging_support ? "Supporte la charge rapide" : "Ne supporte pas la charge rapide" }}
            </n-card>
            <template #footer>
                <n-input placeholder="Rechercher voiture" v-model:value="searchCar" @keyup="handleKeyup($event)"/>
                <n-button secondary type="success" @click="getCar">Chercher voiture</n-button>
            </template>
        </n-drawer-content>
    </n-drawer>
</template>

<style scoped>
.fixed {
    position: fixed;
    top: 5%;
    right: 5%;
    z-index: 50;
    color: #a11010;
    background-color: #111010;
}

.fixed:hover {
    color: #da4615;
    background-color: #111010;
}
</style>