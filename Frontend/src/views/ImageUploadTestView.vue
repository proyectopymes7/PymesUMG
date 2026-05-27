<script setup>
import { ref } from 'vue'
import api from '../services/api'

const tipo = ref('logo')
const entityId = ref('')
const file = ref(null)
const preview = ref(null)
const loading = ref(false)
const result = ref(null)
const error = ref(null)

const fieldName = {
  logo: 'logo',
  galeria: 'imagen',
  producto: 'imagen'
}

const endpoint = {
  logo: (id) => `/imagenes/logo/${id}`,
  galeria: (id) => `/imagenes/galeria/${id}`,
  producto: (id) => `/imagenes/producto/${id}`
}

const onFileChange = (e) => {
  const f = e.target.files[0]
  if (!f) return
  file.value = f
  preview.value = URL.createObjectURL(f)
  result.value = null
  error.value = null
}

const upload = async () => {
  if (!file.value) { error.value = 'Selecciona una imagen primero.'; return }
  if (!entityId.value) { error.value = 'Ingresa el ID del negocio/producto.'; return }

  loading.value = true
  result.value = null
  error.value = null

  try {
    const formData = new FormData()
    formData.append(fieldName[tipo.value], file.value)

    const res = await api.post(endpoint[tipo.value](entityId.value), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    result.value = res.data
  } catch (err) {
    error.value = err.response?.data?.error || err.response?.data?.message || err.message
  } finally {
    loading.value = false
  }
}

const reset = () => {
  file.value = null
  preview.value = null
  result.value = null
  error.value = null
  entityId.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 space-y-6">

      <!-- Header -->
      <div>
        <p class="text-xs font-black text-fiery-red uppercase tracking-widest mb-1">Prueba temporal</p>
        <h1 class="text-2xl font-black text-fiery-navy uppercase tracking-tighter">Subida de Imágenes</h1>
        <p class="text-xs text-slate-400 mt-1">Endpoint: Azure Blob Storage vía backend</p>
      </div>

      <!-- Tipo -->
      <div>
        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de subida</label>
        <div class="flex gap-2">
          <button
            v-for="t in ['logo', 'galeria', 'producto']" :key="t"
            @click="tipo = t; reset()"
            :class="[tipo === t ? 'bg-fiery-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all']"
          >{{ t }}</button>
        </div>
      </div>

      <!-- ID -->
      <div>
        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          {{ tipo === 'producto' ? 'ID del producto' : 'ID del negocio (emprendimiento)' }}
        </label>
        <input
          v-model="entityId"
          type="number"
          placeholder="Ej. 1"
          class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-navy transition-all"
        />
      </div>

      <!-- File picker -->
      <div>
        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Imagen (JPG, PNG, WEBP · máx 5MB)</label>
        <label
          class="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-fiery-navy hover:bg-slate-50 transition-all overflow-hidden relative"
        >
          <img v-if="preview" :src="preview" class="absolute inset-0 w-full h-full object-cover" />
          <div v-else class="flex flex-col items-center gap-2 text-slate-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-xs font-bold">Click para seleccionar</span>
          </div>
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" class="hidden" @change="onFileChange" />
        </label>
        <p v-if="file" class="text-[10px] text-slate-400 mt-1 truncate">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="upload"
          :disabled="loading"
          class="flex-1 bg-fiery-navy hover:bg-slate-800 disabled:opacity-50 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ loading ? 'Subiendo...' : 'Subir imagen' }}
        </button>
        <button @click="reset" class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
          Reset
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-4">
        <p class="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Error</p>
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Success -->
      <div v-if="result" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
        <p class="text-xs font-black text-emerald-700 uppercase tracking-widest">Subida exitosa</p>
        <img :src="result.url" class="w-full h-40 object-cover rounded-xl" />
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-slate-400 uppercase">URL en Azure</p>
          <a :href="result.url" target="_blank" class="text-xs text-emerald-600 break-all hover:underline">{{ result.url }}</a>
        </div>
        <div v-if="result.id_imagen || result.id_imagen_producto" class="text-[10px] text-slate-400">
          ID guardado en DB: <span class="font-black text-slate-600">{{ result.id_imagen ?? result.id_imagen_producto }}</span>
        </div>
      </div>

    </div>
  </div>
</template>
