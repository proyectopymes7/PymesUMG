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
  <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-fiery-navy/5 group cursor-pointer flex flex-col h-full hover:-translate-y-2">
    <!-- Image Section -->
    <div class="relative h-56 overflow-hidden">
      <img :src="business.image" :alt="business.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div class="absolute top-5 left-5 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-fiery-red shadow-lg uppercase tracking-widest border border-fiery-red/10">
        {{ business.category }}
      </div>
    </div>

    <!-- Content Section -->
    <div class="p-8 flex-1 flex flex-col">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-black text-fiery-navy line-clamp-1 group-hover:text-fiery-red transition-colors font-outfit uppercase tracking-tight">{{ business.name }}</h3>
        <div class="flex items-center gap-1.5 bg-fiery-cream px-3 py-1.5 rounded-xl border border-orange-100">
          <svg class="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
          <span class="text-xs font-black text-fiery-navy">{{ business.rating }}</span>
        </div>
      </div>

      <p class="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">{{ business.description }}</p>
      
      <!-- Location Information -->
      <div class="mt-auto">
        <div class="flex items-start gap-3 text-fiery-navy/70 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-fiery-red/20 group-hover:bg-fiery-red/[0.02] transition-all">
          <div class="mt-0.5 text-fiery-red">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="font-black text-fiery-navy text-[11px] uppercase tracking-wide">{{ business.barrio || 'Centro' }}</span>
            <span class="font-bold opacity-70">{{ business.muni }}, {{ business.dept }}</span>
          </div>
        </div>

        <RouterLink :to="'/negocio/' + (business.id || 1)" class="group/btn relative flex items-center justify-center w-full py-4 rounded-2xl overflow-hidden bg-fiery-navy transition-all duration-300">
          <div class="absolute inset-0 bg-fiery-red translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
          <span class="relative z-10 text-xs font-black text-white uppercase tracking-[0.2em]">Ver Detalles</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>
