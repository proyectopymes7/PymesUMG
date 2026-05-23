<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'
import alfombra from '@/assets/alfombra.webp'
import { getFeaturedBusinesses, getCategories } from '../services/businessService'

const router = useRouter()

// Search state
const searchCategory = ref('Negocio')
const searchKeyword = ref('')
const searchLocation = ref('')

// Dropdowns
const showCategoryDropdown = ref(false)
const showDepartmentDropdown = ref(false)
const selectedCategory = ref('')
const selectedDepartment = ref('')

// Categories from backend
const categories = ref([])

// Guatemala departments
const departments = [
  'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
  'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango',
  'Izabal', 'Jalapa', 'Jutiapa', 'Petén',
  'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
  'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez',
  'Totonicapán', 'Zacapa'
]

const selectCategory = (cat) => {
  selectedCategory.value = cat
  searchKeyword.value = cat
  showCategoryDropdown.value = false
}

const selectDepartment = (dep) => {
  selectedDepartment.value = dep
  searchLocation.value = dep
  showDepartmentDropdown.value = false
}

const closeDrowndowns = (e) => {
  if (!e.target.closest('.cat-dropdown-wrap')) showCategoryDropdown.value = false
  if (!e.target.closest('.dep-dropdown-wrap')) showDepartmentDropdown.value = false
}

// Carousel
const featuredBusinesses = ref([])
const currentCarouselIndex = ref(0)
const nextCard = () => { currentCarouselIndex.value = (currentCarouselIndex.value + 1) % featuredBusinesses.value.length }
const prevCard = () => { currentCarouselIndex.value = (currentCarouselIndex.value - 1 + featuredBusinesses.value.length) % featuredBusinesses.value.length }

const getCarouselStyle = (index) => {
  const total = featuredBusinesses.value.length
  let diff = (index - currentCarouselIndex.value) % total
  if (diff > Math.floor(total / 2)) diff -= total
  if (diff < -Math.floor(total / 2)) diff += total
  if (diff === 0)  return { transform: 'translateX(0) scale(1) rotateY(0deg)',        zIndex: 30, opacity: 1,   filter: 'brightness(1)' }
  if (diff === -1) return { transform: 'translateX(-60%) scale(0.8) rotateY(20deg)',  zIndex: 20, opacity: 0.8, filter: 'brightness(0.8)' }
  if (diff === 1)  return { transform: 'translateX(60%) scale(0.8) rotateY(-20deg)',  zIndex: 20, opacity: 0.8, filter: 'brightness(0.8)' }
  if (diff === -2) return { transform: 'translateX(-110%) scale(0.6) rotateY(35deg)', zIndex: 10, opacity: 0.4, filter: 'brightness(0.6)' }
  if (diff === 2)  return { transform: 'translateX(110%) scale(0.6) rotateY(-35deg)', zIndex: 10, opacity: 0.4, filter: 'brightness(0.6)' }
  return { transform: `translateX(${diff > 0 ? '150%' : '-150%'}) scale(0.4)`, zIndex: 0, opacity: 0 }
}

const triggerSearch = () => {
  router.push({ path: '/directorio', query: { q: searchKeyword.value, loc: searchLocation.value } })
}

// Reveal on scroll
const revealedElements = ref(new Set())

onMounted(async () => {
  try {
    featuredBusinesses.value = await getFeaturedBusinesses(5)
  } catch (err) {
    console.error('Error fetching featured businesses:', err)
  }

  try {
    const cats = await getCategories()
    categories.value = cats.filter(c => c !== 'Todas')
  } catch (err) {
    categories.value = ['Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio']
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) revealedElements.value.add(entry.target.dataset.id)
      else revealedElements.value.delete(entry.target.dataset.id)
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
    el.dataset.id = `reveal-${i}`
    observer.observe(el)
  })

  document.addEventListener('click', closeDrowndowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDrowndowns)
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar />

    <!-- ═══ HERO ═══ -->
    <section class="relative pt-32 pb-48 lg:pt-40 lg:pb-64">
      <div class="absolute inset-0 z-0 overflow-hidden">
        <img :src="alfombra" class="absolute inset-0 w-full h-full object-cover" alt="" />
        <div class="absolute inset-0" style="background:rgba(0,18,8,.80);"></div>
        <div class="absolute bottom-0 left-0 w-full leading-none z-10 translate-y-[1px]">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" class="relative block w-full h-[120px] md:h-[320px] z-10">
            <path fill="#ffffff" d="M0,120 C450,450 900,-250 1440,180 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </div>

      <div class="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="text-left">
          <div class="hero-badge">Directorio de Negocios PYME</div>
          <h1 class="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] font-outfit uppercase tracking-tighter">
            Descubre<br/>
            <span class="text-fiery-red">Negocios cerca</span>
          </h1>
          <p class="text-cream-muted text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
            Encuentra los mejores negocios, servicios y productos cerca de ti. Apoya a los emprendedores y descubre lo que tu ciudad tiene para ofrecer.
          </p>
        </div>
        <div class="hidden lg:flex justify-end absolute right-0 bottom-[-220px] z-50 pointer-events-none w-[45%]">
          <img src="../assets/images/emprendedor.png" class="w-full max-w-[500px] h-auto animate-float drop-shadow-2xl" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" />
        </div>
      </div>
    </section>

    <!-- ═══ SEARCH BAR + CTA ═══ -->
    <section class="relative z-40 -mt-16 md:-mt-24 container mx-auto px-4 md:px-6">
      <div class="flex flex-col md:flex-row items-start gap-4 max-w-5xl">

        <!-- Search box -->
        <div class="flex-1 w-full">
          <!-- Tabs -->
          <div class="absolute -top-5 left-6 flex search-tabs p-1.5 rounded-full shadow-lg z-20">
            <button
              @click="searchCategory = 'Negocio'"
              :class="[searchCategory === 'Negocio' ? 'tab-active' : 'tab-inactive', 'px-5 py-1.5 rounded-full text-xs font-bold transition-all']"
            >Negocio</button>
            <button
              @click="searchCategory = 'Ubicación'"
              :class="[searchCategory === 'Ubicación' ? 'tab-active' : 'tab-inactive', 'px-5 py-1.5 rounded-full text-xs font-bold transition-all']"
            >Ubicación</button>
          </div>

          <div class="bg-white rounded-[2.5rem] shadow-2xl p-4 md:p-5 pt-10 md:pt-6 flex flex-col md:flex-row items-stretch gap-4 border border-slate-50">
            <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4">

              <!-- ¿Qué buscas? -->
              <div class="cat-dropdown-wrap relative flex flex-col">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">¿Qué buscas?</span>
                <input
                  v-model="searchKeyword"
                  @focus="showCategoryDropdown = true"
                  @keyup.enter="triggerSearch"
                  type="text"
                  placeholder="Restaurantes, Tiendas..."
                  class="w-full bg-transparent border-none outline-none text-slate-800 font-bold p-0 text-base"
                  autocomplete="off"
                />
                <div
                  v-if="showCategoryDropdown && categories.length"
                  class="cat-scroll absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50"
                  @wheel.stop
                  @touchmove.stop
                >
                  <button
                    v-for="cat in categories" :key="cat"
                    @click="selectCategory(cat)"
                    class="w-full text-left px-5 py-3 text-sm font-semibold text-slate-700 dropdown-item transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >{{ cat }}</button>
                </div>
              </div>

              <!-- ¿En dónde? -->
              <div class="dep-dropdown-wrap relative flex flex-col md:border-l md:border-slate-100 md:pl-6">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">¿En dónde?</span>
                <input
                  v-model="searchLocation"
                  @focus="showDepartmentDropdown = true"
                  @keyup.enter="triggerSearch"
                  type="text"
                  placeholder="Ej. Chiquimula, Guatemala..."
                  class="w-full bg-transparent border-none outline-none text-slate-800 font-bold p-0 text-base"
                  autocomplete="off"
                />
                <div
                  v-if="showDepartmentDropdown"
                  class="dep-scroll absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50"
                  @wheel.stop
                  @touchmove.stop
                >
                  <button
                    v-for="dep in departments" :key="dep"
                    @click="selectDepartment(dep)"
                    class="w-full text-left px-5 py-3 text-sm font-semibold text-slate-700 dropdown-item transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >{{ dep }}</button>
                </div>
              </div>

            </div>

            <button
              @click="triggerSearch"
              class="btn-search w-full md:w-auto px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 self-center"
            >Buscar</button>
          </div>
        </div>

        <!-- CTA -->
        <button
          @click="$router.push('/register')"
          class="cta-negocio w-full md:w-auto px-7 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap mt-0 md:mt-6"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
          ¿Tienes un negocio?
        </button>

      </div>
    </section>

    <!-- ═══ NEGOCIOS DESTACADOS ═══ -->
    <section class="py-28 bg-white overflow-hidden">
      <div class="container mx-auto px-6 max-w-6xl">
        <div
          class="flex flex-col md:flex-row justify-between items-center mb-16 reveal-on-scroll transition-all duration-1000"
          :class="revealedElements.has('reveal-0') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'"
        >
          <div class="text-center md:text-left mb-8 md:mb-0">
            <h4 class="eyebrow-red font-black uppercase tracking-[0.3em] text-xs mb-3">Recomendados</h4>
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

        <div
          class="relative h-[550px] flex justify-center items-center overflow-hidden reveal-on-scroll transition-all duration-1000 delay-300"
          :class="revealedElements.has('reveal-1') ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'"
          style="perspective: 2000px;"
        >
          <div
            v-for="(b, i) in featuredBusinesses" :key="b.id"
            class="absolute w-full max-w-[340px] md:max-w-[400px] transition-all duration-700 ease-out"
            :style="getCarouselStyle(i)"
          >
            <BusinessCard :business="b" />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ CÓMO FUNCIONA ═══ -->
    <section class="py-32 bg-white relative overflow-hidden">
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-0 right-0 w-[40%] h-[40%] how-deco-1 rounded-full blur-[120px] opacity-40"></div>
        <div class="absolute bottom-0 left-0 w-[40%] h-[40%] bg-fiery-red/5 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-28 reveal-on-scroll transition-all duration-1000" :class="revealedElements.has('reveal-2') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
          <h4 class="text-fiery-red font-black uppercase tracking-[0.4em] text-xs mb-4">Experiencia AquiTenes</h4>
          <h2 class="text-5xl md:text-7xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">¿Cómo <span class="text-fiery-red">funciona</span>?</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-24 lg:gap-32 max-w-6xl mx-auto">
          <div class="relative reveal-on-scroll transition-all duration-1000 delay-100 group" :class="revealedElements.has('reveal-3') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <div class="absolute -inset-8 how-glow-navy rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="absolute -top-16 -left-8 text-[12rem] font-black how-num-bg leading-none z-0 pointer-events-none select-none transition-colors duration-500">1</div>
            <div class="relative z-10">
              <div class="mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 border-4 border-white">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop" class="w-full h-72 object-cover" alt="Busca">
              </div>
              <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase tracking-tighter group-hover:text-fiery-red transition-colors">Encuentra</h3>
              <p class="text-slate-500 font-medium leading-relaxed text-lg">Localiza los mejores locales por nombre o categoría en toda Guatemala con un solo clic.</p>
            </div>
          </div>

          <div class="relative reveal-on-scroll transition-all duration-1000 delay-300 group" :class="revealedElements.has('reveal-4') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <div class="absolute -inset-8 bg-fiery-red/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="absolute -top-16 -left-8 text-[12rem] font-black how-num-bg leading-none z-0 pointer-events-none select-none transition-colors duration-500">2</div>
            <div class="relative z-10">
              <div class="mb-8 rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-500 border-4 border-white">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" class="w-full h-72 object-cover" alt="Compara">
              </div>
              <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase tracking-tighter group-hover:text-fiery-red transition-colors">Analiza</h3>
              <p class="text-slate-500 font-medium leading-relaxed text-lg">Revisa reseñas, fotos y servicios detallados para asegurarte de recibir la mejor calidad.</p>
            </div>
          </div>

          <div class="relative reveal-on-scroll transition-all duration-1000 delay-500 group" :class="revealedElements.has('reveal-5') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
            <div class="absolute -inset-8 how-glow-blue rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div class="absolute -top-16 -left-8 text-[12rem] font-black how-num-bg leading-none z-0 pointer-events-none select-none transition-colors duration-500">3</div>
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

    <!-- ═══ FOOTER BAND ═══ -->
    <section class="py-16 relative overflow-hidden footer-band">
      <div class="absolute inset-0 footer-band-overlay"></div>
    </section>

  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
.animate-float { animation: float 6s ease-in-out infinite; }
.reveal-on-scroll { will-change: transform, opacity; }

/* ── PALETA DEL PROYECTO ───────────────────────── */
/* Navy: #003049 | Rojo: #C1121F | Crema: #FDF0D5 | Celeste: #669BBC | DarkRed: #780000 */

/* Hero */
.hero-bg-color { background-color: #003049; }
.hero-badge {
  display: inline-block;
  padding: .4rem 1rem;
  background: rgba(193,18,31,.18);
  border: 1px solid rgba(193,18,31,.35);
  border-radius: 999px;
  color: #FDF0D5;
  font-size: .65rem; font-weight: 900;
  text-transform: uppercase; letter-spacing: .2em;
  margin-bottom: 1.5rem;
}
.text-cream-muted { color: rgba(253,240,213,.75); }

/* Ola con alfombra — mismo estilo que how-section del Blog */
.wave-img-wrap {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  pointer-events: none;
}
.wave-alfombra {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center;
}
.wave-overlay { display: none; }

/* Tabs del buscador */
.search-tabs { background: #C1121F; }
.tab-active  { background: #780000; color: #FDF0D5; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
.tab-inactive { color: rgba(253,240,213,.65); }

/* Botón buscar */
.btn-search {
  background: #C1121F;
  color: #fff;
  box-shadow: 0 4px 16px rgba(193,18,31,.3);
}
.btn-search:hover { background: #780000; }

/* Dropdown items */
.dropdown-item:hover { background: #FDF0D5; color: #C1121F; }

/* CTA negocio */
.cta-negocio {
  background: #003049;
  color: #FDF0D5;
  box-shadow: 0 4px 20px rgba(0,48,73,.3);
}
.cta-negocio:hover { background: #669BBC; color: #fff; }

/* Eyebrow destacados — crema */
.eyebrow-red { color: #FDF0D5; }

/* Cómo funciona — decoraciones */
.how-deco-1    { background: rgba(102,155,188,.15); }
.how-glow-navy { background: rgba(0,48,73,.15); }
.how-glow-blue { background: rgba(102,155,188,.15); }
.how-num-bg    { color: #f1f5f9; }

/* Footer band */
.footer-band         { background: #003049; }
.footer-band-overlay { background: rgba(193,18,31,.12); }

/* Dropdown scroll */
.cat-scroll, .dep-scroll {
  max-height: 15rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.cat-scroll::-webkit-scrollbar,
.dep-scroll::-webkit-scrollbar { width: 4px; }
.cat-scroll::-webkit-scrollbar-thumb,
.dep-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }

/* CTA responsive */
@media (max-width: 767px) {
  .cta-negocio { margin-top: 0.5rem; border-radius: 1.5rem; }
}
</style>