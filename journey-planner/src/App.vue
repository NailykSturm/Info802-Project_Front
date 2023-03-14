<script setup>
import Map from './components/Map.vue';
import JourneyForm from './components/JourneyForm.vue';
import JourneyList from './components/JourneyList.vue';
import CarForm from './components/CarForm.vue';
</script>

<template>
  <main>
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
    </n-message-provider>
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