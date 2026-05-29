<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'
import { getAllBusinesses, getCategories, getNearbyBusinesses, searchProducts, getProductImages } from '../services/businessService'

const route = useRoute()
const router = useRouter()

const isFilterOpen = ref(false)
const searchKeyword = ref('')
const selectedDept = ref('Todas')
const selectedMuni = ref('Todas')
const searchBarrio = ref('')
const selectedCategories = ref([])
const categoryDropdownOpen = ref(false)

const isDesktop = ref(window.innerWidth >= 1024)
const updateView = () => {
  isDesktop.value = window.innerWidth >= 1024
  if (isDesktop.value) isFilterOpen.value = true
}

const locationsData = {
  'Alta Verapaz': ['Chahal', 'Chisec', 'Cobán', 'Fray Bartolomé de las Casas', 'La Tinta', 'Lanquín', 'Panzós', 'Raxruhá', 'San Cristóbal Verapaz', 'San Juan Chamelco', 'San Pedro Carchá', 'Santa Cruz Verapaz', 'Santa María Cahabón', 'Senahú', 'Tamahú', 'Tactic', 'Tucurú'],
  'Baja Verapaz': ['Cubulco', 'Granados', 'Purulhá', 'Rabinal', 'Salamá', 'San Jerónimo', 'San Miguel Chicaj', 'Santa Cruz el Chol'],
  'Chimaltenango': ['Acatenango', 'Chimaltenango', 'El Tejar', 'Parramos', 'Patzicía', 'Patzún', 'Pochuta', 'San Andrés Itzapa', 'San José Poaquíl', 'San Juan Comalapa', 'San Martín Jilotepeque', 'Santa Apolonia', 'Santa Cruz Balanyá', 'Tecpán', 'Yepocapa', 'Zaragoza'],
  'Chiquimula': ['Camotán', 'Chiquimula', 'Concepción Las Minas', 'Esquipulas', 'Ipala', 'Jocotán', 'Olopa', 'Quezaltepeque', 'San Jacinto', 'San José la Arada', 'San Juan Ermita'],
  'El Progreso': ['El Jícaro', 'Guastatoya', 'Morazán', 'San Agustín Acasaguastlán', 'San Antonio La Paz', 'San Cristóbal Acasaguastlán', 'Sanarate', 'Sansare'],
  'Escuintla': ['Escuintla', 'Guanagazapa', 'Iztapa', 'La Democracia', 'La Gomera', 'Masagua', 'Nueva Concepción', 'Palín', 'San José', 'San Vicente Pacaya', 'Santa Lucía Cotzumalguapa', 'Siquinalá', 'Tiquisate'],
  'Guatemala': ['Amatitlán', 'Chinautla', 'Chuarrancho', 'Guatemala', 'Fraijanes', 'Mixco', 'Palencia', 'San José del Golfo', 'San José Pinula', 'San Juan Sacatepéquez', 'San Miguel Petapa', 'San Pedro Ayampuc', 'San Pedro Sacatepéquez', 'San Raymundo', 'Santa Catarina Pinula', 'Villa Canales', 'Villa Nueva'],
  'Huehuetenango': ['Aguacatán', 'Chiantla', 'Colotenango', 'Concepción Huista', 'Cuilco', 'Huehuetenango', 'Jacaltenango', 'La Democracia', 'La Libertad', 'Malacatancito', 'Nentón', 'San Antonio Huista', 'San Gaspar Ixchil', 'San Ildefonso Ixtahuacán', 'San Juan Atitán', 'San Juan Ixcoy', 'San Mateo Ixtatán', 'San Miguel Acatán', 'San Pedro Nécta', 'San Pedro Soloma', 'San Rafael La Independencia', 'San Rafael Pétzal', 'San Sebastián Coatán', 'San Sebastián Huehuetenango', 'Santa Ana Huista', 'Santa Bárbara', 'Santa Cruz Barillas', 'Santa Eulalia', 'Santiago Chimaltenango', 'Tectitán', 'Todos Santos Cuchumatán', 'Unión Cantinil'],
  'Izabal': ['El Estor', 'Livingston', 'Los Amates', 'Morales', 'Puerto Barrios'],
  'Jalapa': ['Jalapa', 'Mataquescuintla', 'Monjas', 'San Carlos Alzatate', 'San Luis Jilotepeque', 'San Manuel Chaparrón', 'San Pedro Pinula'],
  'Jutiapa': ['Agua Blanca', 'Asunción Mita', 'Atescatempa', 'Comapa', 'Conguaco', 'El Adelanto', 'El Progreso', 'Jalpatagua', 'Jerez', 'Jutiapa', 'Moyuta', 'Pasaco', 'Quesada', 'San José Acatempa', 'Santa Catarina Mita', 'Yupiltepeque', 'Zapotitlán'],
  'Petén': ['Dolores', 'El Chal', 'Ciudad Flores', 'La Libertad', 'Las Cruces', 'Melchor de Mencos', 'Poptún', 'San Andrés', 'San Benito', 'San Francisco', 'San José', 'San Luis', 'Santa Ana', 'Sayaxché'],
  'Quetzaltenango': ['Almolonga', 'Cabricán', 'Cajolá', 'Cantel', 'Coatepeque', 'Colomba Costa Cuca', 'Concepción Chiquirichapa', 'El Palmar', 'Flores Costa Cuca', 'Génova', 'Huitán', 'La Esperanza', 'Olintepeque', 'Palestina de Los Altos', 'Quetzaltenango', 'Salcajá', 'San Carlos Sija', 'San Francisco La Unión', 'San Juan Ostuncalco', 'San Martín Sacatepéquez', 'San Mateo', 'San Miguel Sigüilá', 'Sibilia', 'Zunil'],
  'Quiché': ['Canillá', 'Chajul', 'Chicamán', 'Chiché', 'Chichicastenango', 'Chinique', 'Cunén', 'Ixcán Playa Grande', 'Joyabaj', 'Nebaj', 'Pachalum', 'Patzité', 'Sacapulas', 'San Andrés Sajcabajá', 'San Antonio Ilotenango', 'San Bartolomé Jocotenango', 'San Juan Cotzal', 'San Pedro Jocopilas', 'Santa Cruz del Quiché', 'Uspantán', 'Zacualpa'],
  'Retalhuleu': ['Champerico', 'El Asintal', 'Nuevo San Carlos', 'Retalhuleu', 'San Andrés Villa Seca', 'San Felipe Reu', 'San Martín Zapotitlán', 'San Sebastián', 'Santa Cruz Muluá'],
  'Sacatepéquez': ['Alotenango', 'Ciudad Vieja', 'Jocotenango', 'Antigua Guatemala', 'Magdalena Milpas Altas', 'Pastores', 'San Antonio Aguas Calientes', 'San Bartolomé Milpas Altas', 'San Lucas Sacatepéquez', 'San Miguel Dueñas', 'Santa Catarina Barahona', 'Santa Lucía Milpas Altas', 'Santa María de Jesús', 'Santiago Sacatepéquez', 'Santo Domingo Xenacoj', 'Sumpango'],
  'San Marcos': ['Ayutla', 'Catarina', 'Comitancillo', 'Concepción Tutuapa', 'El Quetzal', 'El Tumbador', 'Esquipulas Palo Gordo', 'Ixchiguán', 'La Blanca', 'La Reforma', 'Malacatán', 'Nuevo Progreso', 'Ocós', 'Pajapita', 'Río Blanco', 'San Antonio Sacatepéquez', 'San Cristóbal Cucho', 'San José El Rodeo', 'San José Ojetenam', 'San Lorenzo', 'San Marcos', 'San Miguel Ixtahuacán', 'San Pablo', 'San Pedro Sacatepéquez', 'San Rafael Pie de la Cuesta', 'Sibinal', 'Sipacapa', 'Tacaná', 'Tajumulco', 'Tejutla'],
  'Santa Rosa': ['Barberena', 'Casillas', 'Chiquimulilla', 'Cuilapa', 'Guazacapán', 'Nueva Santa Rosa', 'Oratorio', 'Pueblo Nuevo Viñas', 'San Juan Tecuaco', 'San Rafael las Flores', 'Santa Cruz Naranjo', 'Santa María Ixhuatán', 'Santa Rosa de Lima', 'Taxisco'],
  'Sololá': ['Concepción', 'Nahualá', 'Panajachel', 'San Andrés Semetabaj', 'San Antonio Palopó', 'San José Chacayá', 'San Juan La Laguna', 'San Lucas Tolimán', 'San Marcos La Laguna', 'San Pablo La Laguna', 'San Pedro La Laguna', 'Santa Catarina Ixtahuacán', 'Santa Catarina Palopó', 'Santa Clara La Laguna', 'Santa Cruz La Laguna', 'Santa Lucía Utatlán', 'Santa María Visitación', 'Santiago Atitlán', 'Sololá'],
  'Suchitepéquez': ['Chicacao', 'Cuyotenango', 'Mazatenango', 'Patulul', 'Pueblo Nuevo', 'Río Bravo', 'Samayac', 'San Antonio Suchitepéquez', 'San Bernardino', 'San Francisco Zapotitlán', 'San Gabriel', 'San José El Idolo', 'San José La Maquina', 'San Juan Bautista', 'San Lorenzo', 'San Miguel Panán', 'San Pablo Jocopilas', 'Santa Bárbara', 'Santo Domingo Suchitepéquez', 'Santo Tomás La Unión', 'Zunilito'],
  'Totonicapán': ['Momostenango', 'San Andrés Xecul', 'San Bartolo', 'San Cristóbal Totonicapán', 'San Francisco El Alto', 'Santa Lucía La Reforma', 'Santa María Chiquimula', 'Totonicapán'],
  'Zacapa': ['Cabañas', 'Estanzuela', 'Gualán', 'Huité', 'La Unión', 'Río Hondo', 'San Diego', 'San Jorge', 'Teculután', 'Usumatlán', 'Zacapa']
}

watch(selectedDept, () => {
  selectedMuni.value = 'Todas'
  searchBarrio.value = ''
})

const departments = ['Todas', ...Object.keys(locationsData)]
const municipalities = computed(() => {
  if (selectedDept.value === 'Todas') return []
  return ['Todas', ...locationsData[selectedDept.value]]
})

const allBusinesses = ref([])
const categories = ref([])
const directoryTab = ref('negocios') // 'negocios' | 'productos'
const productResults = ref([])
const productImageMap = reactive({}) // { id_producto: url } — reactive para detección automática
const searchingProducts = ref(false)
const productSearchDone = ref(false)

let productSearchTimer = null
const loadProducts = async (q = '') => {
  searchingProducts.value = true
  try {
    const results = await searchProducts(q, 60)
    // Agregar imageUrl directamente al objeto antes de mostrar
    await Promise.all(results.map(async (p) => {
      try {
        const imgs = await getProductImages(p.id_producto)
        p.imageUrl = imgs.length ? imgs[0].url : null
      } catch { p.imageUrl = null }
    }))
    productResults.value = results
    productSearchDone.value = true
  } catch { productResults.value = [] }
  finally { searchingProducts.value = false }
}

const onSearchForProducts = () => {
  clearTimeout(productSearchTimer)
  const q = searchKeyword.value.trim()
  productSearchTimer = setTimeout(() => loadProducts(q), 200)
}

const formatProdPrice = (p) => {
  if (p.visibilidad_precio === 'OCULTO') return 'Consultar'
  if (!p.precio) return ''
  const prefix = p.visibilidad_precio === 'APROXIMADO' ? '~' : ''
  return `${prefix}Q${Number(p.precio) % 1 === 0 ? Number(p.precio).toFixed(0) : Number(p.precio).toFixed(2)}`
}
const sortBy = ref('default') // 'default' | 'mejor_valorado' | 'cercano'
const nearbyMap = ref({}) // id → distancia_km
const loadingNearby = ref(false)

const requestNearby = () => {
  if (!navigator.geolocation) return
  loadingNearby.value = true
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const list = await getNearbyBusinesses(coords.latitude, coords.longitude, 50)
        const map = {}
        list.forEach(b => { map[b.id] = b.distancia_km })
        nearbyMap.value = map
        sortBy.value = 'cercano'
      } catch { /* silent */ } finally {
        loadingNearby.value = false
      }
    },
    () => { loadingNearby.value = false }
  )
}

const normalize = (str) => {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase()
}

const toggleCategory = (cat) => {
  if (cat === 'Todas') { selectedCategories.value = []; return }
  const idx = selectedCategories.value.indexOf(cat)
  if (idx >= 0) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(cat)
  }
}

const filteredBusinesses = computed(() => {
  const keyword = normalize(searchKeyword.value)
  const barrioQuery = normalize(searchBarrio.value)

  let list = allBusinesses.value.filter(b => {
    const matchDept     = selectedDept.value === 'Todas' || normalize(b.dept) === normalize(selectedDept.value)
    const matchMuni     = selectedMuni.value === 'Todas' || normalize(b.muni) === normalize(selectedMuni.value)
    const matchBarrio   = !barrioQuery || normalize(b.localidad).includes(barrioQuery)
    const matchCategory = selectedCategories.value.length === 0 ||
      selectedCategories.value.some(c => (b.categorias || [b.category]).map(normalize).includes(normalize(c)))
    const matchKeyword  = !keyword || normalize(b.name).includes(keyword) || normalize(b.description).includes(keyword)
    // Si está en modo "cercano", solo mostrar los que tienen distancia calculada
    const matchNearby   = sortBy.value !== 'cercano' || nearbyMap.value[b.id] !== undefined
    return matchDept && matchMuni && matchBarrio && matchCategory && matchKeyword && matchNearby
  })

  if (sortBy.value === 'mejor_valorado') {
    list = [...list].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
  } else if (sortBy.value === 'cercano') {
    list = [...list].sort((a, b) => (nearbyMap.value[a.id] ?? 999) - (nearbyMap.value[b.id] ?? 999))
  }

  return list
})

const toggleFilters = () => { isFilterOpen.value = !isFilterOpen.value }

const resetFilters = () => {
  searchKeyword.value = ''
  selectedDept.value = 'Todas'
  selectedMuni.value = 'Todas'
  searchBarrio.value = ''
  selectedCategories.value = []
  categoryDropdownOpen.value = false
}

onMounted(async () => {
  window.addEventListener('resize', updateView)
  updateView()

  if (route.query.q) {
    searchKeyword.value = route.query.q
  }
  if (route.query.loc) {
    const match = Object.keys(locationsData).find(
      d => normalize(d) === normalize(route.query.loc)
    )
    if (match) selectedDept.value = match
  }

  try {
    allBusinesses.value = await getAllBusinesses()
    categories.value = await getCategories()
  } catch (error) {
    console.error('Error fetching directory data:', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar />

    <div class="container mx-auto px-4 md:px-6 pt-32 pb-12">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-black text-fiery-navy font-outfit mb-1">Nuestro <span class="text-fiery-red">Directorio</span></h1>
        <p class="text-slate-500 font-medium">Explora los mejores negocios de toda Guatemala</p>
      </div>

      <!-- Tabs Negocios / Productos -->
      <div class="flex gap-1 p-1.5 bg-slate-100 rounded-2xl mb-5 w-fit">
        <button @click="directoryTab = 'negocios'"
          :class="['px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all', directoryTab === 'negocios' ? 'bg-white text-fiery-navy shadow-sm' : 'text-slate-400 hover:text-slate-600']">
          Negocios
        </button>
        <button @click="directoryTab = 'productos'; if (!productSearchDone) loadProducts()"
          :class="['px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all', directoryTab === 'productos' ? 'bg-white text-fiery-navy shadow-sm' : 'text-slate-400 hover:text-slate-600']">
          Productos
        </button>
      </div>

      <!-- Barra de búsqueda principal + botón filtros -->
      <div class="flex gap-3 mb-6">
        <div class="relative flex-1">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            v-model="searchKeyword"
            @input="directoryTab === 'productos' ? onSearchForProducts() : null"
            type="text"
            :placeholder="directoryTab === 'productos' ? 'Busca un producto o servicio...' : 'Busca un negocio por nombre...'"
            class="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-fiery-navy font-bold outline-none focus:border-fiery-red transition-all shadow-sm text-sm"
          />
        </div>
        <button
          @click="toggleFilters"
          :class="[
            'flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-sm border whitespace-nowrap',
            isFilterOpen
              ? 'bg-fiery-navy text-white border-fiery-navy'
              : 'bg-white text-fiery-navy border-slate-200 hover:border-fiery-navy'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M7 8h10M11 12h4"/></svg>
          Filtros
          <span v-if="selectedCategories.length > 0 || selectedDept !== 'Todas' || sortBy !== 'default'"
            class="bg-fiery-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
            {{ [selectedCategories.length > 0, selectedDept !== 'Todas', sortBy !== 'default'].filter(Boolean).length }}
          </span>
        </button>
      </div>

      <!-- ═══ TAB PRODUCTOS ═══ -->
      <div v-if="directoryTab === 'productos'" class="min-h-[400px]">
        <!-- Estado: cargando -->
        <div v-if="searchingProducts" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
          <div v-for="i in 8" :key="i" class="bg-white rounded-2xl h-56 animate-pulse border border-slate-100"></div>
        </div>
        <!-- Resultados -->
        <div v-else-if="productResults.length > 0" class="mt-2">
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{{ productResults.length }} resultado{{ productResults.length !== 1 ? 's' : '' }}</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <RouterLink
              v-for="prod in productResults"
              :key="prod.id_producto"
              :to="`/negocio/${prod.emprendimiento_id}`"
              class="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <!-- Imagen del producto -->
              <div class="h-40 bg-gradient-to-br from-slate-50 to-slate-200 relative flex items-center justify-center overflow-hidden">
                <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <img v-if="prod.imageUrl"
                  :src="prod.imageUrl"
                  class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <!-- Precio -->
                <div v-if="formatProdPrice(prod)" class="absolute bottom-2 right-2 bg-fiery-navy/90 text-white text-[10px] font-black px-2 py-1 rounded-full">
                  {{ formatProdPrice(prod) }}
                </div>
              </div>
              <!-- Info -->
              <div class="p-4">
                <h3 class="font-black text-fiery-navy text-sm line-clamp-1">{{ prod.nombre }}</h3>
                <p v-if="prod.descripcion" class="text-slate-400 text-[11px] mt-0.5 line-clamp-2 leading-snug">{{ prod.descripcion }}</p>
                <div class="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                  <img v-if="prod.emprendimiento_logo" :src="prod.emprendimiento_logo" class="w-5 h-5 rounded-md object-cover" />
                  <div v-else class="w-5 h-5 rounded-md bg-fiery-navy/20 flex items-center justify-center text-[9px] font-black text-fiery-navy">
                    {{ (prod.emprendimiento_nombre || '?').charAt(0) }}
                  </div>
                  <span class="text-[10px] text-slate-400 font-bold truncate">{{ prod.emprendimiento_nombre }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
        <!-- Sin resultados -->
        <div v-else-if="productSearchDone" class="text-center py-16 text-slate-400">
          <p class="font-black text-lg">Sin resultados para "{{ searchKeyword }}"</p>
          <p class="text-sm mt-1">Intenta con otro término</p>
        </div>
      </div>

      <div v-if="directoryTab === 'negocios'" class="flex flex-col lg:flex-row gap-8">

        <!-- Sidebar filtros -->
        <transition :name="isDesktop ? '' : 'slide-fade'">
          <aside v-if="isFilterOpen || isDesktop" class="w-full lg:w-[320px] shrink-0">
            <div class="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 lg:sticky lg:top-28">
              <h2 class="text-sm font-black text-fiery-navy mb-6 uppercase tracking-widest">Filtros</h2>

              <div class="space-y-6">

                <!-- Ubicación -->
                <div class="space-y-4 pt-4 border-t border-slate-200">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación</label>
                  <select
                    v-model="selectedDept"
                    class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy cursor-pointer shadow-sm focus:border-fiery-red"
                  >
                    <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
                  </select>
                  <select
                    v-if="selectedDept !== 'Todas'"
                    v-model="selectedMuni"
                    class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy cursor-pointer shadow-sm focus:border-fiery-red"
                  >
                    <option v-for="muni in municipalities" :key="muni" :value="muni">{{ muni }}</option>
                  </select>
                  <input
                    v-if="selectedMuni !== 'Todas'"
                    v-model="searchBarrio"
                    type="text"
                    placeholder="Zona o Barrio..."
                    class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy shadow-sm focus:border-fiery-red"
                  />
                </div>

                <!-- Categorías -->
                <div class="pt-4 border-t border-slate-200">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categorías</label>

                  <!-- Dropdown trigger -->
                  <button
                    @click="categoryDropdownOpen = !categoryDropdownOpen"
                    class="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-fiery-navy focus:outline-none focus:border-fiery-red transition-all"
                  >
                    <span class="truncate">
                      {{ selectedCategories.length === 0 ? 'Todas las categorías' : selectedCategories.join(', ') }}
                    </span>
                    <svg class="w-4 h-4 shrink-0 ml-2 transition-transform" :class="categoryDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  <!-- ✅ Dropdown list con scroll interno -->
                  <div
                    v-if="categoryDropdownOpen"
                    class="mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg category-scroll"
                  >
                    <!-- Todas -->
                    <button
                      @click="toggleCategory('Todas')"
                      :class="['w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2',
                        selectedCategories.length === 0 ? 'text-fiery-red bg-fiery-red/5' : 'text-slate-500 hover:bg-slate-50']"
                    >
                      <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        :class="selectedCategories.length === 0 ? 'bg-fiery-red border-fiery-red' : 'border-slate-300'">
                        <svg v-if="selectedCategories.length === 0" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      </span>
                      Todas
                    </button>
                    <button
                      v-for="cat in categories.filter(c => c !== 'Todas')"
                      :key="cat"
                      @click="toggleCategory(cat)"
                      :class="['w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 border-t border-slate-50',
                        selectedCategories.includes(cat) ? 'text-fiery-red bg-fiery-red/5' : 'text-slate-600 hover:bg-slate-50']"
                    >
                      <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        :class="selectedCategories.includes(cat) ? 'bg-fiery-red border-fiery-red' : 'border-slate-300'">
                        <svg v-if="selectedCategories.includes(cat)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      </span>
                      {{ cat }}
                    </button>
                  </div>

                  <!-- Tags seleccionadas -->
                  <div v-if="selectedCategories.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                    <span
                      v-for="cat in selectedCategories" :key="cat"
                      class="flex items-center gap-1 px-2.5 py-1 bg-fiery-red/10 text-fiery-red rounded-full text-[10px] font-black uppercase"
                    >
                      {{ cat }}
                      <button @click="toggleCategory(cat)" class="hover:text-fiery-darkred leading-none">×</button>
                    </span>
                  </div>
                </div>

                <!-- Ordenar -->
                <div class="pt-4 border-t border-slate-200">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ordenar por</label>
                  <div class="space-y-2">
                    <button @click="sortBy = 'default'"
                      :class="['w-full px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border text-left', sortBy === 'default' ? 'bg-fiery-navy text-white border-fiery-navy' : 'bg-white text-slate-500 border-slate-200 hover:border-fiery-navy hover:text-fiery-navy']">
                      Predeterminado
                    </button>
                    <button @click="sortBy = 'mejor_valorado'"
                      :class="['w-full px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 text-left', sortBy === 'mejor_valorado' ? 'bg-fiery-red text-white border-fiery-red' : 'bg-white text-slate-500 border-slate-200 hover:border-fiery-red hover:text-fiery-red']">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      Mejor valorado
                    </button>
                    <button @click="sortBy === 'cercano' ? sortBy = 'default' : requestNearby()"
                      :disabled="loadingNearby"
                      :class="['w-full px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 text-left disabled:opacity-60', sortBy === 'cercano' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-600 hover:text-emerald-600']">
                      <svg v-if="loadingNearby" class="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      <svg v-else class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      {{ sortBy === 'cercano' ? 'Cerca de mí ✓' : 'Cerca de mí' }}
                    </button>
                  </div>
                </div>

                <!-- Reset -->
                <button
                  @click="resetFilters"
                  class="w-full mt-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-fiery-red border border-slate-200 hover:border-fiery-red/30 transition-all"
                >Reiniciar filtros</button>

              </div>
            </div>
          </aside>
        </transition>

        <!-- Resultados -->
        <main class="flex-1">
          <!-- Indicador de filtro activo -->
          <div v-if="selectedDept !== 'Todas'" class="mb-6 flex items-center gap-3 flex-wrap">
            <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Mostrando en:</span>
            <span class="px-4 py-1.5 bg-fiery-red/10 text-fiery-red rounded-full text-xs font-black uppercase">
              {{ selectedDept }}{{ selectedMuni !== 'Todas' ? ' — ' + selectedMuni : '' }}
            </span>
            <button @click="resetFilters" class="text-xs text-slate-400 hover:text-fiery-red underline font-semibold transition-colors">Quitar filtro</button>
          </div>

          <div v-if="filteredBusinesses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <div v-for="business in filteredBusinesses" :key="business.id" class="relative">
              <span v-if="sortBy === 'cercano' && nearbyMap[business.id] !== undefined"
                class="absolute top-3 right-3 z-10 bg-fiery-navy text-white text-[10px] font-black px-2 py-1 rounded-full shadow">
                📍 {{ nearbyMap[business.id] }} km
              </span>
              <BusinessCard :business="business" />
            </div>
          </div>

          <div v-else class="bg-white rounded-[3rem] p-16 text-center border border-slate-100">
            <h3 class="text-3xl font-black text-fiery-navy mb-2 font-outfit uppercase">Sin resultados</h3>
            <p class="text-slate-400 mb-8 font-medium">
              No encontramos negocios
              <span v-if="selectedDept !== 'Todas'">en <strong>{{ selectedDept }}</strong></span>
              <span v-if="searchKeyword"> con "<strong>{{ searchKeyword }}</strong>"</span>.
            </p>
            <button @click="resetFilters" class="bg-fiery-red text-white font-black px-8 py-4 rounded-2xl hover:bg-fiery-darkred transition-all">
              Reiniciar filtros
            </button>
          </div>
        </main>

      </div><!-- fin v-if negocios -->
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(-20px); opacity: 0; }
select { appearance: none; }

/* ✅ Dropdown de categorías con scroll interno */
.category-scroll {
  max-height: 260px;
  overflow-y: auto;
  overscroll-behavior: contain; /* evita que el scroll se propague a la página */
}
.category-scroll::-webkit-scrollbar {
  width: 4px;
}
.category-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.category-scroll::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 999px;
}
.category-scroll::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>