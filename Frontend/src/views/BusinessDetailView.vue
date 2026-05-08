<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'

const route = useRoute()
const router = useRouter()
const business = ref(null)

const fetchBusinessDetails = (id) => {
  return {
    id: id,
    name: 'Café El Despertar',
    logo: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=200&auto=format&fit=crop',
    category: 'Restaurantes',
    rating: 4.8,
    reviewCount: 124,
    description: 'El mejor café artesanal y repostería local para empezar tu día con energía. Nuestro grano es seleccionado cuidadosamente de las fincas más prestigiosas del país para garantizar una experiencia sensorial única en cada taza. Ofrecemos un ambiente tranquilo ideal para trabajar o compartir con amigos.',
    location: 'Zona 1, Ciudad de Guatemala',
    hours: [
      { day: 'Lunes - Viernes', time: '7:00 AM - 8:00 PM' },
      { day: 'Sábado', time: '8:00 AM - 6:00 PM' },
      { day: 'Domingo', time: '9:00 AM - 4:00 PM' }
    ],
    socials: {
      whatsapp: 'https://wa.me/50212345678',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
      website: 'https://google.com'
    },
    products: [
      { id: 1, name: 'Cappuccino Artesanal', price: 'Q 25.00', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=400&auto=format&fit=crop' },
      { id: 2, name: 'Pastel de Chocolate', price: 'Q 35.00', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&auto=format&fit=crop' },
      { id: 3, name: 'Desayuno Típico', price: 'Q 45.00', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400&auto=format&fit=crop' },
      { id: 4, name: 'Latte Vainilla', price: 'Q 28.00', image: 'https://images.unsplash.com/photo-1593967858208-67ddb5b4c426?q=80&w=400&auto=format&fit=crop' }
    ],
    services: [
      { name: 'WiFi Gratuito', price: 'Gratis' },
      { name: 'Reserva de Mesas', price: 'Gratis' },
      { name: 'Evento Privado', price: 'Q 500.00' },
      { name: 'Catering Externo', price: 'Desde Q 1000' }
    ],
    reviews: [
      { id: 1, user: 'Ana García', rating: 5, comment: '¡Increíble lugar! El café es delicioso y el ambiente es perfecto.', date: 'Hace 2 días' },
      { id: 2, user: 'Carlos Ruiz', rating: 4, comment: 'Muy buena atención, aunque el pastel de chocolate estaba un poco seco.', date: 'Hace 1 semana' },
      { id: 3, user: 'Sofía Méndez', rating: 5, comment: 'Mi lugar favorito para desayunar los domingos. El servicio es impecable.', date: 'Hace 2 semanas' }
    ]
  }
}

const mapUrl = computed(() => {
  if (!business.value) return ''
  const query = encodeURIComponent(business.value.location)
  // Usando maps.google.com con output=embed que es el formato más compatible sin API Key
  return `https://maps.google.com/maps?q=${query}&output=embed`
})

onMounted(() => {
  business.value = fetchBusinessDetails(route.params.id)
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <div v-if="business" class="min-h-screen bg-white">
    <Navbar />

    <div class="container mx-auto px-6 pt-32 pb-20 max-w-6xl">
      
      <!-- Top Navigation -->
      <div class="flex items-center justify-between mb-8">
        <button @click="goBack" class="flex items-center gap-2 text-fiery-navy font-bold hover:text-fiery-red transition-all group px-4 py-2 rounded-xl hover:bg-fiery-cream">
          <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Regresar
        </button>
      </div>

      <!-- Main Business Card -->
      <div class="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 p-8 md:p-12 mb-12 overflow-hidden relative">
        <div class="absolute top-0 right-0 w-64 h-64 bg-fiery-red/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div class="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <!-- Logo Section -->
          <div class="w-full md:w-auto flex flex-col items-center gap-6">
            <div class="w-40 h-40 md:w-52 md:h-52 rounded-[2.5rem] overflow-hidden bg-white shadow-xl border border-slate-100 p-2">
              <img :src="business.logo" :alt="business.name" class="w-full h-full object-cover rounded-[2rem]" />
            </div>
            
            <!-- Overall Stars Section -->
            <div class="bg-fiery-navy rounded-3xl p-6 text-center text-white w-full">
              <div class="text-4xl font-black mb-1">{{ business.rating }}</div>
              <div class="flex justify-center text-yellow-400 mb-2">
                <svg v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.floor(business.rating) ? 'fill-current' : 'text-white/20'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
              <div class="text-xs font-bold text-fiery-cream/60 uppercase tracking-widest">Promedio de {{ business.reviewCount }} votos</div>
            </div>
          </div>

          <!-- Info Section -->
          <div class="flex-1 space-y-6">
            <div>
              <div class="inline-block px-4 py-1 bg-fiery-red text-white rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-fiery-red/20">
                {{ business.category }}
              </div>
              <h1 class="text-5xl md:text-6xl font-black text-fiery-navy font-outfit mb-4">{{ business.name }}</h1>
              <div class="flex items-center gap-2 text-slate-500 font-bold">
                <svg class="w-6 h-6 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span class="text-lg">{{ business.location }}</span>
              </div>
            </div>

            <p class="text-slate-600 text-lg leading-relaxed border-l-4 border-fiery-red/20 pl-6 py-2">
              {{ business.description }}
            </p>

            <!-- Contact/Social Links -->
            <div class="flex flex-wrap gap-4 pt-4">
              <a v-if="business.socials.whatsapp" :href="business.socials.whatsapp" target="_blank" class="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-green-500/20 group">
                <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path></svg>
                Contactar ahora
              </a>
              <div class="flex gap-2">
                <a v-if="business.socials.instagram" :href="business.socials.instagram" target="_blank" class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                </a>
                <a v-if="business.socials.facebook" :href="business.socials.facebook" target="_blank" class="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <!-- Left Section: Products, Services & Reviews -->
        <div class="lg:col-span-2 space-y-16">
          
          <!-- Products -->
          <div class="space-y-8">
            <h2 class="text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Nuestros Productos
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div v-for="product in business.products" :key="product.id" class="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500 group">
                <div class="h-64 overflow-hidden">
                  <img :src="product.image" :alt="product.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div class="p-8">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-2xl font-bold text-fiery-navy">{{ product.name }}</h3>
                    <span class="text-2xl font-black text-fiery-red">{{ product.price }}</span>
                  </div>
                  <p class="text-slate-500 font-medium">Información sujeta a disponibilidad en el local.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Services Section (Text Only) -->
          <div class="space-y-8">
            <h2 class="text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Servicios Disponibles
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div v-for="service in business.services" :key="service.name" class="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-fiery-red/20 hover:bg-white hover:shadow-xl transition-all group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-fiery-navy/5 rounded-xl flex items-center justify-center group-hover:bg-fiery-red/10 transition-colors">
                    <svg class="w-6 h-6 text-fiery-navy group-hover:text-fiery-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="font-bold text-fiery-navy text-lg">{{ service.name }}</span>
                </div>
                <span class="font-black text-fiery-red bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-50">{{ service.price }}</span>
              </div>
            </div>
          </div>

          <!-- Reviews Section -->
          <div class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 class="text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4 flex-1">
                Reseñas
                <div class="h-1 flex-1 bg-fiery-cream rounded-full hidden md:block"></div>
              </h2>
              <button class="flex items-center gap-2 bg-fiery-red text-white px-6 py-3 rounded-2xl font-bold hover:bg-fiery-darkred transition-all shadow-lg shadow-fiery-red/20 group">
                <svg class="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Escribir una reseña
              </button>
            </div>
            
            <div class="grid grid-cols-1 gap-6">
              <div v-for="review in business.reviews" :key="review.id" class="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 transition-all hover:bg-white hover:shadow-xl">
                <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-fiery-navy text-white flex items-center justify-center font-black text-xl shadow-lg">
                      {{ review.user.charAt(0) }}
                    </div>
                    <div>
                      <h4 class="font-black text-fiery-navy text-lg">{{ review.user }}</h4>
                      <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">{{ review.date }}</p>
                    </div>
                  </div>
                  <div class="flex text-yellow-400">
                    <svg v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= review.rating ? 'fill-current' : 'text-slate-200'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                </div>
                <p class="text-slate-600 text-lg italic leading-relaxed">"{{ review.comment }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Opening Hours & Location -->
        <div class="space-y-8">
          <div class="bg-fiery-navy rounded-[3rem] p-8 text-white shadow-2xl shadow-fiery-navy/30 sticky top-36">
            <h3 class="text-2xl font-black mb-8 font-outfit flex items-center gap-4">
              <svg class="w-8 h-8 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Horarios
            </h3>
            <div class="space-y-5 mb-10">
              <div v-for="h in business.hours" :key="h.day" class="flex justify-between items-center pb-4 border-b border-white/10 last:border-0 last:pb-0">
                <span class="font-bold text-fiery-cream/70">{{ h.day }}</span>
                <span class="font-black text-xs bg-white/10 px-4 py-2 rounded-2xl">{{ h.time }}</span>
              </div>
            </div>

            <!-- Location Integrated with Live Map -->
            <div class="space-y-6 pt-8 border-t border-white/10">
              <h3 class="text-xl font-black font-outfit flex items-center gap-4">
                <svg class="w-6 h-6 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Ubicación
              </h3>
              
              <!-- Map Embed -->
              <div class="w-full h-48 rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-inner transition-all duration-700 bg-slate-100">
                <iframe 
                  :src="mapUrl" 
                  width="100%" 
                  height="100%" 
                  style="border:0;" 
                  allowfullscreen="" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade">
                </iframe>
              </div>

              <p class="text-fiery-cream/80 font-medium leading-relaxed text-xs">{{ business.location }}</p>
              
              <a href="https://maps.google.com" target="_blank" class="flex items-center justify-center gap-3 w-full py-4 bg-white text-fiery-navy rounded-2xl font-black transition-all hover:bg-fiery-red hover:text-white group shadow-lg">
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                Abrir en Google Maps
              </a>
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
