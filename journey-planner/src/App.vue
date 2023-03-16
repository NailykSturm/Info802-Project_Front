<script setup>
import { ref } from 'vue';
import { lightTheme, darkTheme } from 'naive-ui';

import Map from './components/Map.vue';
import JourneyForm from './components/JourneyForm.vue';
import JourneyList from './components/JourneyList.vue';
import CarForm from './components/CarForm.vue';
import JourneySummary from './components/JourneySummary.vue';

const theme = ref(darkTheme);
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDarkMode) {
  theme.value = darkTheme
} else {
  theme.value = lightTheme
}
</script>

<template>
  <main>
    <n-config-provider :theme="theme">
      <n-loading-bar-provider>
        <n-message-provider>
          <CarForm />
          <div class="flex">
            <div class="map">
              <Map />
            </div>
            <n-space vertical class="forms">
              <JourneyForm />
              <JourneyList />
            </n-space>
          </div>
          <JourneySummary />
        </n-message-provider>
      </n-loading-bar-provider>
    </n-config-provider>
  </main>
</template>

<style scoped>
.flex {
  display: flex;
  flex-direction: row;
}

.map {
  /* width: 70%; */
  padding-right: 1%;
}

.forms {
  width: 30%;
}
</style>