<script setup>
import Map from './components/Map.vue'
import JourneyForm from './components/JourneyForm.vue'
import JourneyList from './components/JourneyList.vue'
</script>

<template>
  <main>
    <n-message-provider>
      <Map />
      <JourneyForm />
      <JourneyList />
    </n-message-provider>
  </main>
</template>
