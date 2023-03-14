<script>
import { defineComponent, ref } from 'vue';
import { Car } from '@vicons/ionicons5';
import { useQuery, gpl } from '@apollo/client';

import { useJourneyStore } from '../stores/journeyStore';

export default defineComponent({
    setup() {
        const journeyStore = useJourneyStore();
        const carList = ref([]);

        const displayDrawer = ref(false);
        function handleCarButton() {
            displayDrawer.value = !displayDrawer.value;
        }

        const getCar = qgl`
            query vehicleList($page: Int, $size: Int, $search: String) {
                vehicleList(
                    page: $page, 
                    size: $size, 
                    search: $search, 
                ) {
                    id
                    naming {
                        make
                        model
                        chargetrip_version
                    }
                    media {
                        image {
                            thumbnail_url
                        }
                    }
                }
            }
        `;
        function handlerGetCar(){
            console.log('poulet');
            const { loading, error, data } = useQuery(getCar);

            if (loading) return 'Loading...';
            if (error) return `Error! ${error.message}`;

            carList.value = data.vehicleList;
            console.log(carList.value);
        }

        return {
            carList,
            displayDrawer,
            handleCarButton,
            handlerGetCar,
        }
    },
    components: {
        Car,
    },
})
</script>

<template>
    <n-button secondary circle @click="handleCarButton"><template #icon>
            <Car />
        </template></n-button>
    <n-drawer v-model:show="displayDrawer" width="40%">
        {{ handlerGetCar() }}
        <n-drawer-content v-for="car in carList">
            <n-card>
                {{ car }}
            </n-card>
        </n-drawer-content>
    </n-drawer>
</template>

<style scoped>
.n-button {
    position: fixed;
    top: 5%;
    right: 5%;
    z-index: 50;
    color: #a11010;
    background-color: #111010;
}

.n-button:hover {
    color: #da4615;
    background-color: #111010;
}
</style>