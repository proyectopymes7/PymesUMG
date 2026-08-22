<script setup>
import { ref } from 'vue'
import LocationPicker from '../components/shared/LocationPicker.vue'

const location = ref({})
</script>

<template>
  <div style="max-width: 600px; margin: 40px auto; padding: 0 20px;">
    <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Prueba temporal de mapa</h1>
    <LocationPicker v-model="location" />
    <pre style="margin-top: 16px; background: #f1f1f1; padding: 12px; font-size: 12px;">{{ location }}</pre>
  </div>
</template>
