<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

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
const fileInputRef = ref(null)

const form = ref({
  nombre: '',
  apellido: '',
  descripcion: '',
  whatsapp: '',
  instagram: '',
  facebook: ''
})

// ── Errors ──────────────────────────────────────────────
const errors = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.nombre.trim()) errors.value.nombre = 'El nombre es requerido'
  if (!form.value.apellido.trim()) errors.value.apellido = 'El apellido es requerido'
  if (form.value.instagram && !form.value.instagram.startsWith('http')) {
    errors.value.instagram = 'Debe ser un enlace válido (https://...)'
  }
  if (form.value.facebook && !form.value.facebook.startsWith('http')) {
    errors.value.facebook = 'Debe ser un enlace válido (https://...)'
  }
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
      nombre:      u.nombre      || '',
      apellido:    u.apellido    || '',
      descripcion: u.descripcion || '',
      whatsapp:    u.whatsapp    || '',
      instagram:   u.instagram   || '',
      facebook:    u.facebook    || ''
    }
    photoPreview.value = u.foto_perfil || null
  } catch {
    const u = authStore.user
    if (u) {
      form.value = {
        nombre:      u.nombre      || '',
        apellido:    u.apellido    || '',
        descripcion: u.descripcion || '',
        whatsapp:    u.whatsapp    || '',
        instagram:   u.instagram   || '',
        facebook:    u.facebook    || ''
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
  photoPreview.value = URL.createObjectURL(file)
}

const clearPhoto = () => {
  photoFile.value = null
  photoPreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ── Save ────────────────────────────────────────────────
const saveProfile = async () => {
  if (!validate()) return
  saving.value = true
  try {
    // 1. Subir foto si hay archivo nuevo
    if (photoFile.value) {
      uploadingPhoto.value = true
      const fd = new FormData()
      fd.append('foto', photoFile.value)
      try {
        await api.post('/auth/profile/photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (photoErr) {
        console.warn('No se pudo subir la foto:', photoErr)
        showToast('No se pudo subir la foto de perfil', 'error')
      } finally {
        uploadingPhoto.value = false
      }
    }

    // 2. Guardar datos del perfil
    const payload = {
      nombre:      form.value.nombre.trim(),
      apellido:    form.value.apellido.trim(),
      descripcion: form.value.descripcion.trim(),
      whatsapp:    form.value.whatsapp.trim(),
      instagram:   form.value.instagram.trim(),
      facebook:    form.value.facebook.trim()
    }
    const res = await api.put('/auth/profile', payload)
    const updatedUser = res.data?.data || { ...authStore.user, ...payload }

    // 3. Actualizar store — el navbar reacciona automáticamente al cambio de nombre y foto
    authStore.user = {
      ...authStore.user,
      ...updatedUser,
      nombre:      form.value.nombre.trim(),
      apellido:    form.value.apellido.trim(),
      foto_perfil: photoPreview.value
    }
    localStorage.setItem('user', JSON.stringify(authStore.user))

    showToast('Perfil actualizado correctamente')
    // Sin redirección — el usuario se queda en esta misma página
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

    <main class="pt-[88px] pb-20 container mx-auto px-4 sm:px-6 max-w-2xl">

      <!-- Header con foto y nombre actualizados en tiempo real -->
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
              >
                {{ photoPreview ? 'Cambiar foto' : 'Subir foto' }}
              </button>
              <button
                v-if="photoPreview"
                @click="clearPhoto"
                class="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-fiery-red transition-colors"
              >
                Eliminar foto
              </button>
              <p class="text-[10px] text-slate-400">JPG, PNG o WEBP. Máx 5MB.</p>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handlePhotoChange"
            />
          </div>
        </div>

        <!-- Datos personales -->
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

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Biografía / Descripción</label>
            <textarea
              v-model="form.descripcion"
              rows="3"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fiery-navy/20 focus:border-fiery-navy transition-all resize-none"
              placeholder="Cuéntanos algo sobre ti..."
            ></textarea>
          </div>
        </div>

        <!-- Redes sociales -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto y Redes Sociales</p>

          <!-- WhatsApp -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            </div>
            <div class="flex-1">
              <input
                v-model="form.whatsapp"
                type="tel"
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                placeholder="502XXXXXXXX"
              />
            </div>
          </div>

          <!-- Instagram -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-pink-100">
              <svg class="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
            <div class="flex-1">
              <input
                v-model="form.instagram"
                type="url"
                :class="['w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all', errors.instagram ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-pink-200 focus:border-pink-400']"
                placeholder="https://instagram.com/tu_usuario"
              />
              <p v-if="errors.instagram" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.instagram }}</p>
            </div>
          </div>

          <!-- Facebook -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-100">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div class="flex-1">
              <input
                v-model="form.facebook"
                type="url"
                :class="['w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all', errors.facebook ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400']"
                placeholder="https://facebook.com/tu_perfil"
              />
              <p v-if="errors.facebook" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.facebook }}</p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="router.back()"
            class="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          <button
            @click="saveProfile"
            :disabled="saving"
            class="flex-1 bg-fiery-red hover:bg-fiery-darkred text-white py-4 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
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