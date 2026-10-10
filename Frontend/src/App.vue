<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ToastNotification from './components/layout/ToastNotification.vue'
import ChatWidget from './components/chat/ChatWidget.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()

// El asistente del directorio vive en las páginas públicas; detalle y mi-negocio tienen el suyo
// Lo que Chapi escribe en el botón según cómo llegó
const chapiIntro = {
  late: ['¡Perdón, se me hizo tarde!', '¿En qué te puedo ayudar?'],
  swing: ['¡Chapi al rescate!', '¿En qué te puedo ayudar?'],
  kite: ['¡Qué buen viento hoy!', '¿En qué te puedo ayudar?'],
  volcano: ['Uf… qué calorcito', '¿En qué te puedo ayudar?'],
  default: ['¿En qué te puedo ayudar?']
}

const showDirectoryChat = computed(() => ['home', 'directory', 'blog'].includes(route.name))
onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <RouterView />
  <ToastNotification />
  <ChatWidget
    v-if="showDirectoryChat"
    mode="directorio"
    :intro-lines="chapiIntro"
    :suggestions="['¿Dónde puedo comer algo rico?', '¿Qué negocios están abiertos ahora?', 'Busco un regalo artesanal', '¿Qué categorías hay?']"
  />
</template>

<style scoped>
</style>
