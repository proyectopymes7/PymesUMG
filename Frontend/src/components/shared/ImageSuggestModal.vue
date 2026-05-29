<script setup>
import { ref, watch } from 'vue'
import api from '../../services/api'
import { uploadImage } from '../../services/businessService'

const props = defineProps({
  show: Boolean,
  nombre: String,
  categoria: String,
  descripcion: String,
  municipio: String,
  departamento: String
})

const emit = defineEmits(['close', 'selected'])

const loading = ref(false)
const photos = ref([])
const error = ref('')
const selecting = ref(null)

const suggest = async () => {
  loading.value = true
  error.value = ''
  photos.value = []
  try {
    const res = await api.post('/ai/suggest-images', {
      nombre: props.nombre,
      categoria: props.categoria,
      descripcion: props.descripcion,
      municipio: props.municipio,
      departamento: props.departamento
    })
    photos.value = res.data.photos || []
    if (!photos.value.length) error.value = 'No se encontraron imágenes. Intenta de nuevo.'
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al buscar imágenes'
  } finally {
    loading.value = false
  }
}

const selectPhoto = async (photo) => {
  selecting.value = photo.id
  try {
    // Descargar la imagen de Pexels → subir a Azure con compresión
    const response = await fetch(photo.original)
    const blob = await response.blob()
    const file = new File([blob], 'business_image.jpg', { type: blob.type })
    const url = await uploadImage(file, 'logos')
    emit('selected', url)
    emit('close')
  } catch (e) {
    error.value = 'Error al seleccionar la imagen. Intenta de nuevo.'
  } finally {
    selecting.value = null
  }
}

// Auto-sugerir cuando se abre el modal
watch(() => props.show, (val) => {
  if (val && props.nombre) suggest()
})

// Re-sugerir cuando cambia nombre, categoría o descripción (con debounce)
let debounceTimer = null
watch([() => props.nombre, () => props.categoria, () => props.descripcion], () => {
  if (!props.show) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (props.nombre) suggest()
  }, 800)
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4"
        @click.self="emit('close')">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">

          <!-- Header -->
          <div class="sticky top-0 bg-white z-10 flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
            <div>
              <h3 class="text-lg font-black text-fiery-navy uppercase tracking-tighter">✦ Imágenes sugeridas por IA</h3>
              <p class="text-slate-400 text-xs mt-0.5">Basadas en el nombre y categoría de tu negocio</p>
            </div>
            <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-lg transition-colors leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-5 flex-1">

            <!-- Cargando -->
            <div v-if="loading" class="grid grid-cols-3 gap-3">
              <div v-for="i in 6" :key="i" class="aspect-video bg-slate-100 rounded-2xl animate-pulse"></div>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="text-center py-8">
              <p class="text-slate-400 text-sm mb-4">{{ error }}</p>
              <button @click="suggest" class="px-6 py-2.5 bg-fiery-navy text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity">
                Intentar de nuevo
              </button>
            </div>

            <!-- Grid de fotos -->
            <div v-else-if="photos.length" class="space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  v-for="photo in photos"
                  :key="photo.id"
                  @click="selectPhoto(photo)"
                  :disabled="!!selecting"
                  class="relative aspect-video rounded-2xl overflow-hidden group border-2 transition-all"
                  :class="selecting === photo.id ? 'border-fiery-red scale-95' : 'border-transparent hover:border-fiery-red hover:shadow-lg'"
                >
                  <img :src="photo.thumbnail" :alt="photo.keyword" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div v-if="selecting === photo.id" class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span v-else class="text-white font-black text-xs uppercase tracking-widest">Usar esta</span>
                  </div>
                  <div class="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full truncate max-w-[90%]">
                    {{ photo.photographer }}
                  </div>
                </button>
              </div>

              <div class="flex justify-center">
                <button @click="suggest" :disabled="loading" class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:border-fiery-navy hover:text-fiery-navy transition-all disabled:opacity-50">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Ver otras opciones
                </button>
              </div>
            </div>

            <!-- Estado inicial -->
            <div v-else class="text-center py-10">
              <div class="w-16 h-16 bg-fiery-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">✦</span>
              </div>
              <p class="font-black text-fiery-navy mb-2">Sugerir imágenes con IA</p>
              <p class="text-slate-400 text-sm mb-6">Buscamos fotos relevantes basadas en tu negocio</p>
              <button @click="suggest" class="px-7 py-3 bg-fiery-navy text-white rounded-2xl font-black text-sm hover:opacity-80 transition-opacity shadow-lg">
                ✦ Generar sugerencias
              </button>
            </div>

          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
