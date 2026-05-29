<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const tokenInvalid = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) tokenInvalid.value = true
})

const handleReset = async () => {
  error.value = ''
  if (!newPassword.value || newPassword.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword.value)) {
    error.value = 'Debe tener mayúscula, minúscula y número'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: token.value, newPassword: newPassword.value })
    success.value = true
  } catch (e) {
    error.value = e.response?.data?.error || 'El enlace es inválido o ha expirado'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen">
    <div class="fixed inset-0 z-0"
      style="background-image:url('/src/assets/AntiguaVolcan.webp');background-size:cover;background-position:center;">
      <div class="absolute inset-0 bg-black/50"></div>
    </div>

    <div class="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-[2rem] shadow-2xl p-8 md:p-10">

          <!-- Token inválido -->
          <div v-if="tokenInvalid" class="text-center space-y-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 class="text-xl font-black text-fiery-navy uppercase">Enlace inválido</h2>
            <p class="text-slate-500 text-sm">Este enlace de recuperación no es válido o ya expiró.</p>
            <button @click="router.push('/login')" class="w-full bg-fiery-red text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-fiery-darkred transition-all mt-2">
              Ir al inicio de sesión
            </button>
          </div>

          <!-- Éxito -->
          <div v-else-if="success" class="text-center space-y-4">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 class="text-xl font-black text-fiery-navy uppercase">¡Contraseña actualizada!</h2>
            <p class="text-slate-500 text-sm">Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.</p>
            <button @click="router.push('/login')" class="w-full bg-fiery-red text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-fiery-darkred transition-all mt-2">
              Iniciar Sesión
            </button>
          </div>

          <!-- Formulario -->
          <div v-else class="space-y-6">
            <div class="text-center">
              <div class="w-16 h-16 bg-fiery-red rounded-2xl flex items-center justify-center shadow-lg shadow-fiery-red/20 mx-auto mb-5 rotate-3">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <h1 class="text-2xl font-black text-fiery-navy uppercase tracking-tight mb-1">Nueva <span class="text-fiery-red">Contraseña</span></h1>
              <p class="text-slate-500 text-sm">Ingresa tu nueva contraseña</p>
            </div>

            <div v-if="error" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2">Nueva Contraseña</label>
              <div class="relative">
                <input v-model="newPassword" :type="showNew ? 'text' : 'password'"
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium pr-12"
                  placeholder="••••••••" />
                <button type="button" @click="showNew = !showNew" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy">
                  <svg v-if="showNew" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
            </div>

            <div>
              <label class="block text-xs font-black text-fiery-navy uppercase tracking-wider mb-2">Confirmar Contraseña</label>
              <div class="relative">
                <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'"
                  class="w-full bg-slate-50 border border-slate-200 text-fiery-navy rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all font-medium pr-12"
                  placeholder="••••••••" @keyup.enter="handleReset" />
                <button type="button" @click="showConfirm = !showConfirm" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy">
                  <svg v-if="showConfirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
            </div>

            <button @click="handleReset" :disabled="loading"
              class="w-full bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 disabled:opacity-70 flex justify-center items-center gap-2">
              <svg v-if="loading" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span v-else>Guardar Nueva Contraseña</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>