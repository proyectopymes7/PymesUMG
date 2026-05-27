<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { googleSdkLoaded } from 'vue3-google-login'

const authStore = useAuthStore()

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

let tokenClient = null

onMounted(() => {
  googleSdkLoaded((google) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '768418717547-p74uerpkpn09dcufaq7n6rbps39hjldr.apps.googleusercontent.com',
      scope: 'email profile',
      callback: handleGoogleToken,
      error_callback: () => { errorMessage.value = 'Error al autenticar con Google' }
    })
  })
})

const handleRegister = async () => {
  errorMessage.value = ''

  if (!nombre.value || !apellido.value || !email.value || !password.value) {
    errorMessage.value = 'Por favor, completa todos los campos.'
    return
  }

  isSubmitting.value = true
  const success = await authStore.register(nombre.value, apellido.value, email.value, password.value)
  isSubmitting.value = false

  if (success) {
    window.location.href = '/'
  } else {
    errorMessage.value = authStore.error || 'Error al registrar la cuenta'
  }
}

const handleGoogleToken = async ({ access_token }) => {
  errorMessage.value = ''
  try {
    isSubmitting.value = true
    const success = await authStore.loginWithGoogle(access_token)
    isSubmitting.value = false

    if (success) {
      window.location.href = '/'
    } else {
      errorMessage.value = authStore.error || 'Error de autenticación'
    }
  } catch (e) {
    isSubmitting.value = false
    errorMessage.value = 'Error de conexión: ' + e.message
  }
}

const loginWithGoogle = () => {
  if (!tokenClient) {
    errorMessage.value = 'Google no disponible aún, recarga la página.'
    return
  }
  tokenClient.requestAccessToken()
}
</script>

<template>
  <!-- Contenedor raíz: fondo fijo con la imagen de Antigua -->
  <div class="relative min-h-screen">

    <!-- Fondo fijo — no se mueve al hacer scroll -->
    <div
      class="fixed inset-0 z-0"
      style="
        background-image: url('/src/assets/AntiguaVolcan.webp');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      "
    >
      <!-- Overlay oscuro para legibilidad -->
      <div class="absolute inset-0 bg-black/50"></div>
    </div>

    <!-- Contenido scrolleable — solo el panel se mueve -->
    <div class="relative z-10 min-h-screen pt-24 pb-12 flex items-center justify-center px-6">

      <div class="w-full max-w-md mx-auto">
        <div class="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 md:p-10 relative overflow-hidden">

          <!-- Header -->
          <div class="text-center mb-10">
            <div class="w-16 h-16 bg-fiery-red rounded-2xl flex items-center justify-center shadow-lg shadow-fiery-red/20 mx-auto mb-6 rotate-3">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-fiery-navy tracking-tight font-outfit uppercase mb-2">
              Crea tu <span class="text-fiery-red">Cuenta</span>
            </h1>
            <p class="text-slate-500 text-sm font-medium">Únete a nuestra comunidad</p>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleRegister" class="space-y-5 mb-8">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Nombre</label>
                <input
                  v-model="nombre"
                  type="text"
                  required
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="Juan"
                >
              </div>
              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Apellido</label>
                <input
                  v-model="apellido"
                  type="text"
                  required
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="Pérez"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
              <input
                v-model="email"
                type="email"
                required
                class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                placeholder="tu@correo.com"
              >
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Contraseña</label>
              <input
                v-model="password"
                type="password"
                required
                class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                placeholder="••••••••"
              >
              <p class="text-[10px] text-slate-400 mt-2 ml-1">Mín. 8 caracteres, 1 mayúscula y 1 número</p>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <svg v-if="isSubmitting" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>Crear Cuenta</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative flex items-center justify-center mb-8">
            <div class="absolute w-full h-px bg-slate-200"></div>
            <span class="relative bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest">o regístrate con</span>
          </div>

          <!-- Google -->
          <button
            type="button"
            :disabled="isSubmitting"
            @click="loginWithGoogle"
            class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-fiery-navy py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <div class="mt-8 text-center">
            <p class="text-xs font-medium text-slate-500">
              ¿Ya tienes cuenta? <RouterLink to="/login" class="text-fiery-red font-black hover:underline ml-1">Inicia sesión</RouterLink>
            </p>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>