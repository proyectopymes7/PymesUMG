<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import LocationPicker from '../components/shared/LocationPicker.vue'
import { useAuthStore } from '../stores/auth'
import { getMyBusinesses, getRawCategories, updateBusinessData, getBusinessProducts, uploadImage } from '../services/businessService'
import api from '../services/api'

const router = useRouter()
const authStore = useAuthStore()

// ── Toasts ─────────────────────────────────────────────
const toasts = ref([])
const showToast = (msg, type = 'success') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, msg, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3500)
}

// ── State ───────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const business = ref(null)
const allBusinesses = ref([])
const categories = ref([])
const activeTab = ref('general')

// ── Status helpers ──────────────────────────────────────
const statusDot = (estado) => ({
  pendiente: 'bg-yellow-400',
  activo:    'bg-emerald-500',
  rechazado: 'bg-red-500',
  inactivo:  'bg-slate-400'
}[estado] ?? 'bg-slate-400')

const statusLabel = (estado) => ({
  pendiente: 'En revisión',
  activo:    'Publicado',
  rechazado: 'Rechazado',
  inactivo:  'Inactivo'
}[estado] ?? estado)

const statusBadgeClass = (estado) => ({
  pendiente: 'bg-yellow-100 text-yellow-700',
  activo:    'bg-emerald-100 text-emerald-700',
  rechazado: 'bg-red-100 text-red-700',
  inactivo:  'bg-slate-100 text-slate-500'
}[estado] ?? 'bg-slate-100 text-slate-500')

// ── Select / load a business into the form ──────────────
const selectBusiness = (b) => {
  business.value = b
  logoPreview.value = b.logo || null
  logoFile.value = null
  const rawWa = (b.socials?.whatsapp || '').replace('https://wa.me/', '')
  form.value = {
    nombre:      b.name || '',
    descripcion: b.description || '',
    whatsapp:    rawWa,
    facebook:    b.socials?.facebook || '',
    instagram:   b.socials?.instagram || '',
    horario:     b.horario || '',
    locationData: {
      lat:          b.lat || null,
      lng:          b.lng || null,
      departamento: b.departamento || '',
      municipio:    b.municipio || '',
      localidad:    b.localidad || '',
      direccion:    b.location || ''
    }
  }
  const rawIds = b.categorias_ids
  selectedCategorias.value = Array.isArray(rawIds)
    ? rawIds
    : (rawIds ? String(rawIds).split(',').map(Number).filter(Boolean) : [])
  selectedDays.value = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  activeTab.value = 'general'
  products.value = []
}

// ── Form ────────────────────────────────────────────────
const form = ref({
  nombre: '',
  descripcion: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  horario: '',
  locationData: { lat: null, lng: null, departamento: '', municipio: '', localidad: '', direccion: '' }
})

const selectedCategorias = ref([])

// Horario
const daysMap = { Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom' }
const selectedDays = ref([])
const openTime = ref('8:00 AM')
const closeTime = ref('5:00 PM')
const hours = (() => {
  const opts = []
  for (let i = 6; i <= 23; i++) {
    const h = i > 12 ? i - 12 : i
    const suffix = i >= 12 ? 'PM' : 'AM'
    opts.push(`${h}:00 ${suffix}`)
    opts.push(`${h}:30 ${suffix}`)
  }
  return opts
})()
const toggleDay = (day) => {
  selectedDays.value = selectedDays.value.includes(day)
    ? selectedDays.value.filter(d => d !== day)
    : [...selectedDays.value, day]
}

// ── Logo / Foto del negocio ─────────────────────────────
const logoPreview = ref(null)
const logoFile = ref(null)
const logoInputRef = ref(null)

const handleLogoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { showToast('La imagen no debe superar 5MB', 'error'); return }
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

// ── Productos ───────────────────────────────────────────
const products = ref([])
const loadingProducts = ref(false)
const showProductForm = ref(false)
const editingProduct = ref(null)
const deletingId = ref(null)
const productForm = ref({ tipo: 'producto', nombre: '', descripcion: '' })
const productImageFile = ref(null)
const productImagePreview = ref(null)
const productFileInputRef = ref(null)

const handleProductImageChange = (e) => {
  const file = e.target.files[0]
  if (file) { productImageFile.value = file; productImagePreview.value = URL.createObjectURL(file) }
}
const clearProductImage = () => { productImageFile.value = null; productImagePreview.value = null }

const openNewProduct = () => {
  editingProduct.value = null
  productForm.value = { tipo: 'producto', nombre: '', descripcion: '' }
  productImageFile.value = null
  productImagePreview.value = null
  showProductForm.value = true
}

const openEditProduct = (prod) => {
  editingProduct.value = prod
  productForm.value = { tipo: prod.tipo?.toLowerCase() || 'producto', nombre: prod.nombre, descripcion: prod.descripcion || '' }
  productImageFile.value = null
  productImagePreview.value = prod.imagen_url || null
  showProductForm.value = true
}

const fetchProducts = async () => {
  if (!business.value?.id) return
  loadingProducts.value = true
  try {
    const res = await api.get(`/productos/emprendimiento/${business.value.id}`)
    products.value = res.data?.data || []
  } catch (e) { console.error(e) }
  finally { loadingProducts.value = false }
}

const saveProduct = async () => {
  if (!productForm.value.nombre.trim()) { showToast('El nombre es requerido', 'error'); return }
  loadingProducts.value = true
  try {
    let savedId = null
    if (editingProduct.value) {
      await api.put(`/productos/${editingProduct.value.id_producto}`, productForm.value)
      savedId = editingProduct.value.id_producto
    } else {
      const res = await api.post('/productos', { ...productForm.value, id_emprendimiento: business.value.id })
      savedId = res.data?.data?.id_producto || res.data?.id_producto
    }
    if (productImageFile.value && savedId) {
      const fd = new FormData()
      fd.append('imagen', productImageFile.value)
      try { await api.post(`/imagenes/producto/${savedId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }) }
      catch (e) { showToast('Guardado, pero falló la imagen', 'error') }
    }
    showToast(editingProduct.value ? 'Producto actualizado' : 'Producto creado')
    showProductForm.value = false
    await fetchProducts()
  } catch (e) {
    showToast(e.response?.data?.message || 'Error al guardar', 'error')
  } finally { loadingProducts.value = false }
}

const askDelete = (id) => { deletingId.value = id }
const cancelDelete = () => { deletingId.value = null }
const executeDelete = async (id) => {
  try {
    await api.delete(`/productos/${id}`)
    products.value = products.value.filter(p => p.id_producto !== id)
    showToast('Eliminado correctamente')
  } catch (e) { showToast('Error al eliminar', 'error') }
  finally { deletingId.value = null }
}

// ── Load ────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [businesses, cats] = await Promise.all([
      getMyBusinesses(),
      getRawCategories(),
      authStore.refreshUser()   // sync role in case admin just approved a business
    ])
    categories.value = cats
    allBusinesses.value = businesses
    if (businesses.length > 0) selectBusiness(businesses[0])
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

watch(activeTab, async (val) => {
  if (val === 'products') await fetchProducts()
})

// ── Save general ────────────────────────────────────────
const saveGeneral = async () => {
  if (!business.value?.id) return
  saving.value = true
  try {
    const loc = form.value.locationData || {}
    const diasStr = selectedDays.value.join(', ')
    const horarioStr = selectedDays.value.length > 0 ? `${diasStr} ${openTime.value} - ${closeTime.value}` : ''

    const payload = {}
    if (form.value.nombre)        payload.nombre      = form.value.nombre.trim()
    if (form.value.descripcion)   payload.descripcion = form.value.descripcion.trim()
    if (selectedCategorias.value.length) payload.categorias = selectedCategorias.value
    if (horarioStr)               payload.horario     = horarioStr
    if (form.value.whatsapp)      payload.whatsapp    = form.value.whatsapp.trim()
    if (loc.departamento)         payload.departamento = loc.departamento
    if (loc.municipio)            payload.municipio    = loc.municipio
    if (loc.localidad)            payload.localidad    = loc.localidad
    if (loc.direccion)            payload.direccion    = loc.direccion
    if (loc.lat)                  payload.latitud      = loc.lat
    if (loc.lng)                  payload.longitud     = loc.lng

    await updateBusinessData(business.value.id, payload)

    // Subir logo si hay (2 pasos: upload → URL → guardar en negocio)
    if (logoFile.value) {
      try {
        const logoUrl = await uploadImage(logoFile.value, 'logos')
        await updateBusinessData(business.value.id, { logo_url: logoUrl })
        business.value = { ...business.value, logo: logoUrl, image: logoUrl }
        logoPreview.value = logoUrl
        logoFile.value = null
      } catch (e) { showToast('Datos guardados, pero falló la foto', 'error') }
    }

    showToast('Negocio actualizado correctamente')
  } catch (e) {
    const details = e.response?.data?.details
    const msg = Array.isArray(details) && details[0]?.msg
      ? `Error: ${details[0].msg}`
      : e.response?.data?.message || 'Error al guardar'
    showToast(msg, 'error')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />

    <!-- Toasts -->
    <div class="fixed bottom-6 right-4 sm:right-6 z-[300] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold text-white"
          :class="t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'">
          <span>{{ t.type === 'success' ? '✓' : '✕' }}</span>{{ t.msg }}
        </div>
      </transition-group>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="w-12 h-12 border-4 border-fiery-red border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Sin negocios registrados -->
    <div v-else-if="allBusinesses.length === 0" class="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <div class="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-2">
        <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-fiery-navy uppercase tracking-tighter">Aún no tienes negocios</h2>
      <p class="text-slate-500 text-sm max-w-sm">Registra tu primer negocio gratis y conéctate con clientes en toda Guatemala.</p>
      <button @click="router.push('/registrar-negocio')" class="mt-2 bg-fiery-red text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-fiery-darkred transition-all shadow-lg">
        Registrar mi negocio
      </button>
    </div>

    <!-- Panel principal -->
    <main v-else class="pb-20">

      <!-- ── Selector de negocios ── -->
      <div class="pt-[88px] bg-white border-b border-slate-100">
        <div class="container mx-auto px-4 sm:px-6 max-w-3xl py-3">
          <div class="flex items-center gap-2 overflow-x-auto trader-scroll pb-0.5">
            <button v-for="b in allBusinesses" :key="b.id"
              @click="selectBusiness(b)"
              :class="['flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap flex-shrink-0 border',
                business?.id === b.id
                  ? 'bg-fiery-navy text-white border-fiery-navy'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-fiery-navy hover:text-fiery-navy']">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="statusDot(b.estado)"></span>
              {{ b.name }}
            </button>
            <button @click="router.push('/registrar-negocio')"
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-white text-fiery-red border border-fiery-red/40 hover:bg-fiery-red hover:text-white transition-all whitespace-nowrap flex-shrink-0">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Agregar negocio
            </button>
          </div>
        </div>
      </div>

      <!-- ── Contenido ── -->
      <div class="container mx-auto px-4 sm:px-6 max-w-3xl pt-8">

        <!-- ── Banner de estado ── -->
        <div v-if="business.estado === 'pendiente'"
          class="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
          <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          <div>
            <p class="text-sm font-black text-yellow-800">En revisión</p>
            <p class="text-xs text-yellow-700 mt-0.5">Tu negocio está siendo revisado por el equipo. Puedes actualizar la información mientras esperas la aprobación.</p>
          </div>
        </div>

        <div v-if="business.estado === 'rechazado'"
          class="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div>
            <p class="text-sm font-black text-red-800">Negocio rechazado</p>
            <p class="text-xs text-red-700 mt-0.5">Tu negocio no fue aprobado. Actualiza la información y guarda los cambios para que el equipo lo revise nuevamente.</p>
          </div>
        </div>

      <!-- Header con logo del negocio -->
      <div class="mb-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
        <!-- Logo editable -->
        <div class="relative group flex-shrink-0">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
            <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center bg-fiery-navy text-white font-black text-4xl uppercase">
              {{ business.name?.charAt(0) || '?' }}
            </div>
          </div>
          <button @click="logoInputRef?.click()"
            class="absolute bottom-0 right-0 w-8 h-8 bg-fiery-red text-white rounded-full flex items-center justify-center shadow-md hover:bg-fiery-darkred transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
          <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="handleLogoChange" />
        </div>
        <div class="text-center sm:text-left">
          <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-1">Mi Negocio</h4>
          <h1 class="text-3xl sm:text-4xl font-black text-fiery-navy uppercase tracking-tighter leading-none">{{ business.name }}</h1>
          <div class="flex items-center gap-2 mt-1.5 justify-center sm:justify-start flex-wrap">
            <span class="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" :class="statusBadgeClass(business.estado)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(business.estado)"></span>
              {{ statusLabel(business.estado) }}
            </span>
            <p class="text-slate-400 text-sm">{{ business.location || 'Sin ubicación' }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-2xl p-1.5 flex gap-1 mb-6 shadow-sm border border-slate-100">
        <button @click="activeTab = 'general'"
          :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', activeTab === 'general' ? 'bg-fiery-navy text-white shadow-md' : 'text-slate-400 hover:text-slate-600']">
          Información General
        </button>
        <button @click="activeTab = 'products'"
          :class="['flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', activeTab === 'products' ? 'bg-fiery-navy text-white shadow-md' : 'text-slate-400 hover:text-slate-600']">
          Productos / Servicios
        </button>
      </div>

      <!-- ═══ TAB GENERAL ═══ -->
      <div v-if="activeTab === 'general'" class="space-y-5">

        <!-- Nombre y descripción -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos del Negocio</p>
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Negocio</label>
            <input v-model="form.nombre" type="text"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-fiery-navy focus:outline-none focus:ring-2 focus:ring-fiery-navy/20 focus:border-fiery-navy transition-all" />
          </div>
          <div>
            <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
            <textarea v-model="form.descripcion" rows="4"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fiery-navy/20 focus:border-fiery-navy transition-all resize-none"></textarea>
          </div>
        </div>

        <!-- Categorías -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Categorías <span class="text-slate-300 font-normal normal-case">(mín. 1, máx. 3)</span>
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button v-for="cat in categories" :key="cat.id_categoria" type="button"
              :disabled="!selectedCategorias.includes(cat.id_categoria) && selectedCategorias.length >= 3"
              @click="selectedCategorias.includes(cat.id_categoria)
                ? selectedCategorias.splice(selectedCategorias.indexOf(cat.id_categoria), 1)
                : selectedCategorias.push(cat.id_categoria)"
              :class="[
                'px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border text-left',
                selectedCategorias.includes(cat.id_categoria) ? 'bg-fiery-navy text-white border-fiery-navy' : 'bg-white text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red',
                (!selectedCategorias.includes(cat.id_categoria) && selectedCategorias.length >= 3) ? 'opacity-40 cursor-not-allowed' : ''
              ]">{{ cat.nombre }}</button>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ubicación en el Mapa</p>
          <LocationPicker v-model="form.locationData" />
        </div>

        <!-- Horario -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Horario de Atención</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="(abbr, day) in daysMap" :key="day" @click="toggleDay(day)"
              :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all border', selectedDays.includes(day) ? 'bg-fiery-navy text-white border-fiery-navy' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red']">
              {{ abbr }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Apertura</span>
              <select v-model="openTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cierre</span>
              <select v-model="closeTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-red">
                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Redes sociales -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Redes Sociales y Contacto</p>
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

        <!-- Botón guardar -->
        <button @click="saveGeneral" :disabled="saving"
          class="w-full bg-fiery-red hover:bg-fiery-darkred text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 flex items-center justify-center gap-2 disabled:opacity-60">
          <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>

      <!-- ═══ TAB PRODUCTOS ═══ -->
      <div v-if="activeTab === 'products'" class="space-y-4">
        <div class="flex justify-between items-center">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventario</p>
          <button v-if="!showProductForm" @click="openNewProduct"
            class="bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity shadow-md">
            + Agregar
          </button>
        </div>

        <!-- Formulario producto inline -->
        <div v-if="showProductForm" class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 class="text-xs font-black text-fiery-navy uppercase">{{ editingProduct ? 'Editar' : 'Nuevo' }} Elemento</h4>

          <!-- Tipo con badges visuales -->
          <div class="flex gap-3">
            <button @click="productForm.tipo = 'producto'" type="button"
              :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all', productForm.tipo === 'producto' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300']">
              <span class="w-2 h-2 rounded-full bg-current"></span>
              Producto
            </button>
            <button @click="productForm.tipo = 'servicio'" type="button"
              :class="['flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all', productForm.tipo === 'servicio' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-purple-300']">
              <span class="w-2 h-2 rounded-full bg-current"></span>
              Servicio
            </button>
          </div>

          <input v-model="productForm.nombre" placeholder="Nombre *" type="text"
            class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-fiery-navy" />
          <textarea v-model="productForm.descripcion" placeholder="Descripción (opcional)" rows="2"
            class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-fiery-navy resize-none"></textarea>

          <!-- Imagen producto -->
          <input type="file" ref="productFileInputRef" accept="image/*" class="hidden" @change="handleProductImageChange" />
          <div v-if="productImagePreview" class="relative w-full h-[110px] rounded-xl overflow-hidden border border-slate-200 group">
            <img :src="productImagePreview" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button @click="productFileInputRef?.click()" class="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Cambiar</button>
              <button @click="clearProductImage" class="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Quitar</button>
            </div>
          </div>
          <div v-else @click="productFileInputRef?.click()"
            class="w-full h-[110px] rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-fiery-navy hover:bg-slate-50 transition-colors">
            <svg class="w-7 h-7 text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="text-xs font-bold text-slate-400">Agregar imagen (opcional)</span>
          </div>

          <div class="flex gap-3 justify-end pt-1">
            <button @click="showProductForm = false" class="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
            <button @click="saveProduct" :disabled="loadingProducts"
              class="bg-fiery-navy text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50">
              Guardar
            </button>
          </div>
        </div>

        <!-- Loading productos -->
        <div v-if="loadingProducts && !showProductForm" class="flex justify-center py-10">
          <div class="w-8 h-8 border-4 border-fiery-navy border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Sin productos -->
        <div v-else-if="products.length === 0 && !showProductForm"
          class="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <p class="text-slate-400 font-bold text-sm mb-4">Este negocio aún no tiene productos o servicios</p>
          <button @click="openNewProduct" class="bg-fiery-navy text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity shadow-md">
            Crear el primero
          </button>
        </div>

        <!-- Lista productos -->
        <div v-else-if="products.length > 0 && !loadingProducts" class="space-y-3">
          <div v-for="prod in products" :key="prod.id_producto"
            class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-slate-300 transition-colors">

            <!-- Imagen -->
            <div class="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300 border border-slate-200 hidden sm:flex">
              <img v-if="prod.imagen_url" :src="prod.imagen_url" class="w-full h-full object-cover" />
              <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <!-- Badge tipo con colores distintivos -->
                <span v-if="prod.tipo?.toLowerCase() === 'producto'"
                  class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Producto
                </span>
                <span v-else
                  class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Servicio
                </span>
                <h4 class="font-bold text-slate-800 truncate text-sm">{{ prod.nombre }}</h4>
              </div>
              <p v-if="prod.descripcion" class="text-xs text-slate-500 line-clamp-1">{{ prod.descripcion }}</p>
            </div>

            <!-- Confirmar eliminar -->
            <div v-if="deletingId === prod.id_producto" class="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 w-full sm:w-auto">
              <span class="text-xs font-bold text-red-700 px-1">¿Eliminar?</span>
              <button @click="cancelDelete" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-white border border-slate-200">No</button>
              <button @click="executeDelete(prod.id_producto)" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white bg-fiery-red hover:bg-fiery-darkred">Sí</button>
            </div>

            <!-- Acciones -->
            <div v-else class="flex gap-2 flex-shrink-0 self-end sm:self-auto">
              <button @click="openEditProduct(prod)" title="Editar"
                class="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-fiery-navy transition-colors border border-slate-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button @click="askDelete(prod.id_producto)" title="Eliminar"
                class="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-fiery-red transition-colors border border-slate-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      </div><!-- /container -->
    </main>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.trader-scroll { scrollbar-width: none; }
.trader-scroll::-webkit-scrollbar { display: none; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateX(110%); }
.toast-leave-to   { opacity: 0; transform: translateX(110%); }
</style>