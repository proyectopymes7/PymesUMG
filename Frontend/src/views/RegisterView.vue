<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { googleSdkLoaded } from 'vue3-google-login'

const authStore = useAuthStore()

const currentStep = ref(1)
const nombre = ref('')
const apellido = ref('')
const nombre_usuario = ref('')
const password = ref('')
const confirmPassword = ref('')
const email = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
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

const goToStep2 = () => {
  errorMessage.value = ''
  if (!nombre.value.trim() || nombre.value.trim().length < 2) {
    errorMessage.value = 'El nombre debe tener al menos 2 caracteres'
    return
  }
  if (!apellido.value.trim() || apellido.value.trim().length < 2) {
    errorMessage.value = 'El apellido debe tener al menos 2 caracteres'
    return
  }
  if (!nombre_usuario.value.trim()) {
    errorMessage.value = 'El nombre de usuario es requerido'
    return
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(nombre_usuario.value)) {
    errorMessage.value = 'El usuario solo puede tener letras, números y _ (3–30 caracteres)'
    return
  }
  currentStep.value = 2
}

const handleRegister = async () => {
  errorMessage.value = ''
  if (!password.value || password.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password.value)) {
    errorMessage.value = 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden'
    return
  }
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errorMessage.value = 'El correo ingresado no es válido'
    return
  }

  isSubmitting.value = true
  const success = await authStore.register(
    nombre.value,
    apellido.value,
    email.value || undefined,
    password.value,
    nombre_usuario.value
  )
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
    if (success) { window.location.href = '/' }
    else { errorMessage.value = authStore.error || 'Error de autenticación' }
  } catch (e) {
    isSubmitting.value = false
    errorMessage.value = 'Error de conexión: ' + e.message
  }
}

const loginWithGoogle = () => {
  if (!tokenClient) { errorMessage.value = 'Google no disponible aún, recarga la página.'; return }
  tokenClient.requestAccessToken()
}
</script>

<template>
  <div class="relative min-h-screen">
    <div class="fixed inset-0 z-0" style="background-image:url('https://pymesadmin.blob.core.windows.net/imagenes/4605ae9d-4213-4df7-abe7-f3f1fb86c21c.webp');background-size:cover;background-position:center;">
      <div class="absolute inset-0 bg-black/50"></div>
    </div>

    <div class="relative z-10 min-h-screen pt-24 pb-12 flex items-center justify-center px-6">
      <div class="w-full max-w-md mx-auto">
        <div class="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 md:p-10">

          <!-- Header -->
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-fiery-red rounded-2xl flex items-center justify-center shadow-lg shadow-fiery-red/20 mx-auto mb-5 rotate-3">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-fiery-navy tracking-tight font-outfit uppercase mb-4">
              Crea tu <span class="text-fiery-red">Cuenta</span>
            </h1>
            <!-- Step indicator -->
            <div class="flex items-center justify-center gap-2">
              <div class="flex items-center gap-1.5">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  :class="currentStep === 1 ? 'bg-fiery-navy text-white' : 'bg-emerald-500 text-white'">
                  <svg v-if="currentStep > 1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <span v-else>1</span>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest" :class="currentStep === 1 ? 'text-fiery-navy' : 'text-slate-400'">Tu perfil</span>
              </div>
              <div class="w-8 h-px" :class="currentStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'"></div>
              <div class="flex items-center gap-1.5">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  :class="currentStep === 2 ? 'bg-fiery-navy text-white' : 'bg-slate-200 text-slate-400'">2</div>
                <span class="text-[10px] font-black uppercase tracking-widest" :class="currentStep === 2 ? 'text-fiery-navy' : 'text-slate-400'">Acceso</span>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
          </div>

          <!-- ═══ PASO 1: Nombre, apellido, usuario ═══ -->
          <form v-if="currentStep === 1" @submit.prevent="goToStep2" class="space-y-5 mb-8">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Nombre</label>
                <input v-model="nombre" type="text" required
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="Juan" />
              </div>
              <div>
                <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Apellido</label>
                <input v-model="apellido" type="text" required
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="Pérez" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Nombre de Usuario</label>
              <div class="relative">
                <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input v-model="nombre_usuario" type="text" required autocomplete="username"
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl pl-9 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="mi_usuario" />
              </div>
              <p class="text-[10px] text-slate-400 mt-1.5 ml-1">Solo letras, números y _ · 3–30 caracteres</p>
            </div>

            <button type="submit"
              class="w-full bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 active:scale-[0.98]">
              Siguiente →
            </button>
          </form>

          <!-- ═══ PASO 2: Contraseña + correo opcional ═══ -->
          <form v-else @submit.prevent="handleRegister" class="space-y-5 mb-8">
            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Contraseña</label>
              <div class="relative">
                <input v-model="password" :type="showPassword ? 'text' : 'password'" required autocomplete="new-password"
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                  placeholder="••••••••" />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1.5 ml-1">Mín. 8 caracteres, 1 mayúscula y 1 número</p>
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2 ml-1">Confirmar Contraseña</label>
              <div class="relative">
                <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" required autocomplete="new-password"
                  class="w-full border rounded-2xl px-5 pr-14 py-4 focus:outline-none focus:ring-2 transition-all font-medium placeholder-slate-400"
                  :class="confirmPassword && confirmPassword !== password
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 bg-slate-50 focus:ring-fiery-red/20 focus:border-fiery-red'"
                  placeholder="••••••••" />
                <button type="button" @click="showConfirm = !showConfirm"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                  <svg v-if="!showConfirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                </button>
              </div>
              <p v-if="confirmPassword && confirmPassword !== password" class="text-[10px] text-red-500 font-bold mt-1.5 ml-1">
                Las contraseñas no coinciden
              </p>
            </div>

            <!-- Correo opcional -->
            <div class="pt-1 border-t border-slate-100">
              <div class="flex items-center justify-between mb-2 ml-1">
                <label class="text-xs font-black text-fiery-navy uppercase tracking-wider">Correo Electrónico</label>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Opcional</span>
              </div>
              <input v-model="email" type="email" autocomplete="email"
                class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium placeholder-slate-400"
                placeholder="tu@correo.com" />
              <p class="text-[10px] text-slate-400 mt-1.5 ml-1">Para recuperar tu contraseña si la olvidas</p>
            </div>

            <div class="flex gap-3 pt-1">
              <button type="button" @click="currentStep = 1; errorMessage = ''"
                class="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                ← Volver
              </button>
              <button type="submit" :disabled="isSubmitting"
                class="flex-1 bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
                <svg v-if="isSubmitting" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span v-else>Crear Cuenta</span>
              </button>
            </div>
          </form>

          <!-- Google (solo paso 1) -->
          <template v-if="currentStep === 1">
            <div class="relative flex items-center justify-center mb-6">
              <div class="absolute w-full h-px bg-slate-200"></div>
              <span class="relative bg-white px-4 text-xs font-black text-slate-400 uppercase tracking-widest">o con</span>
            </div>
            <button type="button" :disabled="isSubmitting" @click="loginWithGoogle"
              class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-fiery-navy py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </template>

          <div class="mt-7 text-center">
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
