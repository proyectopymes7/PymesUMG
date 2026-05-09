<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import Navbar from '../components/layout/Navbar.vue'
import { getAllBusinesses, getPendingBusinesses, updateBusinessStatus, getAllUsers, updateUserRole } from '../data/mockData'

const authStore = useAuthStore()
const activeTab = ref('requests')
const pendingRequests = ref([])
const allBusinesses = ref([])
const allUsers = ref([])
const loading = ref(false)

const fetchData = () => {
  loading.value = true
  try {
    if (activeTab.value === 'requests') {
      pendingRequests.value = getPendingBusinesses()
    } else if (activeTab.value === 'businesses') {
      allBusinesses.value = getAllBusinesses()
    } else if (activeTab.value === 'users') {
      allUsers.value = getAllUsers()
    }
  } catch (err) {
    console.error('Error fetching admin data:', err)
  } finally {
    loading.value = false
  }
}

const handleAction = (id, action) => {
  const estado = action === 'approve' ? 'activo' : 'inactivo'
  updateBusinessStatus(id, estado)
  fetchData()
  alert(`Negocio ${action === 'approve' ? 'aprobado' : 'rechazado'} con éxito`)
}

const changeUserRole = (userId, newRoleId) => {
  updateUserRole(userId, newRoleId)
  fetchData()
  alert('Rol de usuario actualizado')
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />
    
    <main class="pt-32 pb-20 container mx-auto px-6">
      <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h4 class="text-fiery-red font-black uppercase tracking-[0.3em] text-xs mb-2">Panel de Control</h4>
          <h1 class="text-4xl md:text-5xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">Administración <span class="text-fiery-red">Global</span></h1>
        </div>
        
        <div class="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button @click="activeTab = 'requests'; fetchData()" :class="[activeTab === 'requests' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400', 'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all']">Solicitudes</button>
          <button @click="activeTab = 'businesses'; fetchData()" :class="[activeTab === 'businesses' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400', 'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all']">Negocios</button>
          <button @click="activeTab = 'users'; fetchData()" :class="[activeTab === 'users' ? 'bg-fiery-navy text-white shadow-lg' : 'text-slate-400', 'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all']">Usuarios</button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="loading" class="flex justify-center py-20">
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
            <div class="flex gap-3">
              <button @click="handleAction(req.id, 'approve')" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all">Aprobar</button>
              <button @click="handleAction(req.id, 'reject')" class="bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-fiery-red/20 transition-all">Rechazar</button>
            </div>
          </div>
        </div>

        <!-- Users Tab (Super Admin Only) -->
        <div v-if="activeTab === 'users'" class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th class="px-8 py-5">Usuario</th>
                <th class="px-8 py-5">Correo</th>
                <th class="px-8 py-5">Rol Actual</th>
                <th class="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="user in allUsers" :key="user.id_usuario" class="hover:bg-slate-50 transition-colors">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-fiery-navy rounded-lg flex items-center justify-center text-white font-black text-xs uppercase">{{ user.nombre[0] }}</div>
                    <span class="text-sm font-bold text-fiery-navy uppercase tracking-tighter">{{ user.nombre }} {{ user.apellido }}</span>
                  </div>
                </td>
                <td class="px-8 py-5 text-sm text-slate-500">{{ user.correo }}</td>
                <td class="px-8 py-5">
                  <span :class="[user.id_rol === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500', 'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest']">
                    {{ user.id_rol === 1 ? 'Administrador' : 'Usuario' }}
                  </span>
                </td>
                <td class="px-8 py-5 text-right">
                  <button v-if="user.id_rol === 2" @click="changeUserRole(user.id_usuario, 1)" class="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Hacer Admin</button>
                  <button v-else @click="changeUserRole(user.id_usuario, 2)" class="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Quitar Admin</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>
