<script>
import { defineComponent } from 'vue';

import { useJourneyStore } from '../stores/journeyStore';

export default defineComponent({
    name: 'JourneyForm',
    setup() {
        const journeyStore = useJourneyStore();
        return {
            journeyStore,
        };
    }
});

</script>

<template>
    {{ journeyStore.journey }}
    
</template>