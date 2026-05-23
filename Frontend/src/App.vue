<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import ToastNotification from './components/layout/ToastNotification.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
onMounted(() => { authStore.checkAuth() })
</script>

<template>
  <RouterView />
  <ToastNotification />
</template>

<style scoped>
</style>
