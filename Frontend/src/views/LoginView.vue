<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { googleSdkLoaded } from 'vue3-google-login'
import api from '../services/api'

const authStore = useAuthStore()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

// ── Recuperar contraseña ────────────────────────────────
const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotLoading = ref(false)
const forgotSuccess = ref(false)
const forgotError = ref('')

const handleForgotPassword = async () => {
  forgotError.value = ''
  if (!forgotEmail.value.trim()) {
    forgotError.value = 'Ingresa tu correo electrónico'
    return
  }
  forgotLoading.value = true
  try {
    await api.post('/auth/forgot-password', { correo: forgotEmail.value.trim() })
    forgotSuccess.value = true
  } catch (e) {
    forgotError.value = e.response?.data?.error || 'Error al enviar el correo'
  } finally {
    forgotLoading.value = false
  }
}

const backToLogin = () => {
  showForgotPassword.value = false
  forgotEmail.value = ''
  forgotSuccess.value = false
  forgotError.value = ''
}

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

const handleTraditionalLogin = async () => {
  errorMessage.value = ''
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Por favor, ingresa tu correo o usuario y contraseña.'
    return
  }

  isSubmitting.value = true
  const success = await authStore.loginWithEmail(identifier.value, password.value)
  isSubmitting.value = false

  if (success) {
    window.location.href = '/'
  } else {
    errorMessage.value = authStore.error || 'Credenciales inválidas'
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
  <!-- Contenedor raíz: fondo fijo con la imagen del volcán -->
  <div class="relative min-h-screen">

    <!-- Fondo fijo — no se mueve al hacer scroll -->
    <div
      class="fixed inset-0 z-0"
      style="
        background-image: url('https://pymesadmin.blob.core.windows.net/imagenes/4605ae9d-4213-4df7-abe7-f3f1fb86c21c.webp');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      "
    >
      <!-- Overlay oscuro para que el formulario sea legible -->
      <div class="absolute inset-0 bg-black/50"></div>
    </div>

    <!-- Contenido scrolleable — el panel de login se mueve, el fondo no -->
    <div class="relative z-10 min-h-screen pt-24 pb-12 flex items-center justify-center px-6">

      <div class="w-full max-w-md mx-auto">
        <div class="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 md:p-10 relative overflow-hidden">

          <!-- ═══ VISTA: LOGIN NORMAL ═══ -->
          <div v-if="!showForgotPassword">

            <!-- Header -->
            <div class="text-center mb-10">
              <div class="w-16 h-16 bg-fiery-red rounded-2xl flex items-center justify-center shadow-lg shadow-fiery-red/20 mx-auto mb-6 rotate-3">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h1 class="text-2xl md:text-3xl font-black text-fiery-navy tracking-tight font-outfit uppercase mb-2">
                Bienvenido de <span class="text-fiery-red">vuelta</span>
              </h1>
              <p class="text-slate-500 text-sm font-medium">Inicia sesión para continuar</p>
            </div>

            <!-- Error -->
            <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleTraditionalLogin" class="space-y-5 mb-8">
              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Nombre de Usuario</label>
                <div class="relative">
                  <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input
                    v-model="identifier"
                    type="text"
                    required
                    autocomplete="username"
                    class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl pl-9 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                    placeholder="mi_usuario"
                  >
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2 ml-1">
                  <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider">Contraseña</label>
                  <button
                    type="button"
                    @click="showForgotPassword = true"
                    class="text-xs font-bold text-fiery-red hover:text-fiery-darkred transition-colors"
                  >¿Olvidaste tu contraseña?</button>
                </div>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                    placeholder="••••••••"
                  >
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                    <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  </button>
                </div>
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
                <span v-else>Iniciar Sesión</span>
              </button>
            </form>

            <!-- Divider -->
            <div class="relative flex items-center justify-center mb-8">
              <div class="absolute w-full h-px bg-slate-200"></div>
              <span class="relative bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest">o continúa con</span>
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
                ¿No tienes cuenta? <RouterLink to="/register" class="text-fiery-red font-black hover:underline ml-1">Regístrate</RouterLink>
              </p>
            </div>

          </div>

          <!-- ═══ VISTA: RECUPERAR CONTRASEÑA ═══ -->
          <div v-else>

            <!-- Header -->
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-fiery-navy rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h1 class="text-2xl font-black text-fiery-navy tracking-tight font-outfit uppercase mb-2">
                Recuperar <span class="text-fiery-red">Contraseña</span>
              </h1>
              <p class="text-slate-500 text-sm font-medium">Te enviaremos un enlace a tu correo</p>
            </div>

            <!-- Éxito -->
            <div v-if="forgotSuccess" class="text-center space-y-4">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <p class="text-slate-700 font-bold text-sm">¡Correo enviado!</p>
              <p class="text-slate-500 text-xs">Revisa tu bandeja de entrada y sigue las instrucciones. El enlace expira en 1 hora.</p>
              <button @click="backToLogin" class="w-full bg-fiery-navy text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:opacity-80 transition-opacity">
                Volver al inicio de sesión
              </button>
            </div>

            <!-- Formulario -->
            <div v-else class="space-y-5">
              <div v-if="forgotError" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm font-medium text-red-800">{{ forgotError }}</p>
              </div>

              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                <input
                  v-model="forgotEmail"
                  type="email"
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="tu@correo.com"
                  @keyup.enter="handleForgotPassword"
                >
              </div>

              <button
                @click="handleForgotPassword"
                :disabled="forgotLoading"
                class="w-full bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                <svg v-if="forgotLoading" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span v-else>Enviar enlace</span>
              </button>

              <button @click="backToLogin" class="w-full text-slate-400 hover:text-fiery-navy text-xs font-bold uppercase tracking-widest transition-colors py-2">
                ← Volver al inicio de sesión
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>