<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import { getAllBusinesses, getPendingBusinesses, updateBusinessStatus, getAllUsers, updateUserRole } from '../services/businessService'

// Import Modals
import EditBusinessModal from '../components/admin/EditBusinessModal.vue'
import EditUserModal from '../components/admin/EditUserModal.vue'

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
const allUsers = ref([])
const loading = ref(false)
const businessFilter = ref('todos')

const isActive = (b) => b.status === 'activo' || b.status === 'aprobado'

const filteredBusinesses = computed(() => {
  if (businessFilter.value === 'activos') return allBusinesses.value.filter(isActive)
  if (businessFilter.value === 'inactivos') return allBusinesses.value.filter(b => !isActive(b))
  return allBusinesses.value
})

const countActivos   = computed(() => allBusinesses.value.filter(isActive).length)
const countInactivos = computed(() => allBusinesses.value.filter(b => !isActive(b)).length)

// Modals State
const showBusinessModal = ref(false)
const selectedBusiness = ref(null)
const showUserModal = ref(false)
const selectedUser = ref(null)

const updatingBusinessId = ref(null) // for toggle switch spinner

// Computed variable to check for authentication token
const hasToken = computed(() => !!localStorage.getItem('token'))

const fetchData = async () => {
  if (loading.value) return; // Prevent concurrent fetches
  
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
  if (tabName === 'requests' && pendingRequests.value.length === 0) {
    fetchData()
  } else if (tabName === 'businesses' && allBusinesses.value.length === 0) {
    fetchData()
  } else if (tabName === 'users' && allUsers.value.length === 0) {
    fetchData()
  }
}

// Handler para Requests (Pendientes)
const handleAction = async (id, action) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  
  const estado = action === 'approve' ? 'activo' : 'rechazado'
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

// Handler para Switch Toggle de Negocios Activos/Inactivos con Optimistic Update
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
  
  // Optimistic update
  business.status = newStatus
  updatingBusinessId.value = business.id
  
  try {
    await updateBusinessStatus(business.id, newStatus)
    showToast(`Negocio ${newStatus === 'activo' ? 'activado' : 'desactivado'}`)
  } catch (error) {
    console.error(error)
    // Revert on error
    business.status = previousStatus
    const errorMsg = error.response?.data?.message || 'Error al cambiar estado del negocio'
    showToast(errorMsg, 'error')
  } finally {
    updatingBusinessId.value = null
  }
}

const openBusinessEdit = (business) => {
  selectedBusiness.value = business
  showBusinessModal.value = true
}

const handleBusinessSaved = (updatedBusiness) => {
  showBusinessModal.value = false
  // Update local list
  const index = allBusinesses.value.findIndex(b => b.id === updatedBusiness.id)
  if (index !== -1) {
    allBusinesses.value[index] = { ...allBusinesses.value[index], ...updatedBusiness }
  }
  showToast('Negocio actualizado correctamente')
}

const changeUserRole = async (userId, newRoleId) => {
  if (!hasToken.value) {
    showToast('Debes iniciar sesión para realizar esta acción', 'error')
    return
  }
  try {
    await updateUserRole(userId, newRoleId)
    await fetchData()
    showToast('Rol de usuario actualizado')
  } catch (error) {
    console.error(error)
    const errorMsg = error.response?.data?.message || 'Error al cambiar el rol'
    showToast(errorMsg, 'error')
  }
}

const openUserEdit = (user) => {
  selectedUser.value = user
  showUserModal.value = true
}

const handleUserSaved = (updatedUser) => {
  // Update local list without full fetch for a smoother experience
  const index = allUsers.value.findIndex(u => u.id_usuario === updatedUser.id_usuario)
  if (index !== -1) {
    allUsers.value[index] = { ...allUsers.value[index], ...updatedUser }
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />
    
    <main class="pt-[88px] pb-20 container mx-auto px-4 sm:px-6 transition-all">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
        <div>
          <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-2">Panel de Control</h4>
          <h1 class="text-4xl sm:text-5xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">Administración <span class="text-fiery-red">Global</span></h1>
        </div>
        
        <div class="flex items-center gap-2 w-full lg:w-auto">
          <div class="flex flex-1 lg:flex-none bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto custom-scrollbar">
            <button @click="switchTab('requests')" :class="[activeTab === 'requests' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Solicitudes</button>
            <button @click="switchTab('businesses')" :class="[activeTab === 'businesses' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Negocios</button>
            <button @click="switchTab('users')" :class="[activeTab === 'users' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600', 'flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap']">Usuarios</button>
          </div>
          <button @click="fetchData()" :disabled="loading" title="Recargar datos de la pestaña actual" class="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-fiery-navy hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50">
            <svg :class="['w-5 h-5', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="loading && (!allBusinesses.length && !pendingRequests.length && !allUsers.length)" class="flex justify-center py-20">
        <div class="w-12 h-12 border-4 border-fiery-red border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else>
        <!-- Requests Tab -->
        <div v-if="activeTab === 'requests'" class="grid grid-cols-1 gap-6">
          <div v-if="pendingRequests.length === 0" class="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <p class="text-slate-400 font-bold uppercase tracking-widest">No hay solicitudes pendientes</p>
          </div>
          <div v-for="req in pendingRequests" :key="req.id" class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 hover:shadow-xl transition-all">
            <div class="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-100">
              <img :src="req.image" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 text-center md:text-left">
              <div class="inline-block px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">Pendiente de Revisión</div>
              <h3 class="text-xl font-black text-fiery-navy uppercase tracking-tighter mb-2">{{ req.name }}</h3>
              <p class="text-slate-500 text-sm mb-4 line-clamp-1">{{ req.description }}</p>
              <div class="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Categoría: {{ req.category }}</span>
                <span>Dueño ID: {{ req.id_usuario }}</span>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button @click="handleAction(req.id, 'approve')" class="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all text-center">Aprobar</button>
              <button @click="handleAction(req.id, 'reject')" class="flex-1 md:flex-none bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-fiery-red/20 transition-all text-center">Rechazar</button>
            </div>
          </div>
        </div>

        <!-- Businesses Tab -->
        <div v-if="activeTab === 'businesses'" class="space-y-4">
          <!-- Filtros -->
          <div class="flex items-center gap-2">
            <button
              @click="businessFilter = 'todos'"
              :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'todos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']"
            >Todos <span class="opacity-60">({{ allBusinesses.length }})</span></button>
            <button
              @click="businessFilter = 'activos'"
              :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'activos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']"
            >Activos <span class="opacity-60">({{ countActivos }})</span></button>
            <button
              @click="businessFilter = 'inactivos'"
              :class="['px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', businessFilter === 'inactivos' ? 'bg-fiery-navy text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600']"
            >Inactivos <span class="opacity-60">({{ countInactivos }})</span></button>
          </div>

          <div class="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
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
                        <img :src="business.image" class="w-full h-full object-cover" />
                      </div>
                      <span class="text-sm font-bold text-fiery-navy uppercase tracking-tighter">{{ business.name }}</span>
                    </div>
                  </td>
                  <td class="px-6 md:px-8 py-5 text-sm text-slate-500 font-bold uppercase text-[10px]">{{ business.category }}</td>
                  
                  <td class="px-6 md:px-8 py-5 text-center">
                    <div class="flex items-center justify-center">
                      <button 
                        @click="toggleBusinessStatus(business)" 
                        :disabled="updatingBusinessId === business.id"
                        :title="(business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'Negocio Activo. Clic para desactivar.' : 'Negocio Inactivo. Clic para activar.'"
                        :class="[
                          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-fiery-red focus-visible:ring-opacity-75',
                          (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'bg-emerald-500' : 'bg-red-400'
                        ]"
                      >
                        <span 
                          :class="[
                            'pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out',
                            (business.status?.toLowerCase() === 'activo' || business.status?.toLowerCase() === 'aprobado') ? 'translate-x-5' : 'translate-x-0'
                          ]"
                        >
                          <svg v-if="updatingBusinessId === business.id" class="animate-spin h-4 w-4 text-emerald-500 absolute top-1 left-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      </button>
                    </div>
                  </td>

                  <td class="px-6 md:px-8 py-5 text-right">
                    <button @click="openBusinessEdit(business)" class="inline-flex items-center gap-1.5 bg-fiery-navy text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>

        <!-- Users Tab (Super Admin Only) -->
        <div v-if="activeTab === 'users'" class="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse" style="min-width: 480px">
              <thead>
                <tr class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-6 md:px-8 py-5">Usuario</th>
                  <th class="px-6 md:px-8 py-5">Correo</th>
                  <th class="px-6 md:px-8 py-5">Rol Actual</th>
                  <th class="px-6 md:px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="user in allUsers" :key="user.id_usuario" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 md:px-8 py-5">
                    <div class="flex items-center gap-3">
                      <div v-if="user.avatar" class="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <img :src="user.avatar" class="w-full h-full object-cover" />
                      </div>
                      <div v-else class="w-8 h-8 bg-fiery-navy rounded-lg flex items-center justify-center text-white font-black text-xs uppercase shrink-0">{{ user.nombre?.[0] || '?' }}</div>
                      <span class="text-sm font-bold text-fiery-navy uppercase tracking-tighter">{{ user.nombre }} {{ user.apellido }}</span>
                    </div>
                  </td>
                  <td class="px-6 md:px-8 py-5 text-sm text-slate-500">{{ user.correo }}</td>
                  <td class="px-6 md:px-8 py-5">
                    <span :class="[user.id_rol === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500', 'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest']">
                      {{ user.id_rol === 1 ? 'Administrador' : 'Usuario' }}
                    </span>
                  </td>
                  <td class="px-6 md:px-8 py-5 text-right flex gap-3 justify-end items-center">
                    <button v-if="user.id_rol === 2" @click="changeUserRole(user.id_usuario, 1)" class="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Hacer Admin</button>
                    <button v-else @click="changeUserRole(user.id_usuario, 2)" class="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Quitar Admin</button>
                    
                    <button @click="openUserEdit(user)" class="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-fiery-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors ml-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <EditBusinessModal 
      :show="showBusinessModal" 
      :business="selectedBusiness" 
      @close="showBusinessModal = false"
      @saved="handleBusinessSaved"
    />

    <EditUserModal 
      :show="showUserModal" 
      :user="selectedUser" 
      @close="showUserModal = false"
      @saved="handleUserSaved"
    />

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
.font-outfit { font-family: 'Outfit', sans-serif; }
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 10px;
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