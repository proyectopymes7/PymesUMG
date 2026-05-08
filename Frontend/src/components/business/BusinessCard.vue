<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  business: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <RouterLink :to="'/negocio/' + (business.id || 1)" class="block h-full group">
    <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 border border-slate-100 flex flex-col h-full hover:-translate-y-3 relative cursor-pointer">
      <!-- Image Section with Glassmorphism Badges -->
      <div class="relative h-64 overflow-hidden">
        <img :src="business.image" :alt="business.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        
        <!-- Overlay Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-fiery-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <!-- Badges -->
        <div class="absolute top-5 left-5 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-fiery-red shadow-lg uppercase tracking-[0.2em] border border-white/50">
          {{ business.category }}
        </div>
        
        <div class="absolute bottom-5 right-5 bg-fiery-navy/80 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-1.5 border border-white/10 shadow-xl">
          <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          <span class="text-xs font-black text-white">{{ business.rating }}</span>
        </div>
      </div>

      <!-- Content Section -->
      <div class="p-8 flex-1 flex flex-col relative bg-white">
        <!-- Decorative Line -->
        <div class="w-12 h-1 bg-fiery-red/20 mb-6 group-hover:w-20 transition-all duration-500 rounded-full"></div>
        
        <h3 class="text-2xl font-black text-fiery-navy mb-3 group-hover:text-fiery-red transition-colors font-outfit uppercase tracking-tighter leading-none">
          {{ business.name }}
        </h3>
        
        <div class="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">
          <svg class="w-4 h-4 text-fiery-red/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
          {{ business.location || business.muni }}
        </div>

        <p class="text-slate-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
          {{ business.description }}
        </p>
        
        <!-- CTA Footer in Card -->
        <div class="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
          <div class="text-[11px] font-black uppercase tracking-[0.2em] text-fiery-navy group-hover:text-fiery-red transition-colors flex items-center gap-2">
            Ver Detalles
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
          </div>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>
