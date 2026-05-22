<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'
import heroBgImage from '../assets/images/hero_bg.png'
import { getFeaturedBusinesses } from '../services/businessService'
const router = useRouter()
const searchCategory = ref('Ubicación')
const searchKeyword = ref('')
const searchLocation = ref('')
const currentCarouselIndex = ref(0)

// Featured data — fetched from backend API
const featuredBusinesses = ref([])

// Carousel Logic
const nextCard = () => { currentCarouselIndex.value = (currentCarouselIndex.value + 1) % featuredBusinesses.value.length }
const prevCard = () => { currentCarouselIndex.value = (currentCarouselIndex.value - 1 + featuredBusinesses.value.length) % featuredBusinesses.value.length }

const getCarouselStyle = (index) => {
  const total = featuredBusinesses.value.length;
  let diff = (index - currentCarouselIndex.value) % total;
  if (diff > Math.floor(total / 2)) diff -= total;
  if (diff < -Math.floor(total / 2)) diff += total;

  if (diff === 0) return { transform: 'translateX(0) scale(1) rotateY(0deg)', zIndex: 30, opacity: 1, filter: 'brightness(1)' }
  if (diff === -1) return { transform: 'translateX(-60%) scale(0.8) rotateY(20deg)', zIndex: 20, opacity: 0.8, filter: 'brightness(0.8)' }
  if (diff === 1) return { transform: 'translateX(60%) scale(0.8) rotateY(-20deg)', zIndex: 20, opacity: 0.8, filter: 'brightness(0.8)' }
  if (diff === -2) return { transform: 'translateX(-110%) scale(0.6) rotateY(35deg)', zIndex: 10, opacity: 0.4, filter: 'brightness(0.6)' }
  if (diff === 2) return { transform: 'translateX(110%) scale(0.6) rotateY(-35deg)', zIndex: 10, opacity: 0.4, filter: 'brightness(0.6)' }
  return { transform: `translateX(${diff > 0 ? '150%' : '-150%'}) scale(0.4)`, zIndex: 0, opacity: 0 }
}

const triggerSearch = () => {
  router.push({ path: '/directorio', query: { q: searchKeyword.value, loc: searchLocation.value } })
}

// Scroll Reveal Logic
const revealedElements = ref(new Set());
onMounted(async () => {
  try {
    featuredBusinesses.value = await getFeaturedBusinesses(5)
  } catch (err) {
    console.error('Error fetching featured businesses:', err)
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealedElements.value.add(entry.target.dataset.id);
      } else {
        revealedElements.value.delete(entry.target.dataset.id);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
    el.dataset.id = `reveal-${i}`;
    observer.observe(el);
  });
});
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar />

    <!-- Hero Section -->
    <section class="relative pt-32 pb-48 lg:pt-40 lg:pb-64 bg-slate-900">
      <div class="absolute inset-0 z-0 overflow-hidden">
        <img :src="heroBgImage" class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/40"></div>
        <div class="absolute bottom-0 left-0 w-full leading-none z-10 translate-y-[1px]">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="relative block w-full h-[120px] md:h-[320px]">
            <path fill="#ffffff" d="M0,120 C450,450 900,-250 1440,180 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </div>

      <div class="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="text-left">
          <div class="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 font-semibold text-xs mb-6 backdrop-blur-sm uppercase tracking-widest">Directorio de Negocios PYME</div>
          <h1 class="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] font-outfit uppercase tracking-tighter">Descubre<br/> <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Negocios cerca</span></h1>
          <p class="text-slate-300 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">Encuentra los mejores negocios, servicios y productos cerca de ti. Apoya a los emprendedores y descubre lo que tu ciudad tiene para ofrecer.</p>
        </div>
        <div class="hidden lg:flex justify-end absolute right-0 bottom-[-220px] z-50 pointer-events-none w-[45%]">
          <img src="../assets/images/emprendedor.png" class="w-full max-w-[500px] h-auto animate-float drop-shadow-2xl" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" />
        </div>
      </div>
    </section>

    <!-- Search Bar -->
    <section class="relative z-40 -mt-16 md:-mt-24 container mx-auto px-4 md:px-6">
      <div class="max-w-4xl">
        <div class="absolute -top-5 left-6 flex bg-purple-700 p-1.5 rounded-full shadow-lg z-20">
          <button @click="searchCategory = 'Ubicación'" :class="[searchCategory === 'Ubicación' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-200', 'px-5 py-1.5 rounded-full text-xs font-bold transition-all']">Ubicación</button>
          <button @click="searchCategory = 'Negocio'" :class="[searchCategory === 'Negocio' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-200', 'px-5 py-1.5 rounded-full text-xs font-bold transition-all']">Negocio</button>
        </div>
        <div class="bg-white rounded-[2.5rem] shadow-2xl p-4 md:p-5 pt-10 md:pt-6 flex flex-col md:flex-row items-center gap-4 border border-slate-50">
          <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">¿Qué buscas?</span>
              <input v-model="searchKeyword" @keyup.enter="triggerSearch" type="text" placeholder="Restaurantes, Tiendas..." class="w-full bg-transparent border-none outline-none text-slate-800 font-bold p-0 text-base" />
            </div>
            <div class="flex flex-col md:border-l md:border-slate-100 md:pl-6">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">¿En dónde?</span>
              <input v-model="searchLocation" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Antigua, Zona 10..." class="w-full bg-transparent border-none outline-none text-slate-800 font-bold p-0 text-base" />
            </div>
          </div>
          <button @click="triggerSearch" class="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-purple-500/30 transition-all active:scale-95">Buscar</button>
        </div>
      </div>
    </section>

    <!-- 1. Locales Destacados Section -->
    <section class="py-28 bg-white overflow-hidden">
      <div class="container mx-auto px-6 max-w-6xl">
        <div class="flex flex-col md:flex-row justify-between items-center mb-16 reveal-on-scroll transition-all duration-1000" :class="revealedElements.has('reveal-0') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
          <div class="text-center md:text-left mb-8 md:mb-0">
            <h4 class="text-purple-600 font-black uppercase tracking-[0.3em] text-xs mb-3">Recomendados</h4>
            <h2 class="text-4xl md:text-5xl font-black text-fiery-navy font-outfit uppercase tracking-tighter leading-none">Negocios <span class="text-fiery-red">Destacados</span></h2>
          </div>
          <div class="flex gap-4">
            <button @click="prevCard" class="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-600 hover:bg-fiery-red hover:text-white transition-all shadow-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button @click="nextCard" class="w-14 h-14 rounded-2xl bg-fiery-red text-white flex items-center justify-center shadow-lg shadow-fiery-red/20 hover:bg-fiery-darkred transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

        <div class="relative h-[550px] flex justify-center items-center overflow-hidden reveal-on-scroll transition-all duration-1000 delay-300" 
             :class="revealedElements.has('reveal-1') ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'"
             style="perspective: 2000px;">
          <div v-for="(b, i) in featuredBusinesses" :key="b.id" class="absolute w-full max-w-[340px] md:max-w-[400px] transition-all duration-700 ease-out" :style="getCarouselStyle(i)">
            <BusinessCard :business="b" />
          </div>
        </div>
      </div>
    </section>

    <!-- 2. How it Works Section (ULTRA CREATIVA) -->
    <section class="py-32 bg-white relative overflow-hidden">
      <!-- Background Shapes -->
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-0 right-0 w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-40"></div>
        <div class="absolute bottom-0 left-0 w-[40%] h-[40%] bg-fiery-red/5 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-28 reveal-on-scroll transition-all duration-1000" :class="revealedElements.has('reveal-2') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
          <h4 class="text-fiery-red font-black uppercase tracking-[0.4em] text-xs mb-4">Experiencia Conecta</h4>
          <h2 class="text-5xl md:text-7xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">¿Cómo <span class="text-fiery-red">funciona</span>?</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-24 lg:gap-32 max-w-6xl mx-auto">
          <!-- Step 1: Busca -->
          <div class="relative reveal-on-scroll transition-all duration-1000 delay-100 group" :class="revealedElements.has('reveal-3') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <!-- Glow background -->
            <div class="absolute -inset-8 bg-purple-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <!-- Number background -->
            <div class="absolute -top-16 -left-8 text-[12rem] font-black text-slate-50 leading-none z-0 pointer-events-none select-none group-hover:text-purple-100 transition-colors duration-500">1</div>
            
            <!-- Content card -->
            <div class="relative z-10">
              <div class="mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 border-4 border-white">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop" class="w-full h-72 object-cover" alt="Busca">
              </div>
              <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase tracking-tighter group-hover:text-fiery-red transition-colors">Encuentra</h3>
              <p class="text-slate-500 font-medium leading-relaxed text-lg">Localiza los mejores locales por nombre o categoría en toda Guatemala con un solo clic.</p>
            </div>
          </div>

          <!-- Step 2: Compara -->
          <div class="relative reveal-on-scroll transition-all duration-1000 delay-300 group" :class="revealedElements.has('reveal-4') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <div class="absolute -inset-8 bg-fiery-red/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="absolute -top-16 -left-8 text-[12rem] font-black text-slate-50 leading-none z-0 pointer-events-none select-none group-hover:text-fiery-red/5 transition-colors duration-500">2</div>
            <div class="relative z-10">
              <div class="mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 border-4 border-white">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" class="w-full h-72 object-cover" alt="Compara">
              </div>
              <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase tracking-tighter group-hover:text-fiery-red transition-colors">Analiza</h3>
              <p class="text-slate-500 font-medium leading-relaxed text-lg">Revisa reseñas, fotos y servicios detallados para asegurarte de recibir la mejor calidad.</p>
            </div>
          </div>

          <!-- Step 3: Conecta -->
          <div class="relative reveal-on-scroll transition-all duration-1000 delay-500 group" :class="revealedElements.has('reveal-5') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <div class="absolute -inset-8 bg-blue-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="absolute -top-16 -left-8 text-[12rem] font-black text-slate-50 leading-none z-0 pointer-events-none select-none group-hover:text-blue-50 transition-colors duration-500">3</div>
            <div class="relative z-10">
              <div class="mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 border-4 border-white">
                <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=800&auto=format&fit=crop" class="w-full h-72 object-cover" alt="Conecta">
              </div>
              <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase tracking-tighter group-hover:text-fiery-red transition-colors">Conecta</h3>
              <p class="text-slate-500 font-medium leading-relaxed text-lg">Visítalos usando nuestro mapa o contáctalos directamente. ¡Haz crecer la economía local!</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer CTA -->
    <section class="py-24 bg-slate-900 text-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40 opacity-50"></div>
      <div class="container mx-auto px-6 relative z-10">
        <h2 class="text-4xl md:text-6xl font-black text-white mb-6 uppercase font-outfit tracking-tighter">¿Tienes un negocio?</h2>
        <p class="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">Únete a la red más grande de PYMEs en Guatemala y llega a miles de clientes potenciales.</p>
        <button class="group relative overflow-hidden bg-fiery-red text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-fiery-red/40 transition-all duration-300 hover:-translate-y-1 active:scale-95">
          <span class="relative z-10 flex items-center justify-center gap-3 transition-transform duration-300 group-hover:translate-x-2">
            Registrar mi Negocio Gratis
            <svg class="w-5 h-5 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </span>
          <div class="absolute inset-0 bg-fiery-darkred translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
.animate-float { animation: float 6s ease-in-out infinite; }

.reveal-on-scroll {
  will-change: transform, opacity;
}
</style>