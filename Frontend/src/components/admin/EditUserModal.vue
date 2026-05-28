<script setup>
import { ref, watch } from 'vue'
import { useToastStore } from '../../stores/toast'
import api from '../../services/api'

const props = defineProps({
  show: Boolean,
  user: Object
})

const emit = defineEmits(['close', 'saved'])
const toastStore = useToastStore()

const loading = ref(false)
const formData = ref({
  nombre: '',
  apellido: '',
  correo: '',
  avatar: ''
})

watch(() => props.show, (newVal) => {
  if (newVal && props.user) {
    formData.value = {
      nombre:   props.user.nombre   || '',
      apellido: props.user.apellido || '',
      correo:   props.user.correo   || '',
      avatar:   props.user.avatar   || ''
    }
  }
})

const fileInputRef = ref(null)
const triggerFileInput = () => fileInputRef.value?.click()

const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toastStore.error('La imagen no debe superar 5MB')
    return
  }
  formData.value.avatar = URL.createObjectURL(file)
  formData.value.avatarFile = file
}

const removeAvatar = () => {
  formData.value.avatar = ''
  formData.value.avatarFile = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const saveUser = async () => {
  if (!formData.value.nombre.trim()) {
    toastStore.error('El nombre es requerido')
    return
  }
  if (!formData.value.apellido.trim()) {
    toastStore.error('El apellido es requerido')
    return
  }
  loading.value = true
  try {
    const payload = {
      nombre:   formData.value.nombre.trim(),
      apellido: formData.value.apellido.trim()
    }
    const res = await api.put(`/users/${props.user.id_usuario}`, payload)
    const updated = res.data?.data || { ...props.user, ...payload }
    toastStore.success('Usuario actualizado correctamente')
    emit('saved', updated)
    emit('close')
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al actualizar el usuario'
    toastStore.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[200] flex items-start justify-center pt-[80px] px-4 pb-4" @click.self="emit('close')">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="bg-white rounded-3xl w-full max-w-lg max-h-[calc(100vh-96px)] flex flex-col relative shadow-2xl z-10 overflow-hidden mx-auto">

      <!-- Header -->
      <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <h2 class="text-2xl font-black text-fiery-navy uppercase tracking-tighter">Editar Usuario</h2>
        <button @click="emit('close')" class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-fiery-red shadow-sm transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div class="flex flex-col items-center gap-6">

          <!-- Avatar -->
          <div class="flex flex-col items-center gap-3">
            <div class="relative group">
              <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg">
                <img v-if="formData.avatar" :src="formData.avatar" class="w-full h-full object-cover" alt="Foto de perfil" />
                <div v-else class="bg-fiery-navy w-full h-full text-white flex items-center justify-center text-5xl font-black uppercase">
                  {{ formData.nombre?.[0] || '?' }}
                </div>
              </div>

              <!-- Overlay con acciones al hacer hover -->
              <div v-if="formData.avatar" class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button @click="triggerFileInput" title="Cambiar foto" class="text-white hover:text-yellow-300 transition-colors p-1">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <button @click="removeAvatar" title="Eliminar foto" class="text-white hover:text-red-400 transition-colors p-1">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Botones de foto -->
            <div class="flex gap-2">
              <button
                @click="triggerFileInput"
                class="bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
              >{{ formData.avatar ? 'Cambiar foto' : 'Subir foto' }}</button>
              <button
                v-if="formData.avatar"
                @click="removeAvatar"
                class="bg-red-50 text-fiery-red border border-red-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >Eliminar</button>
            </div>

            <p class="text-[10px] text-slate-400">JPG, PNG o WEBP. Máx 5MB.</p>

            <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
          </div>

          <!-- Nombre y Apellido -->
          <div class="w-full space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                <input
                  v-model="formData.nombre"
                  type="text"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all"
                />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Apellido</label>
                <input
                  v-model="formData.apellido"
                  type="text"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all"
                />
              </div>
            </div>

            <!-- Correo solo lectura -->
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Correo (Solo lectura)</label>
              <input
                v-model="formData.correo"
                type="email"
                disabled
                class="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-bold cursor-not-allowed"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
        <button
          @click="emit('close')"
          class="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-widest text-center border border-slate-200"
        >Cancelar</button>
        <button
          @click="saveUser"
          :disabled="loading"
          class="w-full sm:w-auto bg-fiery-navy hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          Guardar
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
</style>