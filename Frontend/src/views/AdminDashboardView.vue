<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import { getAllBusinesses, getPendingBusinesses, updateBusinessStatus, getAllUsers, updateUserRole, deleteBusinessById } from '../services/businessService'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

// Import Modals
import EditBusinessModal from '../components/admin/EditBusinessModal.vue'

// Local Toast System
const toasts = ref([])
const showToast = (message, type = 'success') => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3500)
}

const activeTab = ref('requests')
const pendingRequests = ref([])
const allBusinesses = ref([])

// ── Categorías ──────────────────────────────────────────
const allCategories = ref([])
const catForm = ref({ nombre: '', descripcion: '' })
const editingCat = ref(null)
const showCatForm = ref(false)
const savingCat = ref(false)
const generatingCatDesc = ref(false)

const generateCategoryDescription = async () => {
  if (!catForm.value.nombre?.trim() || generatingCatDesc.value) return
  generatingCatDesc.value = true
  try {
    const res = await api.post('/ai/generate-description', {
      nombre: catForm.value.nombre,
      tipo: 'categoría de negocio'
    })
    if (res.data?.descripcion) catForm.value.descripcion = res.data.descripcion
  } catch { /* silent */ } finally { generatingCatDesc.value = false }
}

const fetchCategories = async () => {
  const res = await api.get('/categories')
  allCategories.value = res.data?.data || []
}
const openNewCat = () => {
  editingCat.value = null
  catForm.value = { nombre: '', descripcion: '' }
  showCatForm.value = true
}
const openEditCat = (cat) => {
  editingCat.value = cat
  catForm.value = { nombre: cat.nombre, descripcion: cat.descripcion || '' }
  showCatForm.value = true
}
const saveCat = async () => {
  if (!catForm.value.nombre.trim()) return
  savingCat.value = true
  try {
    if (editingCat.value) {
      await api.put(`/categories/${editingCat.value.id_categoria}`, catForm.value)
      showToast('Categoría actualizada')
    } else {
      await api.post('/categories', { ...catForm.value, activo: true })
      showToast('Categoría creada')
    }
    showCatForm.value = false
    await fetchCategories()
  } catch { showToast('Error al guardar', 'error') } finally { savingCat.value = false }
}
const toggleCatActive = async (cat) => {
  try {
    await api.put(`/categories/${cat.id_categoria}`, { activo: !cat.activo })
    cat.activo = !cat.activo
    showToast(cat.activo ? 'Activada' : 'Desactivada')
  } catch { showToast('Error', 'error') }
}
const allUsers = ref([])
const loading = ref(false)
const businessFilter = ref('todos')
const businessSearch = ref('')

const isActive = (b) => b.status === 'activo' || b.status === 'aprobado'

const filteredBusinesses = computed(() => {
  const search = businessSearch.value.toLowerCase().trim()
  let list = allBusinesses.value

  if (businessFilter.value === 'activos') list = list.filter(isActive)
  else if (businessFilter.value === 'inactivos') list = list.filter(b => !isActive(b))

  if (search) {
    list = list.filter(b =>
      b.name?.toLowerCase().includes(search) ||
      b.category?.toLowerCase().includes(search) ||
      b.location?.toLowerCase().includes(search) ||
      String(b.id).includes(search)
    )
  }

  return list
})

const countActivos   = computed(() => allBusinesses.value.filter(isActive).length)
const countInactivos = computed(() => allBusinesses.value.filter(b => !isActive(b)).length)

// Modals State
const showBusinessModal = ref(false)
const selectedBusiness = ref(null)

const updatingBusinessId = ref(null)
const deleteConfirmId    = ref(null)
const deletingId         = ref(null)

const authStore = useAuthStore()

const hasToken = computed(() => !!localStorage.getItem('token'))

const fetchData = async () => {
  if (loading.value) return;
  
  loading.value = true
  try {
    if (activeTab.value === 'requests') {
      pendingRequests.value = await getPendingBusinesses()
    } else if (activeTab.value === 'businesses') {
      allBusinesses.value = await getAllBusinesses({ estado: 'ALL' })
    } else if (activeTab.value === 'users') {
      allUsers.value = await getAllUsers()
    }
  } catch (err) {
    console.error('Error fetching admin data:', err)
    showToast('Error al cargar datos', 'error')
  } finally {
    loading.value = false
  }
}

const switchTab = (tabName) => {
  activeTab.value = tabName
  if (tabName === 'categories' && allCategories.value.length === 0) {
    fetchCategories()
  } else if (tabName === 'requests' && pendingRequests.value.length === 0) {
    fetchData()
  } else if (tabName === 'businesses' && allBusinesses.value.length === 0) {
    fetchData()
  } else if (tabName === 'users' && allUsers.value.length === 0) {
    fetchData()
  }
}

// ── FIX: approve envía 'APROBADO' para que el backend mande el correo correcto ──
const handleAction = async (id, action) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  
  const estado = action === 'approve' ? 'APROBADO' : 'rechazado'
  try {
    await updateBusinessStatus(id, estado)
    await fetchData()
    showToast(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} con éxito`)
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data?.message || 'Error al procesar la solicitud'
    showToast(errorMsg, 'error')
  }
}

const toggleBusinessStatus = async (business) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  if (updatingBusinessId.value === business.id) return;
  
  const currentStatus = business.status?.toLowerCase()
  const isActive = currentStatus === 'activo' || currentStatus === 'aprobado'
  const newStatus = isActive ? 'inactivo' : 'activo'
  const previousStatus = business.status
  
  business.status = newStatus
  updatingBusinessId.value = business.id
  
  try {
    await updateBusinessStatus(business.id, newStatus)
    showToast(`Negocio ${newStatus === 'activo' ? 'activado' : 'desactivado'}`)
  } catch (error) {
    console.error(error)
    business.status = previousStatus
    const errorMsg = error.response?.data?.message || 'Error al cambiar estado del negocio'
    showToast(errorMsg, 'error')
  } finally {
    updatingBusinessId.value = null
  }
}

const confirmDeleteBusiness = (id) => { deleteConfirmId.value = id }
const cancelDelete = () => { deleteConfirmId.value = null }

const deleteBusinessFromAdmin = async (id) => {
  deletingId.value = id
  try {
    await deleteBusinessById(id)
    allBusinesses.value = allBusinesses.value.filter(b => b.id !== id)
    deleteConfirmId.value = null
    showToast('Negocio eliminado permanentemente')
  } catch (e) {
    showToast(e.response?.data?.message || 'Error al eliminar', 'error')
  } finally {
    deletingId.value = null
  }
}

const openBusinessEdit = (business) => {
  selectedBusiness.value = business
  showBusinessModal.value = true
}

const handleBusinessSaved = (updatedBusiness) => {
  showBusinessModal.value = false
  const index = allBusinesses.value.findIndex(b => b.id === updatedBusiness.id)
  if (index !== -1) {
    allBusinesses.value[index] = { ...allBusinesses.value[index], ...updatedBusiness }
  }
  showToast('Negocio actualizado correctamente')
}

const updatingRoleId = ref(null)

const ROLES = [
  { id: 1, label: 'Superadmin',   color: 'bg-purple-100 text-purple-700' },
  { id: 2, label: 'Administrador', color: 'bg-indigo-100 text-indigo-600' },
  { id: 3, label: 'Emprendedor',  color: 'bg-emerald-100 text-emerald-700' },
  { id: 4, label: 'Visitante',    color: 'bg-slate-100 text-slate-500' },
]
const roleBadge = (id) => ROLES.find(r => r.id === id) ?? ROLES[3]

const changeUserRole = async (userId, newRoleId) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  newRoleId = parseInt(newRoleId)
  const user = allUsers.value.find(u => u.id_usuario === userId)
  const prevRole = user?.id_rol
  if (user) user.id_rol = newRoleId
  updatingRoleId.value = userId
  try {
    await updateUserRole(userId, newRoleId)
    showToast('Rol actualizado')
  } catch (error) {
    if (user) user.id_rol = prevRole
    showToast(error.response?.data?.message || 'Error al cambiar el rol', 'error')
  } finally {
    updatingRoleId.value = null
  }
}

const expandedRequestId = ref(null)
const toggleExpand = (id) => {
  expandedRequestId.value = expandedRequestId.value === id ? null : id
}

import { uploadImage } from '../services/businessService'
const uploadingPhotoUserId = ref(null)

const handleAdminPhotoChange = async (userId, event) => {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { showToast('La imagen no debe superar 5MB', 'error'); return }
  uploadingPhotoUserId.value = userId
  try {
    const url = await uploadImage(file, 'perfiles')
    await import('../services/api').then(m => m.default.put(`/users/${userId}`, { foto_perfil: url }))
    const user = allUsers.value.find(u => u.id_usuario === userId)
    if (user) user.foto_perfil = url
    showToast('Foto actualizada')
  } catch (e) {
    showToast(e.response?.data?.message || 'Error al subir la foto', 'error')
  } finally {
    uploadingPhotoUserId.value = null
    event.target.value = ''
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />
    
    <main class="pt-[120px] pb-20 container mx-auto px-4 sm:px-6 transition-all">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
        <div>
          <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-2">Panel de Control</h4>
          <h1 class="text-4xl sm:text-5xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">Administración <span class="text-fiery-red">Global</span></h1>
        </div>
        
        <div class="flex items-center gap-2 w-full lg:w-auto">
          <div class="flex flex-1 lg:flex-none bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar">
            <button @click="switchTab('requests')" :class="[activeTab === 'requests' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Solicitudes</button>
            <button v-if="authStore.isSuperAdmin" @click="switchTab('businesses')" :class="[activeTab === 'businesses' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Negocios</button>
            <button v-if="authStore.isSuperAdmin" @click="switchTab('users')" :class="[activeTab === 'users' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Usuarios</button>
            <button @click="switchTab('categories')" :class="[activeTab === 'categories' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Categorías</button>
          </div>
          <button @click="fetchData()" :disabled="loading" title="Recargar datos de la pestaña actual" class="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-fiery-navy hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50">
            <svg :class="['w-5 h-5', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div v-if="loading && (!allBusinesses.length && !pendingRequests.length && !allUsers.length)" class="flex justify-center py-20">
        <div class="w-12 h-12 border-4 border-fiery-red border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else>
        <!-- Requests Tab -->
        <div v-if="activeTab === 'requests'" class="grid grid-cols-1 gap-6">
          <div v-if="pendingRequests.length === 0" class="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <p class="text-slate-400 font-bold uppercase tracking-widest">No hay solicitudes pendientes</p>
          </div>
          <div v-for="req in pendingRequests" :key="req.id"
            class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all">

            <div class="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
              <div class="w-full md:w-40 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img :src="req.image" class="w-full h-full object-cover" />
              </div>

              <div class="flex-1 text-center md:text-left min-w-0">
                <div class="inline-block px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2">Pendiente de Revisión</div>
                <h3 class="text-xl font-black text-fiery-navy uppercase tracking-tighter mb-1">{{ req.name }}</h3>
                <p class="text-slate-500 text-sm line-clamp-1 mb-2">{{ req.description }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{{ req.category }}</span>
                  <span v-if="req.location" class="text-slate-300">·</span>
                  <span v-if="req.location">{{ req.location }}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2 w-full md:w-auto flex-shrink-0">
                <button @click="handleAction(req.id, 'approve')"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md shadow-emerald-500/20 transition-all text-center">
                  Aprobar
                </button>
                <button @click="handleAction(req.id, 'reject')"
                  class="bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md shadow-fiery-red/20 transition-all text-center">
                  Rechazar
                </button>
                <button @click="toggleExpand(req.id)"
                  class="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
                  <svg class="w-3.5 h-3.5 transition-transform" :class="expandedRequestId === req.id ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                  {{ expandedRequestId === req.id ? 'Ocultar' : 'Ver detalles' }}
                </button>
              </div>
            </div>

            <transition name="expand">
              <div v-if="expandedRequestId === req.id"
                class="border-t border-slate-100 bg-slate-50 px-6 md:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Descripción completa</p>
                  <p class="text-sm text-slate-600 leading-relaxed">{{ req.description || '—' }}</p>
                </div>

                <div class="space-y-3">
                  <div v-if="req.location">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ubicación</p>
                    <p class="text-sm font-semibold text-slate-700">{{ req.location }}</p>
                  </div>
                  <div v-if="req.horario">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Horario</p>
                    <p class="text-sm font-semibold text-slate-700">{{ req.horario }}</p>
                  </div>
                  <div v-if="req.socials?.whatsapp">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WhatsApp</p>
                    <a :href="req.socials.whatsapp" target="_blank" class="text-sm font-semibold text-emerald-600 hover:underline">{{ req.socials.whatsapp.replace('https://wa.me/', '') }}</a>
                  </div>
                </div>

                <div class="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">ID Usuario propietario: <span class="text-slate-600">{{ req.id_usuario }}</span></span>
                  <a :href="`/negocio/${req.id}`" target="_blank"
                    class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-fiery-navy hover:text-fiery-red transition-colors">
                    Ver página pública
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
              </div>
            </transition>

          </div>
        </div>

        <!-- Businesses Tab -->
        <div v-if="activeTab === 'businesses'" class="space-y-4">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="businessSearch"
              type="text"
              placeholder="Buscar por nombre, categoría, ubicación o ID..."
              class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-fiery-navy font-bold text-sm outline-none focus:border-fiery-red transition-all"
            />
            <button v-if="businessSearch" @click="businessSearch = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button @click="businessFilter = 'todos'" :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'todos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']">Todos <span class="opacity-60">({{ allBusinesses.length }})</span></button>
            <button @click="businessFilter = 'activos'" :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'activos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']">Activos <span class="opacity-60">({{ countActivos }})</span></button>
            <button @click="businessFilter = 'inactivos'" :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'inactivos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']">Inactivos <span class="opacity-60">({{ countInactivos }})</span></button>
            <span v-if="businessSearch" class="text-xs text-slate-400 ml-1">{{ filteredBusinesses.length }} resultado{{ filteredBusinesses.length !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Mobile cards -->
          <div class="md:hidden space-y-3">
            <div v-for="business in filteredBusinesses" :key="business.id" class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img :src="business.image" loading="lazy" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-fiery-navy uppercase tracking-tighter truncate">{{ business.name }}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{{ business.category }}</p>
                </div>
                <button @click="toggleBusinessStatus(business)" :disabled="updatingBusinessId === business.id"
                  :class="['relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none', (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'bg-emerald-500' : 'bg-red-400']">
                  <span :class="['pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform duration-300', (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'translate-x-5' : 'translate-x-0']">
                    <svg v-if="updatingBusinessId === business.id" class="animate-spin h-4 w-4 text-emerald-500 absolute top-1 left-1" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  </span>
                </button>
              </div>
              <div v-if="deleteConfirmId === business.id" class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <span class="text-xs font-black text-red-600 flex-1">¿Eliminar permanentemente?</span>
                <button @click="cancelDelete" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 bg-slate-100">No</button>
                <button @click="deleteBusinessFromAdmin(business.id)" :disabled="deletingId === business.id"
                  class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white bg-red-600 disabled:opacity-60 flex items-center gap-1.5">
                  <div v-if="deletingId === business.id" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sí
                </button>
              </div>
              <div v-else class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <button @click="openBusinessEdit(business)"
                  class="flex-1 flex items-center justify-center gap-1.5 bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  Editar
                </button>
                <button v-if="authStore.isSuperAdmin" @click="confirmDeleteBusiness(business.id)"
                  class="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 border border-red-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse" style="min-width: 580px">
              <thead>
                <tr class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-6 md:px-8 py-5">Negocio</th>
                  <th class="px-6 md:px-8 py-5">Categoría</th>
                  <th class="px-6 md:px-8 py-5 text-center">Estado</th>
                  <th class="px-6 md:px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="business in filteredBusinesses" :key="business.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 md:px-8 py-5">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img :src="business.image" loading="lazy" class="w-full h-full object-cover" />
                      </div>
                      <span class="text-sm font-bold text-fiery-navy uppercase tracking-tighter">{{ business.name }}</span>
                    </div>
                  </td>
                  <td class="px-6 md:px-8 py-5 text-sm text-slate-500 font-bold uppercase text-[10px]">{{ business.category }}</td>
                  <td class="px-6 md:px-8 py-5 text-center">
                    <div class="flex items-center justify-center">
                      <button @click="toggleBusinessStatus(business)" :disabled="updatingBusinessId === business.id"
                        :class="['relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none', (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'bg-emerald-500' : 'bg-red-400']">
                        <span :class="['pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out', (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'translate-x-5' : 'translate-x-0']">
                          <svg v-if="updatingBusinessId === business.id" class="animate-spin h-4 w-4 text-emerald-500 absolute top-1 left-1" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                        </span>
                      </button>
                    </div>
                  </td>
                  <td class="px-6 md:px-8 py-5 text-right">
                    <div v-if="deleteConfirmId === business.id" class="flex items-center justify-end gap-2">
                      <span class="text-xs font-black text-red-600">¿Eliminar permanentemente?</span>
                      <button @click="cancelDelete" class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">No</button>
                      <button @click="deleteBusinessFromAdmin(business.id)" :disabled="deletingId === business.id"
                        class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                        <div v-if="deletingId === business.id" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sí, eliminar
                      </button>
                    </div>
                    <div v-else class="flex items-center justify-end gap-2">
                      <button @click="openBusinessEdit(business)"
                        class="inline-flex items-center gap-1.5 bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        Editar
                      </button>
                      <button v-if="authStore.isSuperAdmin" @click="confirmDeleteBusiness(business.id)"
                        class="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors border border-red-100" title="Eliminar negocio">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'">
          <!-- Mobile cards -->
          <div class="md:hidden space-y-3">
            <div v-for="user in allUsers" :key="user.id_usuario" class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div class="flex items-center gap-3">
                <label :for="`photo-mob-${user.id_usuario}`" class="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 cursor-pointer group">
                  <img v-if="user.foto_perfil" :src="user.foto_perfil" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-fiery-navy flex items-center justify-center text-white font-black text-sm uppercase">{{ user.nombre?.[0] || '?' }}</div>
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div v-if="uploadingPhotoUserId === user.id_usuario" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <svg v-else class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <input :id="`photo-mob-${user.id_usuario}`" type="file" accept="image/*" class="hidden" @change="handleAdminPhotoChange(user.id_usuario, $event)" />
                </label>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-fiery-navy uppercase tracking-tighter truncate">{{ user.nombre }} {{ user.apellido }}</p>
                  <p class="text-[10px] text-slate-400 truncate">{{ user.correo }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0" :class="roleBadge(user.id_rol).color">{{ roleBadge(user.id_rol).label }}</span>
                <div class="relative ml-auto">
                  <select :value="user.id_rol" :disabled="updatingRoleId === user.id_usuario"
                    @change="changeUserRole(user.id_usuario, $event.target.value)"
                    class="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-fiery-navy disabled:opacity-50">
                    <option v-for="role in ROLES" :key="role.id" :value="role.id">{{ role.label }}</option>
                  </select>
                  <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div v-if="updatingRoleId === user.id_usuario" class="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <svg v-else class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse" style="min-width: 480px">
              <thead>
                <tr class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-6 md:px-8 py-5">Usuario</th>
                  <th class="px-6 md:px-8 py-5">Rol</th>
                  <th class="px-6 md:px-8 py-5 text-right">Cambiar Rol</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="user in allUsers" :key="user.id_usuario" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 md:px-8 py-4">
                    <div class="flex items-center gap-3">
                      <label :for="`photo-${user.id_usuario}`" class="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-100 cursor-pointer group">
                        <img v-if="user.foto_perfil" :src="user.foto_perfil" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full bg-fiery-navy flex items-center justify-center text-white font-black text-sm uppercase">{{ user.nombre?.[0] || '?' }}</div>
                        <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div v-if="uploadingPhotoUserId === user.id_usuario" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <svg v-else class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </div>
                        <input :id="`photo-${user.id_usuario}`" type="file" accept="image/*" class="hidden" @change="handleAdminPhotoChange(user.id_usuario, $event)" />
                      </label>
                      <div>
                        <p class="text-sm font-bold text-fiery-navy uppercase tracking-tighter leading-none">{{ user.nombre }} {{ user.apellido }}</p>
                        <p class="text-[10px] text-slate-400 mt-0.5">{{ user.correo }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 md:px-8 py-4">
                    <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" :class="roleBadge(user.id_rol).color">{{ roleBadge(user.id_rol).label }}</span>
                  </td>
                  <td class="px-6 md:px-8 py-4 text-right">
                    <div class="flex items-center justify-end gap-3">
                      <div class="relative">
                        <select :value="user.id_rol" :disabled="updatingRoleId === user.id_usuario"
                          @change="changeUserRole(user.id_usuario, $event.target.value)"
                          class="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-fiery-navy hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50">
                          <option v-for="role in ROLES" :key="role.id" :value="role.id">{{ role.label }}</option>
                        </select>
                        <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                          <div v-if="updatingRoleId === user.id_usuario" class="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          <svg v-else class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>

        <!-- ── Tab: Categorías ── -->
        <div v-if="activeTab === 'categories'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-500 uppercase tracking-widest">Gestión de Categorías</h3>
            <button v-if="!showCatForm" @click="openNewCat"
              class="bg-fiery-navy text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
              + Nueva categoría
            </button>
          </div>

          <div v-if="showCatForm" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h4 class="text-xs font-black text-fiery-navy uppercase">{{ editingCat ? 'Editar Categoría' : 'Nueva Categoría' }}</h4>
            <input v-model="catForm.nombre" placeholder="Nombre *" type="text"
              class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-fiery-navy" />
            <div class="relative">
              <input v-model="catForm.descripcion" placeholder="Descripción (opcional)" type="text"
                class="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 pr-36 text-sm text-slate-600 focus:outline-none focus:border-fiery-navy" />
              <button type="button" @click="generateCategoryDescription"
                :disabled="!catForm.nombre?.trim() || generatingCatDesc"
                class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-fiery-navy/10 text-fiery-navy hover:bg-fiery-navy hover:text-white">
                <svg v-if="generatingCatDesc" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                <span v-else>✦</span>
                {{ generatingCatDesc ? 'Generando...' : 'Generar con IA' }}
              </button>
            </div>
            <div class="flex gap-3 justify-end">
              <button @click="showCatForm = false" class="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
              <button @click="saveCat" :disabled="savingCat || !catForm.nombre?.trim()"
                class="bg-fiery-navy text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity">
                {{ savingCat ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div v-for="cat in allCategories" :key="cat.id_categoria"
              class="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div class="flex-1 min-w-0">
                <p class="font-black text-fiery-navy text-sm">{{ cat.nombre }}</p>
                <p v-if="cat.descripcion" class="text-slate-400 text-xs mt-0.5 truncate">{{ cat.descripcion }}</p>
              </div>
              <span :class="['text-[9px] font-black uppercase px-2.5 py-1 rounded-full', cat.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400']">
                {{ cat.activo ? 'Activa' : 'Inactiva' }}
              </span>
              <div class="flex gap-2 shrink-0">
                <button v-if="authStore.isSuperAdmin" @click="openEditCat(cat)" class="p-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-fiery-navy transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button v-if="authStore.isSuperAdmin" @click="toggleCatActive(cat)"
                  :class="['p-2 rounded-xl transition-colors text-xs font-black', cat.activo ? 'bg-red-50 text-fiery-red hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100']"
                  :title="cat.activo ? 'Desactivar' : 'Activar'">
                  {{ cat.activo ? '✕' : '✓' }}
                </button>
              </div>
            </div>
            <div v-if="allCategories.length === 0" class="text-center py-12 text-slate-400 text-sm font-bold">
              Sin categorías aún
            </div>
          </div>
        </div>

      </div>
    </main>

    <EditBusinessModal 
      :show="showBusinessModal" 
      :business="selectedBusiness" 
      @close="showBusinessModal = false"
      @saved="handleBusinessSaved"
    />

    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id"
          :class="['px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 w-80 pointer-events-auto', toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white']">
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
.font-outfit { font-family: 'Outfit', sans-serif; }
.custom-scrollbar::-webkit-scrollbar { height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(30px) scale(0.95); }
.expand-enter-active { transition: all 0.2s ease-out; }
.expand-leave-active { transition: all 0.15s ease-in; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-8px); }
</style>