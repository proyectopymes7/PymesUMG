<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import { getBusinessById } from '../services/businessService'

const route = useRoute()
const router = useRouter()
const business = ref(null)

const mapUrl = computed(() => {
  if (!business.value) return ''
  const query = encodeURIComponent(business.value.location)
  return `https://maps.google.com/maps?q=${query}&output=embed`
})

onMounted(async () => {
  try {
    business.value = await getBusinessById(route.params.id)
  } catch (error) {
    console.error('Error fetching business details:', error)
  }
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <div v-if="business" class="min-h-screen bg-white">
    <Navbar />

    <div class="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 max-w-6xl">
      
      <!-- Top Navigation -->
      <div class="flex items-center justify-between mb-6 md:mb-8">
        <button @click="goBack" class="flex items-center gap-2 text-fiery-navy font-bold hover:text-fiery-red transition-all group px-3 py-2 md:px-4 md:py-2 rounded-xl hover:bg-fiery-cream">
          <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          <span class="text-sm md:text-base">Regresar</span>
        </button>
      </div>

      <!-- Main Business Card -->
      <div class="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-fiery-navy/5 border border-slate-100 p-6 md:p-12 mb-8 md:mb-12 overflow-hidden relative">
        <div class="absolute top-0 right-0 w-64 h-64 bg-fiery-red/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <!-- flex-col-reverse hace que la info (nombre) vaya arriba en móvil -->
        <div class="flex flex-col-reverse md:flex-row gap-8 md:gap-10 items-center md:items-start relative z-10">
          
          <!-- Logo & Rating Section (Aparece abajo en móvil) -->
          <div class="w-full md:w-auto flex flex-col items-center gap-4 md:gap-6">
            <div class="w-32 h-32 md:w-52 md:h-52 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white shadow-lg border border-slate-100 p-2">
              <img :src="business.logo" :alt="business.name" class="w-full h-full object-cover rounded-[1.8rem]" />
            </div>
            
            <!-- Overall Stars Section (Más pequeña en móvil) -->
            <div class="bg-fiery-navy rounded-[2rem] p-4 md:p-6 text-center text-white w-full max-w-[200px] md:max-w-none">
              <div class="text-2xl md:text-4xl font-black mb-1">{{ business.rating }}</div>
              <div class="flex justify-center text-yellow-400 mb-1 md:mb-2">
                <svg v-for="i in 5" :key="i" class="w-4 h-4 md:w-5 md:h-5" :class="i <= Math.floor(business.rating) ? 'fill-current' : 'text-white/20'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
              <div class="text-[10px] md:text-xs font-bold text-fiery-cream/60 uppercase tracking-widest">{{ business.reviewCount }} reseñas</div>
            </div>
          </div>

          <!-- Info Section (Aparece primero en móvil) -->
          <div class="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <div>
              <div class="inline-block px-4 py-1 bg-fiery-red text-white rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 md:mb-4 shadow-lg shadow-fiery-red/20">
                {{ business.category }}
              </div>
              <h1 class="text-3xl md:text-6xl font-black text-fiery-navy font-outfit mb-3 md:mb-4">{{ business.name }}</h1>
              <div class="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-bold">
                <svg class="w-5 h-5 md:w-6 md:h-6 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span class="text-sm md:text-lg">{{ business.location }}</span>
              </div>
            </div>

            <p class="text-slate-600 text-base md:text-lg leading-relaxed border-l-0 md:border-l-4 border-fiery-red/20 px-0 md:pl-6 py-2">
              {{ business.description }}
            </p>

            <!-- Social Links -->
            <div class="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2">
              <a v-if="business.socials.whatsapp" :href="business.socials.whatsapp" target="_blank" class="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl font-black text-sm transition-all shadow-lg group">
                WhatsApp
              </a>
              <div class="flex gap-2">
                <a v-if="business.socials.instagram" :href="business.socials.instagram" target="_blank" class="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                </a>
                <a v-if="business.socials.facebook" :href="business.socials.facebook" target="_blank" class="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        
        <!-- Left Section: Products & Services -->
        <div class="lg:col-span-2 space-y-12 md:space-y-16">
          
          <!-- Products -->
          <div class="space-y-6 md:space-y-8">
            <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Productos
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              <div v-for="product in business.products" :key="product.id" class="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
                <div class="h-48 md:h-64 overflow-hidden">
                  <img :src="product.image" :alt="product.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div class="p-6 md:p-8">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-xl md:text-2xl font-bold text-fiery-navy">{{ product.name }}</h3>
                    <span class="text-xl md:text-2xl font-black text-fiery-red">{{ product.price }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Services Section -->
          <div class="space-y-6 md:space-y-8">
            <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Servicios
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div v-for="service in business.services" :key="service.name" class="flex justify-between items-center bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 md:gap-4">
                  <div class="w-8 h-8 md:w-10 md:h-10 bg-fiery-navy/5 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 md:w-6 md:h-6 text-fiery-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="font-bold text-fiery-navy text-base md:text-lg">{{ service.name }}</span>
                </div>
                <span class="font-black text-fiery-red text-sm">{{ service.price }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Hours & Map -->
        <div class="space-y-8">
          <div class="bg-fiery-navy rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 text-white shadow-xl lg:sticky lg:top-36">
            <h3 class="text-xl md:text-2xl font-black mb-6 md:mb-8 font-outfit flex items-center gap-4">
              <svg class="w-6 h-6 md:w-8 md:h-8 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Horarios
            </h3>
            <div class="space-y-4 mb-8 md:mb-10">
              <div v-for="h in business.hours" :key="h.day" class="flex justify-between items-center pb-3 border-b border-white/10 last:border-0 last:pb-0">
                <span class="font-bold text-fiery-cream/70 text-sm md:text-base">{{ h.day }}</span>
                <span class="font-black text-[10px] md:text-xs bg-white/10 px-3 py-1.5 rounded-xl">{{ h.time }}</span>
              </div>
            </div>

            <div class="space-y-5 pt-6 md:pt-8 border-t border-white/10">
              <h3 class="text-lg md:text-xl font-black font-outfit flex items-center gap-3">
                <svg class="w-5 h-5 md:w-6 md:h-6 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Ubicación
              </h3>
              
              <div class="w-full h-40 md:h-48 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-2 border-white/10 bg-slate-100">
                <iframe :src="mapUrl" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
              </div>

              <p class="text-fiery-cream/80 font-medium text-[11px] md:text-xs text-center md:text-left">{{ business.location }}</p>
              
              <a href="https://maps.google.com" target="_blank" class="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-fiery-navy rounded-xl md:rounded-2xl font-black text-sm hover:bg-fiery-red hover:text-white transition-all shadow-md">
                Abrir Maps
              </a>
            </div>
          </div>
        </div>

        <!-- Full Width Bottom Section: Reviews -->
        <div class="lg:col-span-3 pt-8 md:pt-12">
          <div class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4 w-full">
                Reseñas
                <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
              </h2>
              <button class="w-full md:w-auto bg-fiery-red text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-fiery-darkred transition-all shadow-lg shadow-fiery-red/20">
                Escribir reseña
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="review in business.reviews" :key="review.id" class="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                <div class="flex justify-between items-start mb-4 md:mb-6">
                  <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-fiery-navy text-white flex items-center justify-center font-black text-lg md:text-xl">
                      {{ review.user.charAt(0) }}
                    </div>
                    <div>
                      <h4 class="font-black text-fiery-navy text-base md:text-lg">{{ review.user }}</h4>
                      <p class="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">{{ review.date }}</p>
                    </div>
                  </div>
                  <div class="flex text-yellow-400">
                    <svg v-for="i in 5" :key="i" class="w-4 h-4 md:w-5 md:h-5" :class="i <= review.rating ? 'fill-current' : 'text-slate-200'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                </div>
                <p class="text-slate-600 text-base md:text-lg italic">"{{ review.comment }}"</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>
