<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import LocationPicker from '../components/shared/LocationPicker.vue'
import { useAuthStore } from '../stores/auth'
import { getRawCategories } from '../services/businessService'
import api from '../services/api'

const router = useRouter()
const authStore = useAuthStore()

// ── Toasts ─────────────────────────────────────────────
const toasts = ref([])
const showToast = (message, type = 'success') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 4000)
}

// ── Steps ───────────────────────────────────────────────
const currentStep = ref(1)
const totalSteps = 3

// ── Form state ──────────────────────────────────────────
const submitting = ref(false)
const categories = ref([])
const selectedCategorias = ref([])

// ── Foto del negocio (opcional) ─────────────────────────
const businessImageFile = ref(null)
const businessImagePreview = ref(null)
const businessImageInputRef = ref(null)

const handleBusinessImageChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    showToast('La imagen no debe superar 5MB', 'error')
    return
  }
  businessImageFile.value = file
  businessImagePreview.value = URL.createObjectURL(file)
}

const clearBusinessImage = () => {
  businessImageFile.value = null
  businessImagePreview.value = null
  if (businessImageInputRef.value) businessImageInputRef.value.value = ''
}

const form = ref({
  nombre: '',
  descripcion: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  horario: '',
  locationData: {
    lat: null, lng: null,
    departamento: '', municipio: '', localidad: '', direccion: ''
  }
})

// Horario
const daysMap = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié',
  Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom'
}
const days = Object.keys(daysMap)
const selectedDays = ref(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])
const openTime = ref('8:00 AM')
const closeTime = ref('5:00 PM')
const hours = (() => {
  const opts = []
  for (let i = 6; i <= 23; i++) {
    const h = i > 12 ? i - 12 : i === 0 ? 12 : i
    const suffix = i >= 12 ? 'PM' : 'AM'
    opts.push(`${h}:00 ${suffix}`)
    opts.push(`${h}:30 ${suffix}`)
  }
  return opts
})()

const toggleDay = (day) => {
  if (selectedDays.value.includes(day)) {
    selectedDays.value = selectedDays.value.filter(d => d !== day)
  } else {
    selectedDays.value.push(day)
  }
}

// Productos
const products = ref([])
const showProductForm = ref(false)
const editingProduct = ref(null)
const productForm = ref({ tipo: 'producto', nombre: '', descripcion: '', precio: '' })
const productImageFile = ref(null)
const productImagePreview = ref(null)
const fileInputRef = ref(null)
const deletingId = ref(null)

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
const triggerFileInput = () => fileInputRef.value?.click()

const openNewProduct = () => {
  editingProduct.value = null
  productForm.value = { tipo: 'producto', nombre: '', descripcion: '' }
  productImageFile.value = null
  productImagePreview.value = null
  showProductForm.value = true
}

const openEditProduct = (prod) => {
  editingProduct.value = prod
  productForm.value = { tipo: prod.tipo || 'producto', nombre: prod.nombre, descripcion: prod.descripcion || '', precio: prod.precio ?? '' }
  productImageFile.value = null
  productImagePreview.value = prod.imagen || null
  showProductForm.value = true
}

const saveProductLocal = () => {
  if (!productForm.value.nombre.trim()) {
    showToast('El nombre del producto es requerido', 'error')
    return
  }
  if (editingProduct.value !== null) {
    const idx = products.value.findIndex(p => p._localId === editingProduct.value._localId)
    if (idx !== -1) {
      products.value[idx] = {
        ...products.value[idx],
        ...productForm.value,
        imagen: productImagePreview.value,
        imageFile: productImageFile.value
      }
    }
  } else {
    products.value.push({
      _localId: Date.now(),
      ...productForm.value,
      precio: productForm.value.precio ? Number(productForm.value.precio) : null,
      imagen: productImagePreview.value,
      imageFile: productImageFile.value
    })
  }
  showProductForm.value = false
  editingProduct.value = null
}

const deleteProduct = (localId) => {
  products.value = products.value.filter(p => p._localId !== localId)
  deletingId.value = null
}

// ── Errors ──────────────────────────────────────────────
const errors = ref({})

const validateStep = (step) => {
  errors.value = {}
  if (step === 1) {
    if (!form.value.nombre.trim() || form.value.nombre.trim().length < 2) {
      errors.value.nombre = 'El nombre debe tener al menos 2 caracteres'
    }
    if (!form.value.descripcion.trim() || form.value.descripcion.trim().length < 10) {
      errors.value.descripcion = 'La descripción debe tener al menos 10 caracteres'
    }
    if (selectedCategorias.value.length === 0) {
      errors.value.categorias = 'Selecciona al menos una categoría'
    }
  }
  return Object.keys(errors.value).length === 0
}

const nextStep = () => {
  if (!validateStep(currentStep.value)) return
  currentStep.value++
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const prevStep = () => {
  currentStep.value--
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Submit ───────────────────────────────────────────────
const submitRequest = async () => {
  if (!authStore.isAuthenticated) {
    showToast('Debes iniciar sesión para enviar una solicitud', 'error')
    router.push('/login')
    return
  }

  submitting.value = true
  try {
    const diasStr = selectedDays.value.join(', ')
    const horarioStr = selectedDays.value.length > 0
      ? `${diasStr} ${openTime.value} - ${closeTime.value}`
      : ''

    const loc = form.value.locationData || {}

    const payload = {
      nombre:       form.value.nombre.trim(),
      descripcion:  form.value.descripcion.trim(),
      id_categoria: selectedCategorias.value[0],
      estado:       'pendiente'
    }

    if (horarioStr)           payload.horario      = horarioStr
    if (form.value.whatsapp)  payload.whatsapp     = form.value.whatsapp.trim()
    payload.facebook  = (form.value.facebook  || '').trim()
    payload.instagram = (form.value.instagram || '').trim()
    if (loc.departamento)     payload.departamento = loc.departamento
    if (loc.municipio)        payload.municipio    = loc.municipio
    if (loc.localidad)        payload.localidad    = loc.localidad
    if (loc.direccion)        payload.direccion    = loc.direccion
    if (loc.lat)              payload.latitud      = loc.lat
    if (loc.lng)              payload.longitud     = loc.lng

    // 1. Crear el emprendimiento
    const res = await api.post('/emprendimientos', payload)
    const newId = res.data?.data?.id_emprendimiento

    // 2. Subir foto del negocio si hay
    if (newId && businessImageFile.value) {
      try {
        const fd = new FormData()
        fd.append('imagen', businessImageFile.value)
        await api.post(`/imagenes/emprendimiento/${newId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (imgErr) {
        console.warn('No se pudo subir la foto del negocio:', imgErr)
      }
    }

    // 3. Subir productos si hay
    if (newId && products.value.length > 0) {
      for (const prod of products.value) {
        try {
          const prodPayload = {
            id_emprendimiento: newId,
            nombre:      prod.nombre,
            descripcion: prod.descripcion || '',
            tipo:        prod.tipo,
            ...(prod.precio ? { precio: Number(prod.precio) } : {})
          }
          const prodRes = await api.post('/productos', prodPayload)
          const prodId = prodRes.data?.data?.id_producto || prodRes.data?.id_producto

          if (prod.imageFile && prodId) {
            const fd = new FormData()
            fd.append('imagen', prod.imageFile)
            await api.post(`/imagenes/producto/${prodId}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          }
        } catch (prodErr) {
          console.warn('Error al crear producto:', prodErr)
        }
      }
    }

    showToast('¡Solicitud enviada! El administrador la revisará pronto.', 'success')
    setTimeout(() => router.push('/'), 2500)
  } catch (error) {
    const details = error.response?.data?.details
    const msg = Array.isArray(details) && details[0]?.msg
      ? `Error: ${details[0].msg}`
      : error.response?.data?.message || error.response?.data?.error || 'Error al enviar la solicitud'
    showToast(msg, 'error')
  } finally {
    submitting.value = false
  }
}

const onKeydown = (e) => { if (e.key === 'Escape') router.back() }
onMounted(async () => {
  categories.value = await getRawCategories()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />

    <!-- Toasts -->
    <div class="fixed bottom-6 right-4 sm:right-6 z-[300] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      <transition-group name="toast">
        <div
          v-for="toast in toasts" :key="toast.id"
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
      <div class="mb-8">
        <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-2">Nuevo Negocio</h4>
        <h1 class="text-3xl sm:text-4xl font-black text-fiery-navy uppercase tracking-tighter">
          Registra tu <span class="text-fiery-red">Negocio</span>
        </h1>
        <p class="text-slate-500 text-sm mt-2">Completa la información y envía tu solicitud. El administrador la revisará y te notificará.</p>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center gap-2 mb-8">
        <div v-for="step in totalSteps" :key="step" class="flex items-center gap-2 flex-1">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs transition-all flex-shrink-0"
            :class="step < currentStep ? 'bg-emerald-500 text-white' : step === currentStep ? 'bg-fiery-navy text-white' : 'bg-slate-200 text-slate-400'"
          >
            <svg v-if="step < currentStep" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
            <span v-else>{{ step }}</span>
          </div>
          <div v-if="step < totalSteps" class="flex-1 h-0.5 rounded-full" :class="step < currentStep ? 'bg-emerald-500' : 'bg-slate-200'"></div>
        </div>
      </div>

      <!-- ═══ STEP 1: Información general ═══ -->
      <div v-if="currentStep === 1" class="space-y-5">

        <!-- Foto del negocio (opcional) -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto del Negocio</p>
            <span class="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Opcional</span>
          </div>

          <input ref="businessImageInputRef" type="file" accept="image/*" class="hidden" @change="handleBusinessImageChange" />

          <!-- Preview -->
          <div v-if="businessImagePreview" class="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 group">
            <img :src="businessImagePreview" class="w-full h-full object-cover" alt="Foto del negocio" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button @click="businessImageInputRef?.click()" class="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm">
                Cambiar foto
              </button>
              <button @click="clearBusinessImage" class="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm">
                Quitar
              </button>
            </div>
            <!-- Badge esquina -->
            <div class="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Foto seleccionada
            </div>
          </div>

          <!-- Drop zone -->
          <div v-else
            @click="businessImageInputRef?.click()"
            class="w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-fiery-navy hover:bg-slate-100 transition-all group">
            <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm group-hover:border-fiery-navy transition-colors">
              <svg class="w-7 h-7 text-slate-300 group-hover:text-fiery-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <p class="text-sm font-bold text-slate-400 group-hover:text-fiery-navy transition-colors">Subir foto del negocio</p>
            <p class="text-xs text-slate-300 mt-1">JPG, PNG o WEBP · Máx. 5MB</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Información General</p>

          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Negocio *</label>
            <input
              v-model="form.nombre" type="text" maxlength="100"
              placeholder="Ej. Café El Despertar"
              :class="['w-full border rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 transition-all', errors.nombre ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
            />
            <p v-if="errors.nombre" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.nombre }}</p>
          </div>

          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción *</label>
            <textarea
              v-model="form.descripcion" rows="4" maxlength="1000"
              placeholder="Describe tu negocio, qué ofreces, quiénes son, etc. (mín. 10 caracteres)"
              :class="['w-full border rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all resize-none', errors.descripcion ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-fiery-navy/20 focus:border-fiery-navy']"
            ></textarea>
            <div class="flex justify-between mt-1">
              <p v-if="errors.descripcion" class="text-[10px] text-red-500 font-bold">{{ errors.descripcion }}</p>
              <p class="text-[10px] text-slate-400 ml-auto">{{ form.descripcion.length }}/1000</p>
            </div>
          </div>

          <!-- Categorías -->
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Categoría * <span class="text-slate-300 font-normal normal-case">(mín. 1, máx. 3)</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="cat in categories" :key="cat.id_categoria"
                type="button"
                :disabled="!selectedCategorias.includes(cat.id_categoria) && selectedCategorias.length >= 3"
                @click="selectedCategorias.includes(cat.id_categoria)
                  ? selectedCategorias.splice(selectedCategorias.indexOf(cat.id_categoria), 1)
                  : selectedCategorias.push(cat.id_categoria)"
                :class="[
                  'px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border text-left',
                  selectedCategorias.includes(cat.id_categoria)
                    ? 'bg-fiery-navy text-white border-fiery-navy'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red',
                  (!selectedCategorias.includes(cat.id_categoria) && selectedCategorias.length >= 3)
                    ? 'opacity-40 cursor-not-allowed' : ''
                ]"
              >{{ cat.nombre }}</button>
            </div>
            <p v-if="errors.categorias" class="text-[10px] text-red-500 font-bold mt-1">{{ errors.categorias }}</p>
          </div>
        </div>

        <!-- Redes Sociales -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contacto y Redes Sociales</p>

          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-green-100">
              <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </div>
            <input v-model="form.whatsapp" type="tel" placeholder="502XXXXXXXX"
              class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all" />
          </div>

          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-100">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <input v-model="form.facebook" type="url" placeholder="https://facebook.com/tu_negocio"
              class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>

          <div class="flex items-center gap-3">
            <div class="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-pink-100">
              <svg class="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </div>
            <input v-model="form.instagram" type="url" placeholder="https://instagram.com/tu_negocio"
              class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all" />
          </div>
        </div>
      </div>

      <!-- ═══ STEP 2: Ubicación y horario ═══ -->
      <div v-if="currentStep === 2" class="space-y-5">

        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ubicación del Negocio</p>
          <LocationPicker v-model="form.locationData" />
        </div>

        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Horario de Atención</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(abbr, day) in daysMap" :key="day"
              @click="toggleDay(day)"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                selectedDays.includes(day) ? 'bg-fiery-navy text-white border-fiery-navy' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red'
              ]"
            >{{ abbr }}</button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Apertura</label>
              <select v-model="openTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cierre</label>
              <select v-model="closeTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ STEP 3: Productos/Servicios ═══ -->
      <div v-if="currentStep === 3" class="space-y-5">
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Productos / Servicios</p>
              <p class="text-xs text-slate-400 mt-0.5">Opcional — puedes agregarlos después</p>
            </div>
            <button v-if="!showProductForm" @click="openNewProduct"
              class="bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
              + Agregar
            </button>
          </div>

          <!-- Formulario inline producto -->
          <div v-if="showProductForm" class="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 mb-4">
            <h4 class="text-xs font-black text-fiery-navy uppercase">{{ editingProduct ? 'Editar' : 'Nuevo' }} Elemento</h4>
            <div class="flex gap-5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="producto" v-model="productForm.tipo" class="text-fiery-navy" />
                <span class="text-sm font-bold text-slate-600">Producto</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="servicio" v-model="productForm.tipo" class="text-fiery-navy" />
                <span class="text-sm font-bold text-slate-600">Servicio</span>
              </label>
            </div>
            <input v-model="productForm.nombre" placeholder="Nombre *" type="text"
              class="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-fiery-navy" />
            <textarea v-model="productForm.descripcion" placeholder="Descripción (opcional)" rows="2"
              class="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-navy resize-none"></textarea>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Q</span>
              <input v-model="productForm.precio" placeholder="Precio (opcional)" type="number" min="0" step="0.01"
                class="w-full border border-slate-200 bg-white rounded-xl pl-7 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-fiery-navy" />
            </div>

            <!-- Imagen -->
            <input type="file" ref="fileInputRef" accept="image/*" class="hidden" @change="handleProductImageChange" />
            <div v-if="productImagePreview" class="relative w-full h-[110px] rounded-xl overflow-hidden border border-slate-200 group">
              <img :src="productImagePreview" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button @click="triggerFileInput" class="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Cambiar</button>
                <button @click="clearProductImage" class="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Quitar</button>
              </div>
            </div>
            <div v-else @click="triggerFileInput"
              class="w-full h-[110px] rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-fiery-navy hover:bg-slate-50 transition-colors">
              <svg class="w-7 h-7 text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-xs font-bold text-slate-400">Agregar imagen (opcional)</span>
            </div>

            <div class="flex gap-3 justify-end pt-1">
              <button @click="showProductForm = false" class="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button @click="saveProductLocal" class="bg-fiery-navy text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">Guardar</button>
            </div>
          </div>

          <!-- Lista de productos -->
          <div v-if="products.length === 0 && !showProductForm" class="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
            <p class="text-slate-400 text-sm font-bold">Sin productos aún</p>
            <p class="text-slate-300 text-xs mt-1">Puedes agregarlos ahora o después desde tu panel</p>
          </div>

          <div v-else-if="products.length > 0" class="space-y-3">
            <div v-for="prod in products" :key="prod._localId"
              class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
              <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300">
                <img v-if="prod.imagen" :src="prod.imagen" class="w-full h-full object-cover" />
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span :class="['text-[9px] font-black uppercase px-2 py-0.5 rounded-md', prod.tipo === 'producto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700']">
                    {{ prod.tipo }}
                  </span>
                  <span class="font-bold text-slate-800 text-sm truncate">{{ prod.nombre }}</span>
                </div>
                <p v-if="prod.descripcion" class="text-xs text-slate-500 truncate">{{ prod.descripcion }}</p>
              </div>
              <div v-if="deletingId === prod._localId" class="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                <span class="text-xs font-bold text-red-700">¿Eliminar?</span>
                <button @click="deletingId = null" class="px-2 py-1 rounded-lg text-xs font-bold text-slate-500 bg-white border border-slate-200">No</button>
                <button @click="deleteProduct(prod._localId)" class="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-fiery-red">Sí</button>
              </div>
              <div v-else class="flex gap-1.5 flex-shrink-0">
                <button @click="openEditProduct(prod)" class="p-2 rounded-xl bg-white text-slate-400 hover:text-fiery-navy hover:bg-slate-100 transition-colors border border-slate-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button @click="deletingId = prod._localId" class="p-2 rounded-xl bg-white text-slate-400 hover:text-fiery-red hover:bg-red-50 transition-colors border border-slate-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen antes de enviar -->
        <div class="bg-fiery-navy/5 border border-fiery-navy/10 rounded-3xl p-6 space-y-2">
          <p class="text-[10px] font-black uppercase tracking-widest text-fiery-navy mb-3">Resumen de tu solicitud</p>
          <p class="text-sm text-slate-600"><span class="font-bold text-fiery-navy">Negocio:</span> {{ form.nombre }}</p>
          <p class="text-sm text-slate-600"><span class="font-bold text-fiery-navy">Foto:</span>
            {{ businessImageFile ? '✓ Imagen seleccionada' : 'Sin foto (puedes agregarla después)' }}
          </p>
          <p class="text-sm text-slate-600"><span class="font-bold text-fiery-navy">Categorías:</span>
            {{ categories.filter(c => selectedCategorias.includes(c.id_categoria)).map(c => c.nombre).join(', ') || '—' }}
          </p>
          <p class="text-sm text-slate-600"><span class="font-bold text-fiery-navy">Ubicación:</span>
            {{ form.locationData?.municipio ? `${form.locationData.municipio}, ${form.locationData.departamento}` : 'No especificada' }}
          </p>
          <p class="text-sm text-slate-600"><span class="font-bold text-fiery-navy">Productos/Servicios:</span> {{ products.length }}</p>
          <div class="pt-2 border-t border-fiery-navy/10">
            <p class="text-xs text-slate-500">Al enviar, tu solicitud quedará como <strong>pendiente</strong> hasta que un administrador la apruebe.</p>
          </div>
        </div>
      </div>

      <!-- Navegación entre steps -->
      <div class="flex flex-col sm:flex-row gap-3 mt-8" :class="currentStep > 1 ? 'justify-between' : 'justify-end'">
        <button v-if="currentStep > 1" @click="prevStep"
          class="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all">
          ← Anterior
        </button>

        <button v-if="currentStep < totalSteps" @click="nextStep"
          class="w-full sm:w-auto bg-fiery-navy hover:opacity-90 text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">
          Siguiente →
        </button>

        <button v-if="currentStep === totalSteps" @click="submitRequest" :disabled="submitting"
          class="w-full sm:w-auto bg-fiery-red hover:bg-fiery-darkred text-white px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 flex items-center justify-center gap-2 disabled:opacity-60">
          <div v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {{ submitting ? 'Enviando...' : 'Enviar Solicitud' }}
        </button>
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