<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getCategories } from '../../services/businessService'
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
const loadingProducts = ref(false)
const showProductForm = ref(false)
const editingProduct = ref(null)
const productForm = ref({ tipo: 'producto', nombre: '', descripcion: '' })
const deletingId = ref(null)

// Product Image State
const productImageFile = ref(null)
const productImagePreview = ref(null)

const handleProductImageChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    productImageFile.value = file
    productImagePreview.value = URL.createObjectURL(file)
  }
}

const clearProductImage = () => {
  productImageFile.value = null
  productImagePreview.value = null
}

const fileInputRef = ref(null)
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(async () => {
  categories.value = await getCategories()
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
    productImageFile.value = null
    productImagePreview.value = null

    // Make sure we safely initialize socials
    formData.value = {
      ...props.business,
      socials: {
        whatsapp: props.business.socials?.whatsapp || '',
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
    products.value = res.data || []
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
    const loc = formData.value.locationData || {}
    const payload = {
      nombre: formData.value.name,
      descripcion: formData.value.description,
      categoria: formData.value.category,
      horario: formData.value.horario,
      whatsapp: formData.value.socials?.whatsapp,
      facebook: formData.value.socials?.facebook,
      instagram: formData.value.socials?.instagram,
      departamento: loc.departamento || null,
      municipio: loc.municipio || null,
      localidad: loc.localidad || null,
      direccion: loc.direccion || null,
      latitud: loc.lat || null,
      longitud: loc.lng || null
    }
    
    await api.put(`/emprendimientos/${props.business.id}`, payload)
    
    // Construir negocio actualizado para el state local
    const updatedBusiness = {
      ...props.business,
      name: payload.nombre,
      description: payload.descripcion,
      location: payload.direccion,
      category: payload.categoria,
      horario: payload.horario,
      socials: {
        whatsapp: payload.whatsapp,
        facebook: payload.facebook,
        instagram: payload.instagram
      }
    }
    
    showToast('Negocio guardado exitosamente', 'success')
    emit('saved', updatedBusiness)
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error al guardar los cambios'
    showToast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

// Product Actions
const openNewProduct = () => {
  editingProduct.value = null
  productForm.value = { tipo: 'producto', nombre: '', descripcion: '' }
  productImageFile.value = null
  productImagePreview.value = null
  showProductForm.value = true
}

const openEditProduct = (prod) => {
  editingProduct.value = prod
  productForm.value = { 
    tipo: prod.tipo?.toLowerCase() || 'producto', 
    nombre: prod.nombre, 
    descripcion: prod.descripcion 
  }
  productImageFile.value = null
  productImagePreview.value = prod.imagen || null
  showProductForm.value = true
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

    if (editingProduct.value) {
      await api.put(`/productos/${editingProduct.value.id_producto}`, productForm.value)
      savedProductId = editingProduct.value.id_producto
    } else {
      const payload = { ...productForm.value, id_emprendimiento: props.business.id }
      const res = await api.post(`/productos`, payload)
      // Extraer ID del nuevo producto asumiendo varias estructuras de respuesta posibles
      savedProductId = res.data?.id_producto || res.data?.id || res.data?.producto?.id_producto || res.data?.producto?.id
    }

    let imageFailed = false
    if (productImageFile.value && savedProductId) {
      try {
        const formData = new FormData()
        formData.append('id_producto', savedProductId)
        formData.append('imagen', productImageFile.value)
        
        await api.post('/imagenes/producto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (imgError) {
        console.error('Error al subir imagen:', imgError)
        imageFailed = true
      }
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
    
    <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[calc(100vh-96px)] flex flex-col relative shadow-2xl z-10 overflow-hidden mx-auto" tabindex="0">
      
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
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
        
        <!-- Tab: Información General -->
        <div v-show="activeTab === 'general'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Negocio</label>
              <input v-model="formData.name" type="text" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all" />
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
              <textarea v-model="formData.description" rows="3" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none focus:border-fiery-red transition-all"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación en el mapa</label>
              <LocationPicker v-model="formData.locationData" />
            </div>

            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
              <select v-model="formData.category" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
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
              <textarea v-model="productForm.descripcion" placeholder="Descripción" rows="2" class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-fiery-navy text-slate-600"></textarea>
              
              <!-- Image Upload Area -->
              <div class="mt-2">
                <input type="file" ref="fileInputRef" accept="image/*" class="hidden" @change="handleProductImageChange" />
                
                <div v-if="productImagePreview" class="relative w-full h-[120px] rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                  <img :src="productImagePreview" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button @click="triggerFileInput" class="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">Cambiar imagen</button>
                  </div>
                  <button @click.stop="clearProductImage" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-colors" title="Quitar imagen">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div v-else @click="triggerFileInput" class="w-full h-[120px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-fiery-navy hover:bg-slate-100 transition-colors group">
                  <svg class="w-8 h-8 text-slate-300 group-hover:text-fiery-navy mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span class="text-xs font-bold text-slate-400 group-hover:text-fiery-navy transition-colors">Agregar imagen opcional</span>
                </div>
              </div>

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
              
              <div class="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300 border border-slate-200 shadow-inner hidden sm:flex">
                <img v-if="prod.imagen" :src="prod.imagen" class="w-full h-full object-cover" />
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
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
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
