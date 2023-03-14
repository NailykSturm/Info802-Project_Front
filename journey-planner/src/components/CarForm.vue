<script>
import { defineComponent, ref } from 'vue';
import { Car } from '@vicons/ionicons5';
import { request, GraphQLClient } from 'graphql-request';

import { useJourneyStore } from '../stores/journeyStore';
import { CHARGETRIP_API_HEADERS } from '../env';
import { carQuery, getCarDetailsQuery } from '../queries/queries';

export default defineComponent({
    setup() {
        const journeyStore = useJourneyStore();
        
        const carList = ref([]);
        const graphQLClient = new GraphQLClient('https://api.chargetrip.io/graphql', {
            headers: CHARGETRIP_API_HEADERS,
        });

        function getCar() {
            graphQLClient.request(carQuery, {
                page: 1,
                size: 10,
                search: 'tesla',
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
                journeyStore.journey.car = data.vehicle;
            }).catch((err) => {
                console.log(err);
            });
        }

        return {
            carList,
            displayDrawer,
            handleCarButton,
            getCar,
            handleSelectCar,
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
            <n-card v-for="car in carList" @click="handleSelectCar(car)">
                {{ car }}
            </n-card>
            <template #footer>
                <n-button @click="getCar">Chercher voiture</n-button>
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