<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const searchLocation = ref('')
const selectedCategory = ref('Todas')

onMounted(() => {
  if (route.query.q) searchKeyword.value = route.query.q
  if (route.query.loc) searchLocation.value = route.query.loc
})

const categories = ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio']

// Mock Data
const allBusinesses = ref([
  { id: 1, name: 'Café El Despertar', category: 'Restaurantes', rating: 4.8, description: 'El mejor café artesanal y repostería local para empezar tu día con energía.', location: 'Zona 1, Ciudad', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: 'Clínica Dental Sonrisas', category: 'Salud', rating: 4.9, description: 'Atención dental profesional con la última tecnología y un trato amigable.', location: 'Zona 10, Ciudad', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: 'Servicios de Plomería Express', category: 'Servicios', rating: 4.5, description: 'Soluciones rápidas y confiables para cualquier problema de plomería 24/7.', location: 'Zona 7, Ciudad', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80' },
  { id: 4, name: 'TechFix Reparaciones', category: 'Tecnología', rating: 4.7, description: 'Reparación de computadoras, celulares y tablets. Diagnóstico gratuito.', location: 'Zona 4, Ciudad', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80' },
  { id: 5, name: 'Spa Relajación Total', category: 'Belleza', rating: 4.6, description: 'Masajes, tratamientos faciales y corporales para tu bienestar integral.', location: 'Zona 14, Ciudad', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
  { id: 6, name: 'Boutique La Moda', category: 'Comercio', rating: 4.3, description: 'Ropa y accesorios de última tendencia para toda ocasión y estilo.', location: 'Zona 11, Ciudad', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80' },
  { id: 7, name: 'Burger Kinga', category: 'Restaurantes', rating: 4.2, description: 'Hamburguesas artesanales gigantes.', location: 'Zona 1, Ciudad', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { id: 8, name: 'Peluquería Estilos', category: 'Belleza', rating: 4.8, description: 'Cortes de cabello, tintes y peinados para eventos especiales.', location: 'Zona 5, Ciudad', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
])

const filteredBusinesses = computed(() => {
  return allBusinesses.value.filter(b => {
    const matchCategory = selectedCategory.value === 'Todas' || b.category === selectedCategory.value
    const matchKeyword = b.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) || b.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchLocation = b.location.toLowerCase().includes(searchLocation.value.toLowerCase())
    return matchCategory && matchKeyword && matchLocation
  })
})

const triggerSearch = () => {
  router.push({ query: { q: searchKeyword.value, loc: searchLocation.value } })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />
    
    <!-- Main Content -->
    <div class="container mx-auto px-6 pt-32 pb-12">
      <div class="flex flex-col lg:flex-row gap-8">
        
        <!-- Sidebar Filters -->
        <aside class="w-full lg:w-1/4">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 class="text-xl font-bold text-slate-800 mb-6">Filtros de Búsqueda</h2>
            
            <div class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">¿Qué buscas?</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <input v-model="searchKeyword" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Restaurantes..." class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all">
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">¿Dónde?</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </span>
                  <input v-model="searchLocation" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Zona 10..." class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all">
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-3">Categorías</label>
                <div class="space-y-2">
                  <label v-for="cat in categories" :key="cat" class="flex items-center gap-3 cursor-pointer group">
                    <div class="relative flex items-center justify-center w-5 h-5 rounded border-2 transition-colors" :class="selectedCategory === cat ? 'border-purple-600 bg-purple-600' : 'border-slate-300 group-hover:border-purple-400'">
                      <svg v-if="selectedCategory === cat" class="w-3 h-3 text-white absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                      <input type="radio" :value="cat" v-model="selectedCategory" class="opacity-0 absolute w-full h-full cursor-pointer" />
                    </div>
                    <span class="text-slate-600 font-medium group-hover:text-purple-600 transition-colors" :class="selectedCategory === cat ? 'text-purple-700 font-bold' : ''">{{ cat }}</span>
                  </label>
                </div>
              </div>
              
              <button @click="triggerSearch" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-purple-500/30 mt-4">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </aside>

        <!-- Results Grid -->
        <main class="w-full lg:w-3/4">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-slate-800">
              Mostrando <span class="text-purple-600">{{ filteredBusinesses.length }}</span> resultados
            </h2>
          </div>

          <div v-if="filteredBusinesses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <BusinessCard v-for="business in filteredBusinesses" :key="business.id" :business="business" />
          </div>
          
          <div v-else class="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">No se encontraron resultados</h3>
            <p class="text-slate-500">Intenta buscar con otras palabras o selecciona una categoría diferente.</p>
            <button @click="() => { searchKeyword = ''; searchLocation = ''; selectedCategory = 'Todas'; triggerSearch(); }" class="mt-6 text-purple-600 font-semibold hover:text-purple-700">Limpiar filtros</button>
          </div>
        </main>

      </div>
    </div>
  </div>
</template>
