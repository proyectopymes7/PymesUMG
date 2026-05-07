<script setup>
defineProps({
  business: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-100 group cursor-pointer flex flex-col h-full">
    <div class="relative h-48 overflow-hidden">
      <img :src="business.image" :alt="business.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-purple-700 shadow-sm">
        {{ business.category }}
      </div>
    </div>
    <div class="p-6 flex-1 flex flex-col">
      <div class="flex justify-between items-start mb-2">
        <h3 class="text-xl font-bold text-slate-800 line-clamp-1">{{ business.name }}</h3>
        <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
          <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
          <span class="text-sm font-bold text-slate-700">{{ business.rating }}</span>
        </div>
      </div>
      <p class="text-slate-500 text-sm mb-4 line-clamp-2">{{ business.description }}</p>
      
      <div class="mt-auto">
        <div class="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="truncate">{{ business.location }}</span>
        </div>
        <button class="w-full py-2.5 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white transition-colors duration-300">
          Ver Detalles
        </button>
      </div>
    </div>
  </div>
</template>
