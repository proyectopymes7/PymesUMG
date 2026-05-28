<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import { getBusinessById, getBusinessProducts, getBusinessReviews, createReview } from '../services/businessService'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const business = ref(null)
const products = ref([])
const services = ref([])
const reviews = ref([])
const showMapModal = ref(false)
const showReviewModal = ref(false)
const reviewForm = ref({ calificacion: 0, comentario: '', hoveredStar: 0 })
const submittingReview = ref(false)
const reviewError = ref('')
const reviewSuccess = ref(false)

const mapUrl = computed(() => {
  if (!business.value) return ''
  if (business.value.lat && business.value.lng) {
    return `https://maps.google.com/maps?q=${business.value.lat},${business.value.lng}&z=16&output=embed`
  }
  const query = encodeURIComponent(business.value.location || business.value.name)
  return `https://maps.google.com/maps?q=${query}&output=embed`
})

const mapsLink = computed(() => {
  if (!business.value) return 'https://maps.google.com'
  if (business.value.lat && business.value.lng)
    return `https://www.google.com/maps?q=${business.value.lat},${business.value.lng}`
  return `https://www.google.com/maps/search/${encodeURIComponent(business.value.location || business.value.name)}`
})

const formatPrice = (item) => {
  if (item.visibilidad_precio === 'OCULTO') return 'Consultar'
  if (!item.precio) return ''
  const num = Number(item.precio)
  const prefix = item.visibilidad_precio === 'APROXIMADO' ? '~' : ''
  return `${prefix}Q${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`
}

const hasItems = computed(() => products.value.length > 0 || services.value.length > 0)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return dateStr }
}

onMounted(async () => {
  try {
    business.value = await getBusinessById(route.params.id)
  } catch (error) {
    console.error('Error fetching business details:', error)
  }

  try {
    const all = await getBusinessProducts(route.params.id)
    products.value = all.filter(p => p.tipo !== 'servicio')
    services.value = all.filter(p => p.tipo === 'servicio')
  } catch (error) {
    console.error('Error fetching products:', error)
  }

  try {
    reviews.value = await getBusinessReviews(route.params.id)
  } catch (error) {
    console.error('Error fetching reviews:', error)
  }
})

const goBack = () => router.back()

const openReviewModal = () => {
  reviewForm.value = { calificacion: 0, comentario: '', hoveredStar: 0 }
  reviewError.value = ''
  reviewSuccess.value = false
  showReviewModal.value = true
}

const closeReviewModal = () => { showReviewModal.value = false }

const submitReview = async () => {
  if (!authStore.isAuthenticated) {
    reviewError.value = 'Debes iniciar sesión para publicar una reseña'
    return
  }
  if (reviewForm.value.calificacion === 0) {
    reviewError.value = 'Debes seleccionar una calificación'
    return
  }
  if (!reviewForm.value.comentario.trim()) {
    reviewError.value = 'Debes escribir un comentario'
    return
  }
  submittingReview.value = true
  reviewError.value = ''
  try {
    await createReview({
      id_emprendimiento: business.value.id,
      comentario: reviewForm.value.comentario,
      calificacion: reviewForm.value.calificacion
    })
    reviews.value.unshift({
      id_calificacion: Date.now(),
      usuario_nombre:  authStore.user?.nombre,
      usuario_apellido: authStore.user?.apellido,
      puntuacion:      reviewForm.value.calificacion,
      comentario:      reviewForm.value.comentario,
      fecha_calificacion: new Date().toISOString()
    })
    reviewSuccess.value = true
    setTimeout(() => closeReviewModal(), 2000)
  } catch (error) {
    reviewError.value = error.response?.data?.message || 'Error al publicar la reseña. Intenta de nuevo.'
  } finally {
    submittingReview.value = false
  }
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

        <div class="flex flex-col-reverse md:flex-row gap-8 md:gap-10 items-center md:items-start relative z-10">

          <!-- Logo & Rating Section -->
          <div class="w-full md:w-auto flex flex-col items-center gap-4 md:gap-6">
            <div class="w-32 h-32 md:w-52 md:h-52 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white shadow-lg border border-slate-100 p-2">
              <img :src="business.logo" :alt="business.name" class="w-full h-full object-cover rounded-[1.8rem]" />
            </div>
            <div class="bg-fiery-navy rounded-[2rem] p-4 md:p-6 text-center text-white w-full max-w-[200px] md:max-w-none">
              <div class="text-2xl md:text-4xl font-black mb-1">{{ business.rating }}</div>
              <div class="flex justify-center text-yellow-400 mb-1 md:mb-2">
                <svg v-for="i in 5" :key="i" class="w-4 h-4 md:w-5 md:h-5" :class="i <= Math.floor(business.rating) ? 'fill-current' : 'text-white/20'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              </div>
              <div class="text-[10px] md:text-xs font-bold text-fiery-cream/60 uppercase tracking-widest">{{ business.reviewCount }} reseñas</div>
            </div>
          </div>

          <!-- Info Section -->
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
        <div v-if="hasItems" class="lg:col-span-2 space-y-12 md:space-y-16">

          <!-- Products -->
          <div v-if="products.length > 0" class="space-y-6 md:space-y-8">
            <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Productos
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              <div v-for="product in products" :key="product.id_producto" class="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
                <div class="h-48 md:h-64 overflow-hidden bg-slate-100">
                  <img
                    v-if="product.imagen_url"
                    :src="product.imagen_url"
                    :alt="product.nombre"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
                    <svg class="w-14 h-14 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  </div>
                </div>
                <div class="p-6 md:p-8">
                  <div class="flex justify-between items-center mb-2 gap-2">
                    <h3 class="text-xl md:text-2xl font-bold text-fiery-navy leading-tight">{{ product.nombre }}</h3>
                    <span class="text-xl md:text-2xl font-black text-fiery-red whitespace-nowrap">{{ formatPrice(product) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div v-if="services.length > 0" class="space-y-6 md:space-y-8">
            <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4">
              Servicios
              <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              <div v-for="service in services" :key="service.id_producto" class="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
                <div class="h-48 md:h-64 overflow-hidden bg-slate-100">
                  <img
                    v-if="service.imagen_url"
                    :src="service.imagen_url"
                    :alt="service.nombre"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 gap-3">
                    <div class="w-14 h-14 bg-fiery-navy/10 rounded-2xl flex items-center justify-center">
                      <svg class="w-8 h-8 text-fiery-navy/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                </div>
                <div class="p-6 md:p-8">
                  <div class="flex justify-between items-center gap-2">
                    <h3 class="text-xl md:text-2xl font-bold text-fiery-navy leading-tight">{{ service.nombre }}</h3>
                    <span class="text-xl md:text-2xl font-black text-fiery-red whitespace-nowrap">{{ formatPrice(service) }}</span>
                  </div>
                  <p v-if="service.descripcion" class="text-slate-500 text-sm mt-2 line-clamp-2">{{ service.descripcion }}</p>
                </div>
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
            <div class="mb-8 md:mb-10">
              <p v-if="business.horario" class="text-fiery-cream/90 text-sm leading-relaxed font-bold bg-white/10 px-4 py-3 rounded-xl">
                {{ business.horario }}
              </p>
              <p v-else class="text-fiery-cream/70 text-sm font-bold bg-white/10 px-4 py-3 rounded-xl">
                No especificado
              </p>
            </div>

            <div class="space-y-5 pt-6 md:pt-8 border-t border-white/10">
              <h3 class="text-lg md:text-xl font-black font-outfit flex items-center gap-3">
                <svg class="w-5 h-5 md:w-6 md:h-6 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Ubicación
              </h3>

              <!-- Mapa con botón Ampliar -->
              <div class="relative w-full rounded-[1.5rem] overflow-hidden border-2 border-white/10" style="height:180px">
                <iframe v-if="mapUrl" :src="mapUrl" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                <button
                  @click="showMapModal = true"
                  class="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-fiery-navy text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md hover:bg-fiery-red hover:text-white transition-all uppercase tracking-widest"
                >
                  Ampliar
                </button>
              </div>

              <p class="text-fiery-cream/80 font-medium text-[11px] md:text-xs text-center md:text-left">{{ business.location }}</p>

              <a :href="mapsLink" target="_blank" class="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-fiery-navy rounded-xl md:rounded-2xl font-black text-sm hover:bg-fiery-red hover:text-white transition-all shadow-md">
                Abrir Maps
              </a>
            </div>
          </div>
        </div>

        <!-- Reviews: full-width con productos, o col-span-2 sin ellos -->
        <div :class="hasItems ? 'lg:col-span-3 pt-8 md:pt-12' : 'lg:col-span-2 pt-0'">
          <div class="space-y-8">

            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit flex items-center gap-4 w-full">
                Reseñas
                <div class="h-1 flex-1 bg-fiery-cream rounded-full"></div>
              </h2>
              <button
                @click="openReviewModal"
                class="w-full md:w-auto bg-fiery-red text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-fiery-darkred transition-all shadow-lg shadow-fiery-red/20"
              >
                Escribir reseña
              </button>
            </div>

            <div v-if="reviews.length === 0" class="bg-white rounded-[2rem] p-10 text-center border border-slate-100">
              <p class="text-slate-400 font-bold text-base">Aún no hay reseñas para este negocio.</p>
              <p class="text-slate-300 text-sm mt-1">¡Sé el primero en escribir una!</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="review in reviews" :key="review.id_calificacion" class="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-4 md:mb-6">
                  <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-fiery-navy text-white flex items-center justify-center font-black text-lg md:text-xl uppercase flex-shrink-0">
                      {{ (review.usuario_nombre || '?').charAt(0) }}
                    </div>
                    <div>
                      <h4 class="font-black text-fiery-navy text-base md:text-lg">{{ [review.usuario_nombre, review.usuario_apellido].filter(Boolean).join(' ') || 'Usuario' }}</h4>
                      <p class="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">{{ formatDate(review.fecha_calificacion) }}</p>
                    </div>
                  </div>
                  <div class="flex text-yellow-400 flex-shrink-0">
                    <svg v-for="i in 5" :key="i" class="w-4 h-4 md:w-5 md:h-5" :class="i <= review.puntuacion ? 'fill-current' : 'text-slate-200'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  </div>
                </div>
                <p class="text-slate-600 text-base md:text-lg italic">"{{ review.comentario }}"</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- ── Modal Mapa Fullscreen ── -->
    <transition name="modal-fade">
      <div
        v-if="showMapModal"
        class="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4"
        @click.self="showMapModal = false"
      >
        <div class="bg-white rounded-3xl overflow-hidden w-full max-w-5xl flex flex-col shadow-2xl" style="height:85vh">
          <div class="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
            <div>
              <h3 class="font-black text-fiery-navy text-lg">{{ business.name }}</h3>
              <p class="text-slate-400 text-xs font-medium">{{ business.location }}</p>
            </div>
            <div class="flex items-center gap-3">
              <a :href="mapsLink" target="_blank" class="px-4 py-2 bg-fiery-red text-white rounded-xl font-black text-xs hover:bg-fiery-darkred transition-all">Abrir Maps</a>
              <button @click="showMapModal = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-lg transition-colors leading-none">&times;</button>
            </div>
          </div>
          <iframe :src="mapUrl" width="100%" style="flex:1;border:0;" allowfullscreen="" loading="lazy"></iframe>
        </div>
      </div>
    </transition>

    <!-- ── Modal Escribir Reseña ── -->
    <transition name="modal-fade">
      <div
        v-if="showReviewModal"
        class="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center pt-[80px] px-4 pb-4"
        @click.self="closeReviewModal"
      >
        <div class="bg-white rounded-3xl w-full max-w-lg max-h-[calc(100vh-96px)] overflow-y-auto shadow-2xl flex flex-col">

          <div class="sticky top-0 bg-white z-10 flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl">
            <h3 class="text-lg font-black text-fiery-navy uppercase tracking-tighter">Escribir Reseña</h3>
            <button @click="closeReviewModal" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-lg transition-colors leading-none">&times;</button>
          </div>

          <div class="p-6 space-y-6 flex-1">

            <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-fiery-navy text-white flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                {{ authStore.userInitial }}
              </div>
              <div>
                <p class="font-black text-fiery-navy text-sm">{{ authStore.userFullName }}</p>
                <p class="text-slate-400 text-xs">Publicando como tú</p>
              </div>
            </div>

            <div v-else class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <span class="text-amber-500 text-lg">⚠</span>
              <p class="text-amber-700 text-sm font-bold">Necesitas iniciar sesión para publicar una reseña.</p>
            </div>

            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tu calificación</p>
              <div class="flex gap-2">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  @mouseover="reviewForm.hoveredStar = i"
                  @mouseleave="reviewForm.hoveredStar = 0"
                  @click="reviewForm.calificacion = i"
                  class="cursor-pointer hover:scale-110 transition-transform duration-150 focus:outline-none"
                >
                  <svg class="w-9 h-9 transition-colors duration-150" :class="i <= (reviewForm.hoveredStar || reviewForm.calificacion) ? 'text-yellow-400' : 'text-slate-200'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </button>
              </div>
              <p v-if="reviewForm.calificacion > 0" class="text-xs font-bold text-slate-400 mt-2">
                {{ ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][reviewForm.calificacion] }}
              </p>
            </div>

            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tu comentario</p>
              <textarea
                v-model="reviewForm.comentario"
                rows="4"
                placeholder="Escribe tu experiencia con este negocio..."
                class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fiery-red/20 focus:border-fiery-red transition-all resize-none"
              ></textarea>
            </div>

            <div v-if="reviewError" class="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span class="text-red-500 font-black text-sm">✕</span>
              <p class="text-red-600 text-sm font-bold">{{ reviewError }}</p>
            </div>

            <div v-if="reviewSuccess" class="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span class="text-emerald-500 font-black text-sm">✓</span>
              <p class="text-emerald-600 text-sm font-bold">¡Reseña publicada con éxito!</p>
            </div>

          </div>

          <div class="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end rounded-b-3xl">
            <button @click="closeReviewModal" class="w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
              Cancelar
            </button>
            <button
              @click="submitReview"
              :disabled="submittingReview || reviewForm.calificacion === 0 || !reviewForm.comentario.trim()"
              class="w-full sm:w-auto px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-fiery-red hover:bg-fiery-darkred text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="submittingReview" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ submittingReview ? 'Publicando...' : 'Publicar Reseña' }}
            </button>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
