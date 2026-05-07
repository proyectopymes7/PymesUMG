<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav :class="['absolute top-0 left-0 w-full z-50 py-6 px-8 flex items-center justify-between transition-colors duration-300', route.path === '/' ? 'bg-transparent text-white' : 'bg-white text-slate-800 border-b border-slate-100 shadow-sm']">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <div class="w-10 h-10 bg-fiery-red rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      </div>
      <span class="font-bold text-2xl tracking-tight">ConectaPYME</span>
    </div>

    <!-- Menu Links -->
    <div class="hidden md:flex items-center gap-8 font-medium">
      <RouterLink to="/" class="hover:text-fiery-red transition-colors">Inicio</RouterLink>
      <RouterLink to="/directorio" class="hover:text-fiery-red transition-colors">Directorio</RouterLink>
      <a href="#" class="hover:text-fiery-red transition-colors">Categorías</a>
      <a href="#" class="hover:text-fiery-red transition-colors">Blog</a>
    </div>

    <!-- Actions -->
    <div>
      <button class="bg-fiery-red hover:bg-fiery-darkred text-white px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-lg shadow-fiery-red/30">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        Iniciar Sesión
      </button>
    </div>
  </nav>
</template>
