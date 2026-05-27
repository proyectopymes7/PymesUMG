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
  telefono: '',
  biografia: '',
  avatar: ''
})

watch(() => props.show, (newVal) => {
  if (newVal && props.user) {
    formData.value = { 
      ...props.user,
      telefono: props.user.telefono || '',
      biografia: props.user.biografia || '',
      avatar: props.user.avatar || ''
    }
  }
})

const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    formData.value.avatar = URL.createObjectURL(file)
    formData.value.avatarFile = file
  }
}

const removeAvatar = () => {
  formData.value.avatar = ''
  formData.value.avatarFile = null
}

const saveUser = async () => {
  loading.value = true
  try {
    const payload = {
      nombre:   formData.value.nombre,
      apellido: formData.value.apellido,
      telefono: formData.value.telefono || undefined
    }
    const res = await api.put(`/users/${props.user.id_usuario}`, payload)
    const updated = res.data?.data || formData.value
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
    
    <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100vh-96px)] flex flex-col relative shadow-2xl z-10 overflow-hidden mx-auto" @keydown.esc="emit('close')" tabindex="0">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <h2 class="text-2xl font-black text-fiery-navy uppercase tracking-tighter">Editar Usuario</h2>
        <button @click="emit('close')" class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-fiery-red shadow-sm transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div class="flex flex-col md:flex-row gap-8">
          
          <!-- Avatar Section -->
          <div class="flex flex-col items-center gap-4 shrink-0">
            <div class="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-slate-300 relative group">
              <img v-if="formData.avatar" :src="formData.avatar" class="w-full h-full object-cover" />
              <div v-else class="bg-fiery-navy w-full h-full text-white flex items-center justify-center text-5xl uppercase">
                {{ formData.nombre?.[0] || '?' }}
              </div>
              
              <div v-if="formData.avatar" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button @click="removeAvatar" class="text-white hover:text-fiery-red p-2" title="Eliminar foto">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            
            <label class="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
              Subir Foto
              <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
            </label>
          </div>

          <!-- Form Fields -->
          <div class="flex-1 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                <input v-model="formData.nombre" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all" />
              </div>
              <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Apellido</label>
                <input v-model="formData.apellido" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Correo (Solo lectura)</label>
              <input v-model="formData.correo" type="email" disabled class="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-bold cursor-not-allowed" />
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono / Contacto</label>
              <input v-model="formData.telefono" type="text" placeholder="Ej. 502 1234 5678" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none focus:border-fiery-red transition-all" />
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Biografía / Descripción</label>
              <textarea v-model="formData.biografia" rows="3" placeholder="Breve descripción del usuario..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none focus:border-fiery-red transition-all"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 shrink-0">
        <button @click="emit('close')" class="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-widest text-center">Cancelar</button>
        <button @click="saveUser" :disabled="loading" class="w-full sm:w-auto bg-fiery-navy hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-fiery-navy/20 flex items-center justify-center gap-2">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          Guardar
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
