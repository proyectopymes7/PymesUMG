<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isMenuOpen = ref(false)
const isScrolled = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
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
        <RouterLink to="/" class="hover:text-fiery-red transition-colors relative group py-2">
          Inicio
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-fiery-red transition-all group-hover:w-full"></span>
        </RouterLink>
        <RouterLink to="/directorio" class="hover:text-fiery-red transition-colors relative group py-2">
          Directorio
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-fiery-red transition-all group-hover:w-full"></span>
        </RouterLink>
        <a href="#" class="hover:text-fiery-red transition-colors relative group py-2">
          Categorías
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-fiery-red transition-all group-hover:w-full"></span>
        </a>
        <RouterLink to="/blog" class="hover:text-fiery-red transition-colors relative group py-2">
          Blog
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-fiery-red transition-all group-hover:w-full"></span>
        </RouterLink>
      </div>

      <!-- Actions & Hamburger -->
      <div class="flex items-center gap-4">
        <button class="hidden sm:flex items-center gap-2 bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-fiery-red/20 active:scale-95">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Ingresar
        </button>
        
        <!-- Hamburger Button -->
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
        <RouterLink @click="isMenuOpen = false" to="/" class="text-xl font-black text-fiery-navy hover:text-fiery-red transition-colors">Inicio</RouterLink>
        <RouterLink @click="isMenuOpen = false" to="/directorio" class="text-xl font-black text-fiery-navy hover:text-fiery-red transition-colors">Directorio</RouterLink>
        <a href="#" class="text-xl font-black text-fiery-navy hover:text-fiery-red transition-colors">Categorías</a>
        <RouterLink @click="isMenuOpen = false" to="/blog" class="text-xl font-black text-fiery-navy hover:text-fiery-red transition-colors">Blog</RouterLink>
        <button class="w-full bg-fiery-red text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-fiery-red/20">
          Iniciar Sesión
        </button>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.menu-fade-enter-active, .menu-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.menu-fade-enter-from, .menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
