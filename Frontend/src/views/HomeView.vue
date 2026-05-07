<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'
import heroBgImage from '../assets/images/hero_bg.png'

// Placeholder data for demonstration
const featuredBusinesses = ref([
  {
    id: 1,
    name: 'TechSolutions Guatemala',
    category: 'Tecnología',
    rating: 4.8,
    description: 'Ofrecemos los mejores servicios en soporte técnico, desarrollo de software y consultoría tecnológica para tu empresa.',
    location: 'Zona 10, Ciudad de Guatemala',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Café de Antigua',
    category: 'Restaurante',
    rating: 4.9,
    description: 'El mejor café tostado de Antigua Guatemala. Ambiente acogedor y repostería artesanal para acompañar tus mañanas.',
    location: 'Antigua Guatemala',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Muebles Artesanales',
    category: 'Hogar',
    rating: 4.6,
    description: 'Muebles tallados a mano con madera de cedro de primera calidad. Diseños personalizados para tu hogar.',
    location: 'Quetzaltenango',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 7,
    name: 'AutoServicios Rápidos',
    category: 'Automotriz',
    rating: 4.7,
    description: 'Taller mecánico de confianza. Mantenimiento, diagnóstico y reparación general.',
    location: 'Zona 5, Ciudad de Guatemala',
    image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 8,
    name: 'Panadería La Casera',
    category: 'Alimentación',
    rating: 4.9,
    description: 'Pan fresco todos los días, pasteles de cumpleaños y repostería artesanal tradicional.',
    location: 'Mixco',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop'
  }
])

const currentCarouselIndex = ref(0)

const nextCard = () => {
  currentCarouselIndex.value = (currentCarouselIndex.value + 1) % featuredBusinesses.value.length
}

const prevCard = () => {
  currentCarouselIndex.value = (currentCarouselIndex.value - 1 + featuredBusinesses.value.length) % featuredBusinesses.value.length
}

const getCarouselStyle = (index) => {
  const total = featuredBusinesses.value.length;
  let diff = (index - currentCarouselIndex.value) % total;
  
  if (diff > Math.floor(total / 2)) diff -= total;
  if (diff < -Math.floor(total / 2)) diff += total;

  if (diff === 0) {
    return {
      transform: 'translateX(0) scale(1) rotateY(0deg)',
      zIndex: 30,
      opacity: 1,
      filter: 'brightness(1)'
    }
  } else if (diff === -1) {
    return {
      transform: 'translateX(-55%) scale(0.85) rotateY(15deg)',
      zIndex: 20,
      opacity: 0.95,
      filter: 'brightness(0.95)'
    }
  } else if (diff === 1) {
    return {
      transform: 'translateX(55%) scale(0.85) rotateY(-15deg)',
      zIndex: 20,
      opacity: 0.95,
      filter: 'brightness(0.95)'
    }
  } else if (diff === -2) {
    return {
      transform: 'translateX(-100%) scale(0.7) rotateY(25deg)',
      zIndex: 10,
      opacity: 0.85,
      filter: 'brightness(0.9)'
    }
  } else if (diff === 2) {
    return {
      transform: 'translateX(100%) scale(0.7) rotateY(-25deg)',
      zIndex: 10,
      opacity: 0.85,
      filter: 'brightness(0.9)'
    }
  } else {
    return {
      transform: `translateX(${diff > 0 ? '150%' : '-150%'}) scale(0.5)`,
      zIndex: 0,
      opacity: 0,
      pointerEvents: 'none'
    }
  }
}

const mostReviewed = ref([
  {
    id: 4,
    name: 'Clínica Dental Sonrisas',
    category: 'Salud',
    rating: 5.0,
    description: 'Cuidamos de tu sonrisa con la última tecnología en odontología general y ortodoncia.',
    location: 'Zona 1, Ciudad de Guatemala',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Gimnasio Fitness Plus',
    category: 'Deportes',
    rating: 4.7,
    description: 'El mejor lugar para entrenar. Máquinas modernas, clases grupales y entrenadores certificados.',
    location: 'Zona 14, Ciudad de Guatemala',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Boutique Elegance',
    category: 'Moda',
    rating: 4.5,
    description: 'Ropa exclusiva para eventos especiales. Trajes, vestidos de noche y accesorios de las mejores marcas.',
    location: 'Cayalá, Ciudad de Guatemala',
    image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=800&auto=format&fit=crop'
  }
])

const searchCategory = ref('Ubicación')
const searchKeyword = ref('')
const searchLocation = ref('')
const router = useRouter()

const triggerSearch = () => {
  router.push({ path: '/directorio', query: { q: searchKeyword.value, loc: searchLocation.value } })
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <Navbar />

    <!-- Hero Section -->
    <section class="relative pt-32 pb-48 lg:pt-40 lg:pb-64 bg-slate-900">
      <!-- Background Image, Overlay and Wave (with overflow hidden) -->
      <div class="absolute inset-0 z-0 overflow-hidden">
        <img :src="heroBgImage" alt="Background" class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/40"></div>
        
        <!-- SVG Curve Cut Bottom (2 olas MUY pronunciadas) -->
        <div class="absolute bottom-0 left-0 w-full leading-none z-10 translate-y-[1px]">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="relative block w-full h-[150px] md:h-[350px]">
            <path fill="#f8fafc" d="M0,120 C450,450 900,-250 1440,180 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="text-left">
          <div class="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 font-semibold text-sm mb-6 backdrop-blur-sm">
            Directorio de Negocios PYME
          </div>
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] font-outfit">
            Descubre<br/> <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Negocios cerca</span>
          </h1>
          <p class="text-slate-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            Encuentra los mejores negocios, servicios y productos cerca de ti. Apoya a los emprendedores y descubre lo que tu ciudad tiene para ofrecer.
          </p>
        </div>

        <!-- Overlapping PNG Image (Now allowed to overflow the section) -->
        <div class="hidden lg:flex justify-end absolute right-0 lg:right-[5%] bottom-[-250px] z-50 pointer-events-none w-[45%]">
          <img 
            src="../assets/images/emprendedor.png" 
            alt="Emprendedor" 
            class="w-full max-w-[500px] h-auto object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] animate-float"
            onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'"
          />
        </div>
      </div>
    </section>

    <!-- Search Bar (Overlapping perfectly with solid white background, aligned left) -->
    <section class="relative z-40 -mt-16 md:-mt-24 container mx-auto px-6">
      <div class="max-w-4xl relative">
        
        <!-- Overlapping Toggle Buttons -->
        <div class="absolute -top-5 left-6 md:left-10 flex bg-purple-700 p-1.5 rounded-full shadow-lg z-20">
          <button 
            @click="searchCategory = 'Ubicación'"
            :class="[searchCategory === 'Ubicación' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-200 hover:text-white', 'px-5 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5']"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
            Ubicación
          </button>
          <button 
            @click="searchCategory = 'Negocio'"
            :class="[searchCategory === 'Negocio' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-200 hover:text-white', 'px-5 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5']"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Negocio
          </button>
        </div>

        <div class="bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-3 md:p-5 pt-10 md:pt-6 flex flex-col md:flex-row items-center gap-4 relative z-10 border border-slate-50">
          <!-- Inputs -->
          <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-2 md:px-6">
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qué buscas?</span>
              <input v-model="searchKeyword" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Restaurantes, Dentistas..." class="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-bold focus:ring-0 p-0 text-base" />
            </div>
            <div class="flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dónde?</span>
              <input v-model="searchLocation" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Zona 10, Antigua..." class="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-bold focus:ring-0 p-0 text-base" />
            </div>
          </div>

          <!-- Search Button -->
          <button @click="triggerSearch" class="w-full md:w-auto shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30 group font-bold text-lg">
            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section (Diseño Creativo y Animado) -->
    <section class="py-28 relative overflow-hidden bg-white">
      <!-- Animated Background Blobs -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div class="absolute top-[20%] right-[-5%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div class="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-20 relative">
          <span class="text-purple-600 font-bold uppercase tracking-wider text-sm mb-2 block">Proceso Simple</span>
          <h2 class="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">¿Cómo funciona?</h2>
          <p class="text-slate-500 max-w-2xl mx-auto text-lg">Conecta con los mejores negocios y clientes en tres simples pasos diseñados para facilitar tu experiencia.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16 max-w-6xl mx-auto relative">
          <!-- Connecting Dashed Line -->
          <div class="hidden md:block absolute top-24 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-purple-200 z-0"></div>

          <!-- Step 1 -->
          <div class="relative group mt-0 md:mt-0 z-10">
            <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-40 transition duration-500"></div>
            <div class="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-10 flex flex-col items-center text-center h-full border border-white transition-all duration-500 hover:-translate-y-4">
              
              <div class="absolute -top-5 -left-5 w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xl shadow-xl shadow-slate-900/20 z-20 group-hover:scale-110 transition-transform">1</div>

              <div class="relative w-24 h-24 mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:rotate-[-5deg]">
                <div class="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-20" style="animation-duration: 3s;"></div>
                <div class="relative z-10 w-full h-full rounded-[2rem] bg-gradient-to-br from-purple-50 to-white text-purple-600 flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(168,85,247,0.3)] border border-purple-100">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-slate-800 mb-3 font-outfit">Búsqueda Fácil</h3>
              <p class="text-slate-500 font-medium">Encuentra negocios rápidamente con nuestro buscador inteligente integrado.</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative group mt-0 md:mt-16 z-10">
            <div class="absolute -inset-1 bg-gradient-to-r from-pink-600 to-rose-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-40 transition duration-500"></div>
            <div class="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-10 flex flex-col items-center text-center h-full border border-white transition-all duration-500 hover:-translate-y-4">
              
              <div class="absolute -top-5 -left-5 w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xl shadow-xl shadow-slate-900/20 z-20 group-hover:scale-110 transition-transform">2</div>

              <div class="relative w-24 h-24 mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:rotate-[5deg]">
                <div class="absolute inset-0 bg-pink-200 rounded-full animate-ping opacity-20" style="animation-duration: 3s; animation-delay: 1s;"></div>
                <div class="relative z-10 w-full h-full rounded-[2rem] bg-gradient-to-br from-pink-50 to-white text-pink-600 flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(236,72,153,0.3)] border border-pink-100">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-slate-800 mb-3 font-outfit">Reseñas Reales</h3>
              <p class="text-slate-500 font-medium">Lee opiniones verificadas de otros clientes para tomar la mejor decisión.</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative group mt-0 md:mt-0 z-10">
            <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-40 transition duration-500"></div>
            <div class="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-10 flex flex-col items-center text-center h-full border border-white transition-all duration-500 hover:-translate-y-4">
              
              <div class="absolute -top-5 -left-5 w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xl shadow-xl shadow-slate-900/20 z-20 group-hover:scale-110 transition-transform">3</div>

              <div class="relative w-24 h-24 mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:rotate-[-5deg]">
                <div class="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20" style="animation-duration: 3s; animation-delay: 2s;"></div>
                <div class="relative z-10 w-full h-full rounded-[2rem] bg-gradient-to-br from-blue-50 to-white text-blue-600 flex items-center justify-center shadow-[0_15px_30px_-10px_rgba(59,130,246,0.3)] border border-blue-100">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-slate-800 mb-3 font-outfit">Crece tu PYME</h3>
              <p class="text-slate-500 font-medium">Publica tu negocio gratis y conéctate con miles de clientes potenciales.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Destacados Section (Carrusel 3D Coverflow) -->
    <section class="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div class="container mx-auto px-6 max-w-6xl">
        <div class="flex justify-between items-end mb-16 relative z-40">
          <div>
            <h4 class="text-purple-600 font-bold uppercase tracking-wider text-sm mb-2">Populares</h4>
            <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">Negocios Destacados</h2>
          </div>
          
          <!-- Botones de Navegación -->
          <div class="flex items-center gap-3">
            <button @click="prevCard" class="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 transition-all focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button @click="nextCard" class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 shadow-md shadow-purple-500/30 transition-all focus:outline-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
        
        <!-- Carrusel 3D Container -->
        <div class="relative h-[480px] md:h-[520px] flex justify-center items-center w-full" style="perspective: 1200px;">
          <div 
            v-for="(business, index) in featuredBusinesses" 
            :key="business.id" 
            class="absolute w-full max-w-[300px] md:max-w-[360px] transition-all duration-700 ease-out cursor-pointer"
            :style="getCarouselStyle(index)"
            @click="currentCarouselIndex = index"
          >
            <!-- Deshabilitamos eventos de click en las tarjetas del fondo para que no interfieran con la de enfrente -->
            <div :class="{'pointer-events-none': currentCarouselIndex !== index, 'shadow-2xl shadow-purple-500/30 rounded-3xl': currentCarouselIndex === index}">
              <BusinessCard :business="business" class="h-full" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Más Reseñas Section -->
    <section class="py-20 bg-[#f8fafc]">
      <div class="container mx-auto px-6 max-w-6xl">
        <div class="flex justify-between items-end mb-10">
          <div>
            <h4 class="text-pink-500 font-bold uppercase tracking-wider text-sm mb-2">Top Calificados</h4>
            <h2 class="text-3xl font-extrabold text-slate-900">Con Más Reseñas</h2>
          </div>
          <button class="hidden md:flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-800 transition-colors">
            Ver todos 
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BusinessCard v-for="business in mostReviewed" :key="business.id" :business="business" />
        </div>
      </div>
    </section>

    <!-- Call to Action (Register) -->
    <section class="py-24 bg-slate-900 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50"></div>
      </div>
      <div class="container mx-auto px-6 relative z-10 text-center">
        <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-6">¿Tienes un negocio?</h2>
        <p class="text-xl text-slate-300 max-w-2xl mx-auto mb-10">Únete a nuestra plataforma y conecta con miles de clientes potenciales buscando servicios como el tuyo en ConectaPYME.</p>
        <button class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-purple-500/30 transition-all hover:scale-105">
          Registrar mi Negocio Gratis
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
