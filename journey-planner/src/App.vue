<script setup>
import Map from './components/Map.vue'
import JourneyForm from './components/JourneyForm.vue'
</script>

<template>
  <main>
    <n-message-provider>
      <Map />
      <JourneyForm />
    </n-message-provider>
  </main>
</template>
