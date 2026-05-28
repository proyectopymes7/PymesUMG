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

// Touch/swipe support
const touchStartX = ref(0)
const touchEndX = ref(0)

const handleTouchStart = (e) => {
  touchStartX.value = e.changedTouches[0].screenX
}
const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].screenX
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextCard()
    else prevCard()
  }
}

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
        <div class="hidden lg:flex justify-end absolute right-0 bottom-[-230px] z-50 pointer-events-none w-[50%]">
          <img src="../assets/images/emprendedores_gt.png" class="w-full max-w-[700px] h-auto animate-float drop-shadow-2xl" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" />
        </div>
      </div>
    </section>

    <!-- ═══ SEARCH BAR ═══ -->
    <section class="relative z-40 -mt-16 md:-mt-24 container mx-auto px-4 md:px-6">
      <div class="flex flex-col md:flex-row items-start gap-4 max-w-5xl">
        <div class="flex-1 w-full">
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
                  @wheel.stop @touchmove.stop
                >
                  <button
                    v-for="cat in categories" :key="cat"
                    @click="selectCategory(cat)"
                    class="w-full text-left px-5 py-3 text-sm font-semibold text-slate-700 dropdown-item transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >{{ cat }}</button>
                </div>
              </div>

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
                  @wheel.stop @touchmove.stop
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
      </div>
    </section>

    <!-- ═══ NEGOCIOS DESTACADOS ═══ -->
    <section class="py-28 bg-white overflow-hidden">
      <div class="container mx-auto px-6 max-w-6xl">

        <div
          class="text-center mb-16 reveal-on-scroll transition-all duration-1000"
          :class="revealedElements.has('reveal-0') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'"
        >
          <h4 class="eyebrow-blue font-black uppercase tracking-[0.3em] text-xs mb-3">Recomendados</h4>
          <h2 class="text-4xl md:text-5xl font-black text-fiery-navy font-outfit uppercase tracking-tighter leading-none">
            Negocios <span class="text-fiery-red">Destacados</span>
          </h2>
        </div>

        <div
          class="reveal-on-scroll transition-all duration-1000 delay-300 relative"
          :class="revealedElements.has('reveal-1') ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'"
        >
          <!-- Flecha izquierda -->
          <button @click="prevCard" aria-label="Anterior" class="carousel-arrow carousel-arrow-left">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Flecha derecha -->
          <button @click="nextCard" aria-label="Siguiente" class="carousel-arrow carousel-arrow-right">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <!-- Cards — swipe habilitado con touch-action: pan-y y .passive -->
          <div
            class="relative h-[550px] flex justify-center items-center overflow-hidden"
            style="perspective: 2000px; touch-action: pan-y;"
            @touchstart.passive="handleTouchStart"
            @touchend.passive="handleTouchEnd"
          >
            <div
              v-for="(b, i) in featuredBusinesses" :key="b.id"
              class="absolute w-full max-w-[340px] md:max-w-[400px] transition-all duration-700 ease-out"
              :style="getCarouselStyle(i)"
            >
              <BusinessCard :business="b" />
            </div>
          </div>

          <!-- Dots -->
          <div class="flex justify-center gap-2 mt-6">
            <button
              v-for="(b, i) in featuredBusinesses" :key="`dot-${i}`"
              @click="currentCarouselIndex = i"
              class="carousel-dot transition-all duration-300"
              :class="i === currentCarouselIndex ? 'carousel-dot-active' : 'carousel-dot-inactive'"
              :aria-label="`Ir a negocio ${i + 1}`"
            />
          </div>
        </div>

      </div>
    </section>

    <!-- ═══ EL DIRECTORIO DIGITAL ═══ -->
    <section class="dir-section">
      <div class="dir-bg-wrap" aria-hidden="true">
        <img
          src="@/assets/Volcan.webp"
          class="dir-bg-img"
          alt="Lago de Atitlán, Guatemala"
        />
        <div class="dir-overlay"></div>
        <div class="dir-glow-red" aria-hidden="true"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10 text-center max-w-3xl reveal-on-scroll transition-all duration-1000" :class="revealedElements.has('reveal-2') ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'">
        <div class="dir-badge">¿Tienes un negocio?</div>
        <h2 class="dir-heading">
          Ponlo en el mapa<br>
          <span class="dir-heading-accent">de Guatemala</span>
        </h2>
        <p class="dir-sub">
          Miles de clientes buscan negocios como el tuyo todos los días.<br class="hidden md:block">
          Regístralo gratis y empieza a recibir visitas hoy mismo.
        </p>
        <button @click="$router.push('/registrar-negocio')" class="dir-cta-btn">
          <span class="dir-cta-shine" aria-hidden="true"></span>
          Registrar mi negocio gratis
        </button>
      </div>
    </section>

    <!-- ═══ CÓMO FUNCIONA ═══ -->
    <section class="py-32 bg-white relative overflow-hidden">
      <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-0 right-0 w-[40%] h-[40%] how-deco-1 rounded-full blur-[120px] opacity-40"></div>
        <div class="absolute bottom-0 left-0 w-[40%] h-[40%] bg-fiery-red/5 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center mb-28 reveal-on-scroll transition-all duration-1000" :class="revealedElements.has('reveal-3') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
          <h4 class="text-fiery-red font-black uppercase tracking-[0.4em] text-xs mb-4">Experiencia AquíTenes</h4>
          <h2 class="text-5xl md:text-7xl font-black text-fiery-navy font-outfit uppercase tracking-tighter">¿Cómo <span class="text-fiery-red">funciona</span>?</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-24 lg:gap-32 max-w-6xl mx-auto">
          <div class="relative reveal-on-scroll transition-all duration-1000 delay-100 group" :class="revealedElements.has('reveal-4') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
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

          <div class="relative reveal-on-scroll transition-all duration-1000 delay-300 group" :class="revealedElements.has('reveal-5') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
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

          <div class="relative reveal-on-scroll transition-all duration-1000 delay-500 group" :class="revealedElements.has('reveal-6') ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'">
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

    <!-- ═══ FOOTER ═══ -->
    <footer class="site-footer">
      <div class="site-footer-top"></div>
      <div class="container mx-auto px-6 max-w-6xl">

        <div class="site-footer-grid">
          <div>
            <div class="site-footer-logo">AquíTenes</div>
            <p class="site-footer-tagline">El directorio digital de Guatemala</p>
            <div class="site-footer-socials">
              <a href="#" class="site-footer-social-btn" aria-label="WhatsApp">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="#" class="site-footer-social-btn" aria-label="Facebook">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" class="site-footer-social-btn" aria-label="Instagram">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <p class="site-footer-col-title">Explorar</p>
            <ul class="site-footer-links">
              <li><router-link to="/directorio">Directorio</router-link></li>
              <li><router-link to="/blog">Sobre nosotros</router-link></li>
              <li><router-link to="/register">Registrar negocio</router-link></li>
            </ul>
          </div>

          <div>
            <p class="site-footer-col-title">Mi cuenta</p>
            <ul class="site-footer-links">
              <li><router-link to="/login">Iniciar sesión</router-link></li>
              <li><router-link to="/register">Crear cuenta</router-link></li>
            </ul>
          </div>
        </div>

        <div class="site-footer-bottom">
          <p class="site-footer-copy">© {{ new Date().getFullYear() }} AquíTenes · Hecho con <span style="color:#C1121F;">♥</span> en Guatemala</p>
          <p class="site-footer-copy site-footer-umg">Proyecto académico · Universidad Mariano Gálvez de Guatemala</p>
        </div>

      </div>
    </footer>

  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
.animate-float { animation: float 6s ease-in-out infinite; }
.reveal-on-scroll { will-change: transform, opacity; }

/* Hero */
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

/* Buscador */
.search-tabs { background: #C1121F; }
.tab-active  { background: #780000; color: #FDF0D5; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
.tab-inactive { color: rgba(253,240,213,.65); }
.btn-search { background: #C1121F; color: #fff; box-shadow: 0 4px 16px rgba(193,18,31,.3); }
.btn-search:hover { background: #780000; }
.dropdown-item:hover { background: #FDF0D5; color: #C1121F; }

/* Eyebrow */
.eyebrow-red  { color: #FDF0D5; }
.eyebrow-blue { color: #669BBC; }

/* ── FLECHAS DEL CARRUSEL ─────────────────────── */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
@media (min-width: 768px) {
  .carousel-arrow { width: 3.5rem; height: 3.5rem; border-radius: 1.25rem; }
}
.carousel-arrow-left {
  left: 0.5rem;
  background: rgba(255,255,255,0.95);
  color: #003049;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
}
.carousel-arrow-left:hover {
  background: #C1121F; color: #fff; border-color: #C1121F;
  box-shadow: 0 4px 20px rgba(193,18,31,.35);
  transform: translateY(-50%) scale(1.05);
}
.carousel-arrow-right {
  right: 0.5rem;
  background: #C1121F; color: #fff;
  box-shadow: 0 4px 20px rgba(193,18,31,.4);
}
.carousel-arrow-right:hover {
  background: #780000;
  box-shadow: 0 6px 28px rgba(193,18,31,.55);
  transform: translateY(-50%) scale(1.05);
}
@media (min-width: 768px) {
  .carousel-arrow-left  { left: 1rem; }
  .carousel-arrow-right { right: 1rem; }
}

/* ── DOTS ─────────────────────────────────────── */
.carousel-dot { border: none; cursor: pointer; height: 0.5rem; border-radius: 999px; padding: 0; }
.carousel-dot-active   { background: #C1121F; width: 1.5rem; }
.carousel-dot-inactive { background: #cbd5e1; width: 0.5rem; }
.carousel-dot-inactive:hover { background: #94a3b8; }

/* Cómo funciona */
.how-deco-1    { background: rgba(102,155,188,.15); }
.how-glow-navy { background: rgba(0,48,73,.15); }
.how-glow-blue { background: rgba(102,155,188,.15); }
.how-num-bg    { color: #f1f5f9; }

/* Dropdowns */
.cat-scroll, .dep-scroll {
  max-height: 15rem; overflow-y: auto; overscroll-behavior: contain;
}
.cat-scroll::-webkit-scrollbar,
.dep-scroll::-webkit-scrollbar { width: 4px; }
.cat-scroll::-webkit-scrollbar-thumb,
.dep-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }

/* ── DIRECTORIO DIGITAL ───────────────────────── */
.dir-section {
  padding: 9rem 0 8rem; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center; min-height: 600px;
}
.dir-bg-wrap { position: absolute; inset: 0; overflow: hidden; z-index: 0; }
.dir-bg-img {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center 55%; transform: scale(1.04);
}
.dir-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(0,10,5,.88) 0%, rgba(0,30,20,.82) 50%, rgba(0,10,5,.90) 100%);
}
.dir-glow-red {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 60% 35%, rgba(193,18,31,.18) 0%, transparent 65%);
}
.dir-badge {
  display: inline-block; padding: .5rem 1.25rem; border-radius: 999px;
  background: rgba(193,18,31,.18); border: 1px solid rgba(193,18,31,.35);
  color: #ff8080; font-size: .65rem; font-weight: 900;
  text-transform: uppercase; letter-spacing: .22em; margin-bottom: 1.75rem;
}
.dir-heading {
  font-size: clamp(2.4rem, 6vw, 4.5rem); font-weight: 900; color: #fff;
  text-transform: uppercase; letter-spacing: -.04em; line-height: 1;
  font-family: 'Outfit', sans-serif; text-shadow: 0 4px 24px rgba(0,0,0,.6); margin-bottom: 1.5rem;
}
.dir-heading-accent {
  color: #C1121F;
  text-shadow: 0 0 40px rgba(193,18,31,.5), 0 4px 24px rgba(0,0,0,.6);
}
.dir-sub {
  color: rgba(255,255,255,.62); font-size: 1.05rem;
  line-height: 1.75; font-weight: 400; margin-bottom: 3rem;
}
.dir-cta-btn {
  position: relative; overflow: hidden; display: inline-flex;
  align-items: center; gap: .75rem; padding: 1.1rem 2.25rem;
  border-radius: 999px; border: none; cursor: pointer;
  background: linear-gradient(135deg, #C1121F 0%, #780000 100%);
  color: #fff; font-size: .9rem; font-weight: 900;
  text-transform: uppercase; letter-spacing: .12em;
  font-family: 'Outfit', sans-serif;
  box-shadow: 0 0 0 1px rgba(193,18,31,.4), 0 8px 32px rgba(193,18,31,.45), 0 20px 60px rgba(0,0,0,.35);
  transition: transform .3s cubic-bezier(0.22,1,0.36,1), box-shadow .3s ease;
}
.dir-cta-btn:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 0 0 1px rgba(193,18,31,.5), 0 16px 48px rgba(193,18,31,.6), 0 28px 80px rgba(0,0,0,.4);
}
.dir-cta-btn:active { transform: translateY(-1px) scale(1); }
.dir-cta-shine {
  position: absolute; top: 0; left: -80%; width: 55%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
  transform: skewX(-18deg); transition: left .55s ease; pointer-events: none;
}
.dir-cta-btn:hover .dir-cta-shine { left: 130%; }

/* ── FOOTER ───────────────────────────────────── */
.site-footer { background: #001e2e; padding-top: 0; position: relative; }
.site-footer-top { height: 4px; background: linear-gradient(90deg, #C1121F 0%, #780000 50%, #C1121F 100%); }
.site-footer-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; padding: 3.5rem 0 2.5rem; }
@media (min-width: 768px) { .site-footer-grid { grid-template-columns: 2fr 1fr 1fr; gap: 4rem; } }
.site-footer-logo { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.03em; margin-bottom: .5rem; }
.site-footer-tagline { color: rgba(253,240,213,.45); font-size: .75rem; font-weight: 500; margin-bottom: 1.25rem; }
.site-footer-socials { display: flex; gap: .5rem; }
.site-footer-social-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: .5rem;
  background: rgba(255,255,255,.07); color: rgba(255,255,255,.55);
  transition: background .2s ease, color .2s ease;
}
.site-footer-social-btn:hover { background: #C1121F; color: #fff; }
.site-footer-col-title { color: rgba(253,240,213,.35); font-size: .6rem; font-weight: 900; text-transform: uppercase; letter-spacing: .2em; margin-bottom: 1rem; }
.site-footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .6rem; }
.site-footer-links a { color: rgba(255,255,255,.55); font-size: .85rem; font-weight: 500; text-decoration: none; transition: color .2s ease; }
.site-footer-links a:hover { color: #C1121F; }
.site-footer-bottom { border-top: 1px solid rgba(255,255,255,.07); padding: 1.5rem 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
.site-footer-copy { color: rgba(255,255,255,.28); font-size: .72rem; font-weight: 500; }
.site-footer-umg { text-align: right; }
@media (max-width: 639px) { .site-footer-umg { text-align: left; } }
</style>