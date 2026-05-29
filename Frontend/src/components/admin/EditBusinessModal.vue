<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getRawCategories, uploadProductImage } from '../../services/businessService'
import api from '../../services/api'
import LocationPicker from '../shared/LocationPicker.vue'

const props = defineProps({
  show: Boolean,
  business: Object
})

const emit = defineEmits(['close', 'saved'])

// Local Toast System
const toasts = ref([])
const showToast = (message, type = 'success') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3500)
}

// Computed variable to check for authentication token
const hasToken = computed(() => !!localStorage.getItem('token'))

const activeTab = ref('general')
const loading = ref(false)
const formData = ref({ socials: {} })
const categories = ref([])
const selectedCategorias = ref([])
const categoryDropdownOpen = ref(false)

// Horarios state
const daysMap = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom'
}
const days = Object.keys(daysMap)

// Generate hours 6:00 AM to 11:30 PM
const hours = []
for (let i = 6; i <= 23; i++) {
  const h = i > 12 ? i - 12 : i
  const suffix = i >= 12 ? 'PM' : 'AM'
  hours.push(`${h}:00 ${suffix}`)
  hours.push(`${h}:30 ${suffix}`)
}

const selectedDays = ref([])
const openTime = ref('8:00 AM')
const closeTime = ref('5:00 PM')

// Products state
const products = ref([])
const productImagesCache = ref({})
const loadingProducts = ref(false)
const showProductForm = ref(false)
const editingProduct = ref(null)
const productForm = ref({ tipo: 'producto', nombre: '', descripcion: '', precio: '' })
const deletingId = ref(null)

const getProductThumbnail = (prod) => {
  const cached = productImagesCache.value[prod.id_producto]
  if (cached?.length) return cached[0].url
  return prod.imagen_url || null
}

// Product Image State
const existingProductImages = ref([])
const newImageFiles = ref([]) // [{ file, preview }]
const loadingImages = ref(false)
const generatingDesc = ref(false)
const generatingBizDesc = ref(false)

const generateBusinessDescription = async () => {
  if (!formData.value.name?.trim() || generatingBizDesc.value) return
  generatingBizDesc.value = true
  try {
    const categoriaObj = categories.value.find(c => selectedCategorias.value.includes(c.id_categoria))
    const loc = formData.value.locationData
    const ubicacion = [loc?.municipio, loc?.departamento].filter(Boolean).join(', ')
    const res = await api.post('/ai/generate-description', {
      nombre: formData.value.name,
      tipo: 'negocio',
      nombre_negocio: formData.value.name,
      categoria: categoriaObj?.nombre || '',
      ubicacion,
      horario: formData.value.horario || ''
    })
    if (res.data?.descripcion) formData.value.description = res.data.descripcion
  } catch { /* silent */ } finally {
    generatingBizDesc.value = false
  }
}

const generateDescription = async () => {
  if (!productForm.value.nombre?.trim() || generatingDesc.value) return
  generatingDesc.value = true
  try {
    const res = await api.post('/ai/generate-description', {
      nombre: productForm.value.nombre,
      tipo: productForm.value.tipo,
      nombre_negocio: props.business?.name,
      categoria: props.business?.category
    })
    if (res.data?.descripcion) productForm.value.descripcion = res.data.descripcion
  } catch {
    // silently fail — user can write manually
  } finally {
    generatingDesc.value = false
  }
}

const fetchProductImages = async (productId) => {
  loadingImages.value = true
  try {
    const res = await api.get(`/imagenes/producto/${productId}`)
    existingProductImages.value = res.data?.data || []
  } catch {
    existingProductImages.value = []
  } finally {
    loadingImages.value = false
  }
}

const handleProductImageChange = (e) => {
  const files = Array.from(e.target.files)
  for (const file of files) {
    newImageFiles.value.push({ file, preview: URL.createObjectURL(file) })
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const removeNewImage = (idx) => { newImageFiles.value.splice(idx, 1) }

const deleteExistingImage = async (image) => {
  try {
    await api.delete(`/imagenes/producto/${image.id_imagen_producto}`)
    existingProductImages.value = existingProductImages.value.filter(i => i.id_imagen_producto !== image.id_imagen_producto)
    showToast('Imagen eliminada', 'success')
  } catch {
    showToast('No se pudo eliminar la imagen', 'error')
  }
}

const fileInputRef = ref(null)
const triggerFileInput = () => { if (fileInputRef.value) fileInputRef.value.click() }

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(async () => {
  categories.value = await getRawCategories()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(() => props.show, async (newVal) => {
  if (newVal && props.business) {
    activeTab.value = 'general'
    showProductForm.value = false
    editingProduct.value = null
    deletingId.value = null
    existingProductImages.value = []
    newImageFiles.value = []

    // Strip https://wa.me/ prefix — backend stores/validates the raw number
    const rawWhatsapp = (props.business.socials?.whatsapp || '').replace('https://wa.me/', '')

    formData.value = {
      ...props.business,
      socials: {
        whatsapp: rawWhatsapp,
        facebook: props.business.socials?.facebook || '',
        instagram: props.business.socials?.instagram || ''
      },
      locationData: {
        lat: props.business.lat || null,
        lng: props.business.lng || null,
        departamento: props.business.departamento || '',
        municipio: props.business.municipio || '',
        localidad: props.business.localidad || '',
        direccion: props.business.location || ''
      }
    }
    
    // Parse hours if exists (format: "Lunes, Martes 8:00 AM - 5:00 PM")
    // If not parseable easily, just select all
    selectedDays.value = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    openTime.value = '8:00 AM'
    closeTime.value = '5:00 PM'
    // categorias_ids comes from DB as a comma-separated string like "1,2,3"
    const rawIds = props.business.categorias_ids
    selectedCategorias.value = rawIds
      ? String(rawIds).split(',').map(Number).filter(Boolean)
      : []
  }
})

watch(activeTab, async (newVal) => {
  if (newVal === 'products') {
    await fetchProducts()
  }
})

const fetchProducts = async () => {
  if (!props.business?.id) return
  loadingProducts.value = true
  try {
    const res = await api.get(`/productos/emprendimiento/${props.business.id}`)
    products.value = res.data?.data || []
    // Precargar imágenes de cada producto en paralelo (no bloqueante)
    Promise.all(products.value.map(async (p) => {
      try {
        const imgRes = await api.get(`/imagenes/producto/${p.id_producto}`)
        productImagesCache.value[p.id_producto] = imgRes.data?.data || []
      } catch {
        productImagesCache.value[p.id_producto] = []
      }
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    loadingProducts.value = false
  }
}

const updateScheduleString = () => {
  if (selectedDays.value.length === 0) {
    formData.value.horario = ''
    return
  }
  const daysStr = selectedDays.value.join(', ')
  formData.value.horario = `${daysStr} ${openTime.value} - ${closeTime.value}`
}

const toggleDay = (day) => {
  if (selectedDays.value.includes(day)) {
    selectedDays.value = selectedDays.value.filter(d => d !== day)
  } else {
    selectedDays.value.push(day)
  }
}

const saveGeneral = async () => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }

  loading.value = true
  updateScheduleString()
  
  try {
    if (selectedCategorias.value.length === 0) {
      showToast('Selecciona al menos una categoría', 'error')
      loading.value = false
      return
    }

    const loc = formData.value.locationData || {}

    // Only send fields that have real values — empty strings break validators
    const payload = {}
    if (formData.value.name)        payload.nombre      = formData.value.name
    if (formData.value.description) payload.descripcion = formData.value.description
    payload.categorias = selectedCategorias.value
    if (formData.value.horario)          payload.horario     = formData.value.horario
    if (formData.value.socials?.whatsapp) payload.whatsapp   = formData.value.socials.whatsapp
    payload.facebook  = formData.value.socials?.facebook  || ''
    payload.instagram = formData.value.socials?.instagram || ''
    if (loc.departamento) payload.departamento = loc.departamento
    if (loc.municipio)    payload.municipio    = loc.municipio
    if (loc.localidad)    payload.localidad    = loc.localidad
    if (loc.direccion)    payload.direccion    = loc.direccion
    if (loc.lat)          payload.latitud      = loc.lat
    if (loc.lng)          payload.longitud     = loc.lng

    await api.put(`/emprendimientos/${props.business.id}`, payload)

    const updatedBusiness = {
      ...props.business,
      name:         payload.nombre        ?? props.business.name,
      description:  payload.descripcion   ?? props.business.description,
      horario:      payload.horario       ?? props.business.horario,
      socials: {
        ...props.business.socials,
        whatsapp:  payload.whatsapp  ?? props.business.socials?.whatsapp,
        facebook:  payload.facebook  ?? props.business.socials?.facebook,
        instagram: payload.instagram ?? props.business.socials?.instagram
      },
      lat:          payload.latitud       ?? props.business.lat,
      lng:          payload.longitud      ?? props.business.lng,
      departamento: payload.departamento  ?? props.business.departamento,
      municipio:    payload.municipio     ?? props.business.municipio,
      localidad:    payload.localidad     ?? props.business.localidad,
      location:     payload.direccion     ?? props.business.location,
    }

    showToast('Negocio guardado exitosamente', 'success')
    emit('saved', updatedBusiness)
  } catch (error) {
    // Show the first validation detail if available, otherwise generic message
    const details = error.response?.data?.details
    const errorMsg = (Array.isArray(details) && details[0]?.msg)
      ? `Campo inválido: ${details[0].msg}`
      : error.response?.data?.error || error.response?.data?.message || 'Error al guardar los cambios'
    console.error('Save error:', error.response?.data)
    showToast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

// Product Actions
const openNewProduct = () => {
  editingProduct.value = null
  productForm.value = { tipo: 'producto', nombre: '', descripcion: '', precio: '', visibilidad_precio: 'VISIBLE' }
  existingProductImages.value = []
  newImageFiles.value = []
  showProductForm.value = true
}

const openEditProduct = (prod) => {
  editingProduct.value = prod
  productForm.value = {
    tipo: prod.tipo?.toLowerCase() || 'producto',
    nombre: prod.nombre,
    descripcion: prod.descripcion,
    precio: prod.precio ?? '',
    visibilidad_precio: prod.visibilidad_precio || 'VISIBLE'
  }
  newImageFiles.value = []
  existingProductImages.value = []
  showProductForm.value = true
  fetchProductImages(prod.id_producto)
}

const saveProduct = async () => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  if (!productForm.value.nombre) {
    showToast('El nombre es requerido', 'error')
    return
  }

  loadingProducts.value = true
  try {
    let savedProductId = null

    const cleanForm = {
      ...productForm.value,
      precio: productForm.value.precio !== '' && productForm.value.precio !== null
        ? Number(productForm.value.precio)
        : null
    }

    if (editingProduct.value) {
      await api.put(`/productos/${editingProduct.value.id_producto}`, cleanForm)
      savedProductId = editingProduct.value.id_producto
    } else {
      const payload = { ...cleanForm, id_emprendimiento: props.business.id }
      const res = await api.post(`/productos`, payload)
      savedProductId = res.data?.data?.id_producto || res.data?.id_producto || res.data?.id
    }

    let imageFailed = false
    if (newImageFiles.value.length && savedProductId) {
      for (const { file } of newImageFiles.value) {
        try {
          await uploadProductImage(file, savedProductId)
        } catch (imgError) {
          console.error('Error al subir imagen:', imgError)
          imageFailed = true
        }
      }
      newImageFiles.value = []
    }

    if (imageFailed) {
      showToast('Guardado exitoso, pero falló la subida de imagen', 'error')
    } else {
      showToast(editingProduct.value ? 'Actualizado exitosamente' : 'Creado exitosamente', 'success')
    }
    
    showProductForm.value = false
    await fetchProducts()
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error al guardar'
    showToast(errorMsg, 'error')
  } finally {
    loadingProducts.value = false
  }
}

const askDelete = (id) => {
  deletingId.value = id
}

const cancelDelete = () => {
  deletingId.value = null
}

const executeDelete = async (id) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  try {
    await api.delete(`/productos/${id}`)
    showToast('Eliminado correctamente', 'success')
    deletingId.value = null
    products.value = products.value.filter(p => p.id_producto !== id)
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error al eliminar'
    showToast(errorMsg, 'error')
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[200] flex items-start justify-center pt-[80px] px-4 pb-4">
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>
    
    <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100vh-96px)] flex flex-col relative shadow-2xl z-10 mx-auto" tabindex="0">
      
      <!-- Header Sticky with Tabs -->
      <div class="bg-white sticky top-0 z-20 shrink-0 border-b border-slate-100 flex flex-col">
        <div class="p-6 flex justify-between items-center">
          <h2 class="text-2xl font-black text-fiery-navy uppercase tracking-tighter">Editar Negocio</h2>
          <button @click="emit('close')" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-fiery-red hover:bg-slate-200 shadow-sm transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="flex px-6">
          <button @click="activeTab = 'general'" :class="['flex-1 py-3 border-b-2 font-black uppercase tracking-widest text-[10px] transition-colors', activeTab === 'general' ? 'border-fiery-red text-fiery-navy' : 'border-transparent text-slate-400 hover:border-slate-200']">Información General</button>
          <button @click="activeTab = 'products'" :class="['flex-1 py-3 border-b-2 font-black uppercase tracking-widest text-[10px] transition-colors', activeTab === 'products' ? 'border-fiery-red text-fiery-navy' : 'border-transparent text-slate-400 hover:border-slate-200']">Productos / Servicios</button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50" style="scrollbar-width:none;-ms-overflow-style:none;">

        
        <!-- Tab: Información General -->
        <div v-show="activeTab === 'general'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Negocio</label>
              <input v-model="formData.name" type="text" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all" />
            </div>
            
            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                <button type="button" @click="generateBusinessDescription"
                  :disabled="!formData.name?.trim() || generatingBizDesc"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-fiery-navy/10 text-fiery-navy hover:bg-fiery-navy hover:text-white">
                  <svg v-if="generatingBizDesc" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  <span v-else>✦</span>
                  {{ generatingBizDesc ? 'Generando...' : 'Generar con IA' }}
                </button>
              </div>
              <textarea v-model="formData.description" rows="3" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none focus:border-fiery-red transition-all"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación en el mapa</label>
              <LocationPicker v-model="formData.locationData" />
            </div>

            <div class="md:col-span-2 relative">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Categorías <span class="text-slate-300 font-normal normal-case">(máx. 3)</span>
              </label>
              <button type="button" @click="categoryDropdownOpen = !categoryDropdownOpen"
                @blur="setTimeout(() => { categoryDropdownOpen = false }, 150)"
                class="w-full min-h-[44px] border border-slate-200 bg-white rounded-xl px-4 py-2 flex items-center flex-wrap gap-2 text-left focus:outline-none focus:border-fiery-red transition-all">
                <span v-if="selectedCategorias.length === 0" class="text-slate-400 text-sm font-medium">Selecciona categorías...</span>
                <span v-for="id in selectedCategorias" :key="id"
                  class="inline-flex items-center gap-1 bg-fiery-navy text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg">
                  {{ categories.find(c => c.id_categoria === id)?.nombre }}
                  <button type="button" @click.stop="selectedCategorias.splice(selectedCategorias.indexOf(id), 1)"
                    class="hover:text-white/60 transition-colors leading-none">×</button>
                </span>
                <svg class="w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform" :class="categoryDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="categoryDropdownOpen" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto" @click.stop>
                <button v-for="cat in categories" :key="cat.id_categoria" type="button"
                  :disabled="!selectedCategorias.includes(cat.id_categoria) && selectedCategorias.length >= 3"
                  @click="selectedCategorias.includes(cat.id_categoria)
                    ? selectedCategorias.splice(selectedCategorias.indexOf(cat.id_categoria), 1)
                    : (selectedCategorias.length < 3 && selectedCategorias.push(cat.id_categoria))"
                  class="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-b border-slate-50 last:border-0">
                  <span :class="['w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors', selectedCategorias.includes(cat.id_categoria) ? 'bg-fiery-navy border-fiery-navy' : 'border-slate-300']">
                    <svg v-if="selectedCategorias.includes(cat.id_categoria)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </span>
                  <span class="font-bold text-fiery-navy">{{ cat.nombre }}</span>
                </button>
              </div>
              <p v-if="selectedCategorias.length === 0" class="text-[10px] text-red-400 font-bold mt-1">Selecciona al menos una categoría</p>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Horario de Atención</label>
            <div class="flex flex-wrap gap-2 mb-5">
              <button 
                v-for="(abbr, day) in daysMap" 
                :key="day" 
                @click="toggleDay(day)"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                  selectedDays.includes(day) ? 'bg-fiery-navy text-white border-fiery-navy' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red'
                ]"
              >
                {{ abbr }}
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Apertura</span>
                <select v-model="openTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                  <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cierre</span>
                <select v-model="closeTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                  <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest">Redes Sociales</label>
            
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              </div>
              <input v-model="formData.socials.whatsapp" placeholder="WhatsApp (ej. 50212345678)" type="text" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-[#25D366]" />
            </div>

            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <input v-model="formData.socials.facebook" placeholder="Enlace de Facebook" type="text" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-[#1877F2]" />
            </div>

            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-[#E1306C]/10 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <input v-model="formData.socials.instagram" placeholder="Enlace de Instagram" type="text" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-[#E1306C]" />
            </div>
          </div>
        </div>

        <!-- Tab: Productos / Servicios -->
        <div v-show="activeTab === 'products'" class="space-y-6">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-black text-slate-500 uppercase tracking-widest">Inventario</h3>
            <button v-if="!showProductForm" @click="openNewProduct" class="bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors">
              + Agregar
            </button>
          </div>

          <div v-if="loadingProducts" class="flex justify-center py-10">
            <div class="w-8 h-8 border-4 border-fiery-navy border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- Product Form (Inline Sub-Panel) -->
          <div v-if="showProductForm" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
            <h4 class="text-xs font-black text-fiery-navy uppercase mb-4">{{ editingProduct ? 'Editar Elemento' : 'Nuevo Elemento' }}</h4>
            <div class="space-y-4">
              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="producto" v-model="productForm.tipo" class="text-fiery-navy focus:ring-fiery-navy" /> 
                  <span class="text-sm font-bold text-slate-600">Producto</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="servicio" v-model="productForm.tipo" class="text-fiery-navy focus:ring-fiery-navy" /> 
                  <span class="text-sm font-bold text-slate-600">Servicio</span>
                </label>
              </div>
              <input v-model="productForm.nombre" placeholder="Nombre" type="text" class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-fiery-navy font-bold text-slate-800" />
              <div class="relative">
                <textarea v-model="productForm.descripcion" placeholder="Descripción" rows="2" class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 pr-28 text-sm focus:outline-none focus:border-fiery-navy text-slate-600"></textarea>
                <button
                  type="button"
                  @click="generateDescription"
                  :disabled="!productForm.nombre?.trim() || generatingDesc"
                  class="absolute right-2 top-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="generatingDesc ? 'bg-slate-100 text-slate-400' : 'bg-fiery-navy/10 text-fiery-navy hover:bg-fiery-navy hover:text-white'"
                  title="Generar descripción con IA"
                >
                  <svg v-if="generatingDesc" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  <span v-else>✦</span>
                  {{ generatingDesc ? 'Generando...' : 'Generar con IA' }}
                </button>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Q</span>
                  <input v-model="productForm.precio" placeholder="0.00" type="number" min="0" step="0.01"
                    class="w-full border border-slate-200 bg-slate-50 rounded-xl pl-7 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:border-fiery-navy" />
                </div>
                <select v-model="productForm.visibilidad_precio"
                  class="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-fiery-navy">
                  <option value="VISIBLE">Mostrar</option>
                  <option value="APROXIMADO">~Aprox</option>
                  <option value="OCULTO">Consultar</option>
                </select>
              </div>

              <!-- Imágenes (solo para productos) -->
              <template v-if="productForm.tipo === 'producto'">
                <div v-if="editingProduct">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Imágenes actuales</p>
                  <div v-if="loadingImages" class="flex justify-center py-3">
                    <div class="w-5 h-5 border-2 border-fiery-navy border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div v-else-if="existingProductImages.length > 0" class="grid grid-cols-4 gap-2 mb-2">
                    <div v-for="img in existingProductImages" :key="img.id_imagen_producto" class="relative group h-16">
                      <img :src="img.url" class="w-full h-full object-cover rounded-lg" />
                      <button @click="deleteExistingImage(img)"
                        class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow">×</button>
                    </div>
                  </div>
                  <p v-else class="text-xs text-slate-400 mb-2">Sin imágenes aún</p>
                </div>

                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {{ editingProduct ? 'Agregar imágenes' : 'Imágenes' }}
                  </p>
                  <input type="file" ref="fileInputRef" accept="image/*" multiple class="hidden" @change="handleProductImageChange" />
                  <div v-if="newImageFiles.length > 0" class="grid grid-cols-3 gap-2 mb-1">
                    <div v-for="(item, idx) in newImageFiles" :key="idx" class="relative group h-20">
                      <img :src="item.preview" class="w-full h-full object-cover rounded-xl" />
                      <button @click.stop="removeNewImage(idx)"
                        class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow">×</button>
                    </div>
                    <div @click="triggerFileInput"
                      class="h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-fiery-navy transition-colors">
                      <span class="text-2xl text-slate-300 leading-none">+</span>
                    </div>
                  </div>
                  <div v-else @click="triggerFileInput" class="w-full h-[100px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-fiery-navy hover:bg-slate-100 transition-colors group">
                    <svg class="w-7 h-7 text-slate-300 group-hover:text-fiery-navy mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span class="text-xs font-bold text-slate-400 group-hover:text-fiery-navy transition-colors">Seleccionar imágenes</span>
                    <span class="text-[10px] text-slate-300 mt-0.5">Puedes elegir varias</span>
                  </div>
                </div>
              </template>

              <div class="flex gap-3 justify-end pt-2">
                <button @click="showProductForm = false" class="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
                <button @click="saveProduct" :disabled="loadingProducts" class="bg-fiery-navy hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50">Guardar</button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="products.length === 0 && !loadingProducts && !showProductForm" class="text-center py-12 px-4 bg-white rounded-2xl border border-slate-100 border-dashed">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <p class="text-slate-400 text-sm font-bold mb-4">Este negocio aún no tiene productos o servicios</p>
            <button @click="openNewProduct" class="bg-fiery-navy text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-800 transition-colors">
              Crear el primero
            </button>
          </div>

          <!-- Product List -->
          <div v-if="products.length > 0 && !loadingProducts" class="space-y-3">
            <div v-for="prod in products" :key="prod.id_producto" class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-slate-300 transition-colors relative">
              
              <div v-if="prod.tipo?.toLowerCase() === 'producto'" class="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300 border border-slate-200 shadow-inner hidden sm:flex">
                <img v-if="getProductThumbnail(prod)" :src="getProductThumbnail(prod)" class="w-full h-full object-cover" />
                <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <!-- Product/Service Badge -->
                  <span v-if="prod.tipo?.toLowerCase() === 'producto'" class="text-[9px] font-black uppercase text-blue-700 tracking-widest bg-blue-100 px-2 py-0.5 rounded-md">Producto</span>
                  <span v-else class="text-[9px] font-black uppercase text-purple-700 tracking-widest bg-purple-100 px-2 py-0.5 rounded-md">Servicio</span>
                  
                  <h4 class="font-bold text-slate-800 truncate">{{ prod.nombre }}</h4>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">{{ prod.descripcion }}</p>
              </div>

              <!-- Inline Delete Confirmation -->
              <div v-if="deletingId === prod.id_producto" class="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 w-full sm:w-auto">
                <span class="text-xs font-bold text-red-800 px-2">¿Eliminar?</span>
                <button @click="cancelDelete" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 bg-white border border-slate-200">Cancelar</button>
                <button @click="executeDelete(prod.id_producto)" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white bg-fiery-red hover:bg-red-700">Confirmar</button>
              </div>

              <!-- Normal Actions -->
              <div v-else class="flex gap-2 shrink-0 self-end sm:self-auto">
                <button @click="openEditProduct(prod)" title="Editar" class="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-fiery-navy transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button @click="askDelete(prod.id_producto)" title="Eliminar" class="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-fiery-red transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer (Sticky) only for General -->
      <div v-show="activeTab === 'general'" class="p-6 border-t border-slate-200 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
        <button @click="emit('close')" class="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-200">Cancelar</button>
        <button @click="saveGeneral" :disabled="loading" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>

    </div>

    <!-- Local Toast Container -->
    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="[
            'px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 w-80 pointer-events-auto',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          ]"
        >
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg v-if="toast.type === 'success'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <p class="text-sm font-bold tracking-tight">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { display: none; }
.custom-scrollbar::-webkit-scrollbar-track { display: none; }
.custom-scrollbar::-webkit-scrollbar-thumb { display: none;
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
</style>
