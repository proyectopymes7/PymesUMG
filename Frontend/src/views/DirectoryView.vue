<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'
import { getAllBusinesses, getCategories } from '../services/businessService'

const route = useRoute()
const router = useRouter()

const isFilterOpen = ref(false)
const searchKeyword = ref('')
const selectedDept = ref('Todas')
const selectedMuni = ref('Todas')
const searchBarrio = ref('')
const selectedCategory = ref('Todas')

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

const normalize = (str) => {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase()
}

const filteredBusinesses = computed(() => {
  const keyword = normalize(searchKeyword.value)
  const barrioQuery = normalize(searchBarrio.value)
  return allBusinesses.value.filter(b => {
    const matchDept     = selectedDept.value === 'Todas' || normalize(b.dept) === normalize(selectedDept.value)
    const matchMuni     = selectedMuni.value === 'Todas' || normalize(b.muni) === normalize(selectedMuni.value)
    const matchBarrio   = !barrioQuery || normalize(b.barrio).includes(barrioQuery)
    const matchCategory = selectedCategory.value === 'Todas' || b.category === selectedCategory.value
    const matchKeyword  = !keyword || normalize(b.name).includes(keyword) || normalize(b.category).includes(keyword) || normalize(b.description).includes(keyword)
    return matchDept && matchMuni && matchBarrio && matchCategory && matchKeyword
  })
})

const toggleFilters = () => { if (!isDesktop.value) isFilterOpen.value = !isFilterOpen.value }

const resetFilters = () => {
  searchKeyword.value = ''
  selectedDept.value = 'Todas'
  selectedMuni.value = 'Todas'
  searchBarrio.value = ''
  selectedCategory.value = 'Todas'
}

onMounted(async () => {
  window.addEventListener('resize', updateView)
  updateView()

  // ── Leer parámetros que vienen del buscador del Home ──
  if (route.query.q) {
    searchKeyword.value = route.query.q
  }
  if (route.query.loc) {
    // Buscar coincidencia normalizando para ignorar tildes/mayúsculas
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
      <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 class="text-4xl md:text-5xl font-black text-fiery-navy font-outfit">Nuestro <span class="text-fiery-red">Directorio</span></h1>
          <p class="text-slate-500 font-medium mt-2">Explora los mejores negocios de toda Guatemala</p>
        </div>
        <button
          v-if="!isDesktop"
          @click="toggleFilters"
          :class="[
            'flex lg:hidden items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95',
            isFilterOpen ? 'bg-fiery-navy text-white shadow-fiery-navy/20' : 'bg-fiery-red text-white shadow-fiery-red/20'
          ]"
        >{{ isFilterOpen ? 'Cerrar Buscador' : 'Busca negocios' }}</button>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">

        <!-- Sidebar filtros -->
        <transition :name="isDesktop ? '' : 'slide-fade'">
          <aside v-if="isFilterOpen || isDesktop" class="w-full lg:w-[320px] shrink-0">
            <div class="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 lg:sticky lg:top-28">
              <h2 class="text-sm font-black text-fiery-navy mb-6 uppercase tracking-widest">Filtros</h2>

              <div class="space-y-6">

                <!-- Keyword -->
                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Qué buscas?</label>
                  <input
                    v-model="searchKeyword"
                    type="text"
                    placeholder="Nombre del negocio..."
                    class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none transition-all font-bold text-fiery-navy shadow-sm focus:border-fiery-red"
                  />
                </div>

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
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="cat in categories" :key="cat"
                      @click="selectedCategory = cat"
                      :class="[
                        selectedCategory === cat ? 'bg-fiery-red text-white border-fiery-red' : 'bg-white text-slate-500 border-slate-100 hover:border-fiery-red/30',
                        'px-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all border'
                      ]"
                    >{{ cat }}</button>
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
            <BusinessCard v-for="business in filteredBusinesses" :key="business.id" :business="business" />
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

      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: 'Outfit', sans-serif; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(-20px); opacity: 0; }
select { appearance: none; }
</style>