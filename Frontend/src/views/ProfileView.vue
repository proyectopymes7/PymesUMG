<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import { uploadImage } from '../services/businessService'

const router = useRouter()
const authStore = useAuthStore()

// ── Toasts ─────────────────────────────────────────────
const toasts = ref([])
const showToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
}

// ── Form state ──────────────────────────────────────────
const saving = ref(false)
const uploadingPhoto = ref(false)
const photoPreview = ref(null)
const photoFile = ref(null)
const photoDeleted = ref(false)
const fileInputRef = ref(null)

const form = ref({
  nombre: '',
  apellido: ''
})

// ── Cambio de contraseña ────────────────────────────────
const changingPassword = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordErrors = ref({})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const validatePassword = () => {
  passwordErrors.value = {}
  if (!passwordForm.value.currentPassword) {
    passwordErrors.value.currentPassword = 'La contraseña actual es requerida'
  }
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 8) {
    passwordErrors.value.newPassword = 'Mínimo 8 caracteres'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.value.newPassword)) {
    passwordErrors.value.newPassword = 'Debe tener mayúscula, minúscula y número'
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Las contraseñas no coinciden'
  }
  return Object.keys(passwordErrors.value).length === 0
}

const handleChangePassword = async () => {
  if (!validatePassword()) return
  changingPassword.value = true
  try {
    await api.put('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    showToast('Contraseña actualizada correctamente')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    passwordErrors.value = {}
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al cambiar la contraseña'
    showToast(msg, 'error')
  } finally {
    changingPassword.value = false
  }
}

// ── Errors ──────────────────────────────────────────────
const errors = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.nombre.trim()) errors.value.nombre = 'El nombre es requerido'
  if (!form.value.apellido.trim()) errors.value.apellido = 'El apellido es requerido'
  return Object.keys(errors.value).length === 0
}

// ── Load current data ───────────────────────────────────
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  try {
    const res = await api.get('/auth/profile')
    const u = res.data?.data || authStore.user
    form.value = {
      nombre:  u.nombre  || '',
      apellido: u.apellido || ''
    }
    photoPreview.value = u.foto_perfil || null
  } catch {
    const u = authStore.user
    if (u) {
      form.value = {
        nombre:  u.nombre  || '',
        apellido: u.apellido || ''
      }
      photoPreview.value = u.foto_perfil || null
    }
  }
})

// ── Photo handling ──────────────────────────────────────
const triggerPhotoInput = () => fileInputRef.value?.click()

const handlePhotoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    showToast('La imagen no debe superar 5MB', 'error')
    return
  }
  photoFile.value = file
  photoDeleted.value = false
  photoPreview.value = URL.createObjectURL(file)
}

const clearPhoto = () => {
  photoFile.value = null
  photoPreview.value = null
  photoDeleted.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── Save ────────────────────────────────────────────────
const saveProfile = async () => {
  if (!validate()) return
  saving.value = true
  try {
    // 1. Subir foto si hay archivo nuevo (2 pasos: upload → URL → guardar con perfil)
    let fotoUrl = undefined
    if (photoFile.value) {
      uploadingPhoto.value = true
      try {
        fotoUrl = await uploadImage(photoFile.value, 'perfiles')
        photoPreview.value = fotoUrl
        photoFile.value = null
      } catch (photoErr) {
        console.warn('No se pudo subir la foto:', photoErr)
        showToast('No se pudo subir la foto de perfil', 'error')
      } finally {
        uploadingPhoto.value = false
      }
    }

    // 2. Guardar nombre, apellido y foto_perfil en una sola llamada
    const payload = {
      nombre:   form.value.nombre.trim(),
      apellido: form.value.apellido.trim(),
      ...(fotoUrl !== undefined
        ? { foto_perfil: fotoUrl }
        : photoDeleted.value
          ? { foto_perfil: '' }
          : {})
    }
    const res = await api.put('/auth/profile', payload)
    const updatedUser = res.data?.data || { ...authStore.user, ...payload }

    // 3. Actualizar store
    const finalPhoto = fotoUrl ?? (photoDeleted.value ? '' : (updatedUser.foto_perfil ?? photoPreview.value))
    authStore.user = {
      ...authStore.user,
      ...updatedUser,
      nombre:      form.value.nombre.trim(),
      apellido:    form.value.apellido.trim(),
      foto_perfil: finalPhoto
    }
    photoDeleted.value = false
    localStorage.setItem('user', JSON.stringify(authStore.user))

    showToast('Perfil actualizado correctamente')
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al guardar los cambios'
    showToast(msg, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />

    <!-- Toasts -->
    <div class="fixed bottom-6 right-4 sm:right-6 z-[300] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold text-white"
          :class="toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
        >
          <span>{{ toast.type === 'success' ? '✓' : '✕' }}</span>
          {{ toast.message }}
        </div>
      </transition-group>
    </div>

    <main class="pt-[120px] pb-20 container mx-auto px-4 sm:px-6 max-w-2xl">

      <!-- Header -->
      <div class="mb-10 flex items-center gap-4">
        <div class="w-14 h-14 rounded-full overflow-hidden border-4 border-slate-100 shadow-md flex-shrink-0">
          <img
            v-if="photoPreview"
            :src="photoPreview"
            class="w-full h-full object-cover"
            alt="Foto de perfil"
          />
          <div v-else class="w-full h-full bg-fiery-red flex items-center justify-center text-white font-black text-xl">
            {{ authStore.userInitial }}
          </div>
        </div>
        <div>
          <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-1">Mi cuenta</h4>
          <h1 class="text-3xl sm:text-4xl font-black text-fiery-navy uppercase tracking-tighter leading-none">
            {{ form.nombre || authStore.userFullName }} <span class="text-fiery-red">{{ form.apellido }}</span>
          </h1>
        </div>
      </div>

      <div class="space-y-6">

        <!-- Foto de perfil -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Foto de Perfil</p>
          <div class="flex items-center gap-6">
            <div class="relative flex-shrink-0">
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg">
                <img
                  v-if="photoPreview"
                  :src="photoPreview"
                  class="w-full h-full object-cover"
                  alt="Foto de perfil"
                />
                <div v-else class="w-full h-full bg-fiery-red flex items-center justify-center text-white font-black text-4xl">
                  {{ authStore.userInitial }}
                </div>
              </div>
              <button
                @click="triggerPhotoInput"
                class="absolute bottom-0 right-0 w-8 h-8 bg-fiery-navy text-white rounded-full flex items-center justify-center shadow-md hover:bg-fiery-red transition-colors"
                title="Cambiar foto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </button>
            </div>
            <div class="flex flex-col gap-2">
              <button
                @click="triggerPhotoInput"
                class="px-5 py-2.5 bg-fiery-navy text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity"
              >{{ photoPreview ? 'Cambiar foto' : 'Subir foto' }}</button>
              <button
                v-if="photoPreview"
                @click="clearPhoto"
                class="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-fiery-red transition-colors"
              >Eliminar foto</button>
              <p class="text-[10px] text-slate-400">JPG, PNG o WEBP. Máx 5MB.</p>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handlePhotoChange" />
          </div>
        </div>

        <!-- Nombre y Apellido -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Información Personal</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nombre</label>
              <input
                v-model="form.nombre"
                type="text"
                :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all', errors.nombre ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
                placeholder="Tu nombre"
              />
              <p v-if="errors.nombre" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.nombre }}</p>
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Apellido</label>
              <input
                v-model="form.apellido"
                type="text"
                :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all', errors.apellido ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
                placeholder="Tu apellido"
              />
              <p v-if="errors.apellido" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.apellido }}</p>
            </div>
          </div>
        </div>

        <!-- Botones guardar perfil -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="router.back()"
            class="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
          >Cancelar</button>
          <button
            @click="saveProfile"
            :disabled="saving"
            class="flex-1 bg-fiery-red hover:bg-fiery-darkred text-white py-4 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

        <!-- ── Cambio de Contraseña ── -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-fiery-navy/10 rounded-xl flex items-center justify-center">
              <svg class="w-4 h-4 text-fiery-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Cambiar Contraseña</p>
          </div>

          <!-- Contraseña actual -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Contraseña Actual</label>
            <div class="relative">
              <input
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all pr-12', passwordErrors.currentPassword ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
                placeholder="••••••••"
              />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                <svg v-if="showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p v-if="passwordErrors.currentPassword" class="text-[10px] text-red-500 font-bold mt-1">{{ passwordErrors.currentPassword }}</p>
          </div>

          <!-- Nueva contraseña -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nueva Contraseña</label>
            <div class="relative">
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all pr-12', passwordErrors.newPassword ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
                placeholder="••••••••"
              />
              <button type="button" @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                <svg v-if="showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p v-if="passwordErrors.newPassword" class="text-[10px] text-red-500 font-bold mt-1">{{ passwordErrors.newPassword }}</p>
            <p class="text-[10px] text-slate-400 mt-1">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
          </div>

          <!-- Confirmar contraseña -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Confirmar Nueva Contraseña</label>
            <div class="relative">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all pr-12', passwordErrors.confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
                placeholder="••••••••"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fiery-navy transition-colors">
                <svg v-if="showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p v-if="passwordErrors.confirmPassword" class="text-[10px] text-red-500 font-bold mt-1">{{ passwordErrors.confirmPassword }}</p>
          </div>

          <button
            @click="handleChangePassword"
            :disabled="changingPassword"
            class="w-full bg-fiery-navy hover:opacity-90 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <div v-if="changingPassword" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ changingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateX(110%); }
.toast-leave-to   { opacity: 0; transform: translateX(110%); }
</style>