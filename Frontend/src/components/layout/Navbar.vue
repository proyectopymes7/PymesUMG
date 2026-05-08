<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const isMenuOpen = ref(false)
const isUserDropdownOpen = ref(false)
const isScrolled = ref(false)
const authStore = useAuthStore()

const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value }
const toggleUserDropdown = () => { isUserDropdownOpen.value = !isUserDropdownOpen.value }

const handleScroll = () => { isScrolled.value = window.scrollY > 50 }

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu-container')) {
      isUserDropdownOpen.value = false
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleGoogleLogin = async (response) => {
  if (response.credential) {
    try {
      const success = await authStore.loginWithGoogle(response.credential)
      if (success) {
        alert('¡Login Exitoso!')
      } else {
        alert('Error en el servidor: ' + authStore.error)
      }
    } catch (e) {
      alert('Error de conexión con el backend: ' + e.message)
    }
  }
}

const handleLogout = () => {
  authStore.logout()
  isMenuOpen.value = false
  isUserDropdownOpen.value = false
}
</script>

<template>
  <nav 
    :class="[
      'fixed top-0 left-0 w-full z-[100] transition-all duration-500 px-6 md:px-12',
      isScrolled || isMenuOpen || route.path !== '/' 
        ? 'py-4 bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-100 text-fiery-navy' 
        : 'py-6 bg-transparent text-white'
    ]"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 md:w-12 md:h-12 bg-fiery-red rounded-xl flex items-center justify-center shadow-lg shadow-fiery-red/20 group-hover:rotate-12 transition-transform duration-500">
          <svg class="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <span class="font-black text-xl md:text-2xl tracking-tighter font-outfit uppercase">Conecta<span class="text-fiery-red">PYME</span></span>
      </RouterLink>

      <!-- Desktop Menu Links -->
      <div class="hidden lg:flex items-center gap-10 font-black text-xs uppercase tracking-widest">
        <RouterLink to="/" class="hover:text-fiery-red transition-colors relative group py-2">Inicio</RouterLink>
        <RouterLink to="/directorio" class="hover:text-fiery-red transition-colors relative group py-2">Directorio</RouterLink>
        <RouterLink to="/blog" class="hover:text-fiery-red transition-colors relative group py-2">Blog</RouterLink>
        <RouterLink to="/admin" class="text-fiery-red hover:text-fiery-darkred transition-colors relative group py-2 flex items-center gap-2">
          <span class="w-2 h-2 bg-fiery-red rounded-full animate-pulse"></span>
          Admin
        </RouterLink>
      </div>

      <!-- Actions (Desktop + Hamburger Toggle) -->
      <div class="flex items-center gap-4">
        <!-- Desktop User Dropdown -->
        <div v-if="authStore.isAuthenticated" class="hidden sm:block relative user-menu-container">
          <button @click="toggleUserDropdown" class="flex items-center gap-3 bg-slate-100/10 hover:bg-slate-100/20 backdrop-blur-md p-1.5 pr-4 rounded-2xl transition-all border border-white/10">
            <div class="w-10 h-10 bg-fiery-red rounded-xl flex items-center justify-center text-white font-black shadow-lg">
              {{ authStore.userInitial }}
            </div>
          </button>
          <transition name="menu-fade">
            <div v-if="isUserDropdownOpen" class="absolute top-full right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 flex flex-col gap-1">
              <div class="px-5 py-4 border-b border-slate-50 mb-2">
                <p class="text-xs font-black text-fiery-navy uppercase">{{ authStore.userFullName }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ authStore.user?.correo }}</p>
              </div>
              <button @click="handleLogout" class="flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-red-50 text-fiery-red transition-all">
                <span class="text-[11px] font-black uppercase tracking-widest">Cerrar Sesión</span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Desktop Login (Hidden on Mobile) -->
        <div v-else class="hidden sm:block">
          <GoogleLogin :callback="handleGoogleLogin">
            <button class="flex items-center gap-2 bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 active:scale-95">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Ingresar
            </button>
          </GoogleLogin>
        </div>
        
        <!-- Hamburger Button (Visible only on Mobile) -->
        <button @click="toggleMenu" class="lg:hidden w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-slate-100 rounded-xl text-fiery-navy" aria-label="Toggle Menu">
          <span :class="['w-6 h-0.5 bg-current transition-all duration-300', isMenuOpen ? 'rotate-45 translate-y-2' : '']"></span>
          <span :class="['w-6 h-0.5 bg-current transition-all duration-300', isMenuOpen ? 'opacity-0' : '']"></span>
          <span :class="['w-6 h-0.5 bg-current transition-all duration-300', isMenuOpen ? '-rotate-45 -translate-y-2' : '']"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <transition name="menu-fade">
      <div v-if="isMenuOpen" class="lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 py-8 px-6 space-y-6 flex flex-col items-center text-center">
        <RouterLink @click="isMenuOpen = false" to="/" class="text-xl font-black">Inicio</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/directorio" class="text-xl font-black">Directorio</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/blog" class="text-xl font-black">Blog</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/admin" class="text-xl font-black text-fiery-red">Panel Admin</RouterLink>
        
        <div v-if="authStore.isAuthenticated" class="w-full flex flex-col items-center border-t pt-6">
          <p class="font-black mb-4">{{ authStore.userFullName }}</p>
          <button @click="handleLogout" class="w-full bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">Cerrar Sesión</button>
        </div>
        <!-- Mobile Login Button inside menu -->
        <div v-else class="w-full pt-4">
          <GoogleLogin :callback="handleGoogleLogin">
            <button class="w-full flex items-center justify-center gap-3 bg-fiery-red hover:bg-fiery-darkred text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-fiery-red/30 active:scale-[0.98]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Ingresar
            </button>
          </GoogleLogin>
        </div>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.menu-fade-enter-active, .menu-fade-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.menu-fade-enter-from, .menu-fade-leave-to { opacity: 0; transform: translateY(-20px); }
</style>