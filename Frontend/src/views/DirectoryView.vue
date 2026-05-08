<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'

const route = useRoute()
const router = useRouter()

const isFilterOpen = ref(false)
const searchKeyword = ref('')
const selectedDept = ref('Todas')
const selectedMuni = ref('Todas')
const searchBarrio = ref('')
const selectedCategory = ref('Todas')

// Detectar si es PC para mantener filtros abiertos
const isDesktop = ref(window.innerWidth >= 1024)
const updateView = () => {
  isDesktop.value = window.innerWidth >= 1024
  if (isDesktop.value) isFilterOpen.value = true
}

onMounted(() => {
  window.addEventListener('resize', updateView)
  updateView()
  if (route.query.q) searchKeyword.value = route.query.q
})

// BASE DE DATOS COMPLETA
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
  'Solola': ['Concepción', 'Nahualá', 'Panajachel', 'San Andrés Semetabaj', 'San Antonio Palopó', 'San José Chacayá', 'San Juan La Laguna', 'San Lucas Tolimán', 'San Marcos La Laguna', 'San Pablo La Laguna', 'San Pedro La Laguna', 'Santa Catarina Ixtahuacán', 'Santa Catarina Palopó', 'Santa Clara La Laguna', 'Santa Cruz La Laguna', 'Santa Lucía Utatlán', 'Santa María Visitación', 'Santiago Atitlán', 'Sololá'],
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

const allBusinesses = ref([
  { id: 1, name: 'Café El Despertar', category: 'Restaurantes', rating: 4.8, description: 'El mejor café artesanal cultivado en Chiquimula.', dept: 'Chiquimula', muni: 'Chiquimula', barrio: 'Barrio El Molino', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: 'Clínica Dental Sonrisas', category: 'Salud', rating: 4.9, description: 'Atención dental profesional y amable.', dept: 'Zacapa', muni: 'Zacapa', barrio: 'Barrio Nuevo', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: 'Ferretería El Tornillo', category: 'Comercio', rating: 4.5, description: 'Todo para la construcción y el hogar.', dept: 'Chiquimula', muni: 'Esquipulas', barrio: 'Centro', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80' },
  { id: 4, name: 'Taller Mecánico Central', category: 'Servicios', rating: 4.7, description: 'Reparación de motores y pintura automotriz.', dept: 'Chiquimula', muni: 'Chiquimula', barrio: 'Zona 1', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80' },
  { id: 5, name: 'Panadería La Bendición', category: 'Restaurantes', rating: 4.6, description: 'Pan dulce y francés calientito todo el día.', dept: 'Jalapa', muni: 'Jalapa', barrio: 'Barrio La Democracia', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
  { id: 6, name: 'Salón de Belleza Glamour', category: 'Belleza', rating: 4.3, description: 'Cortes, tintes y tratamientos de spa.', dept: 'Chiquimula', muni: 'Ipala', barrio: 'Centro', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
  { id: 7, name: 'Librería El Saber', category: 'Comercio', rating: 4.2, description: 'Útiles escolares y oficina.', dept: 'Zacapa', muni: 'Gualán', barrio: 'Barrio San Miguel', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80' },
  { id: 8, name: 'Restaurante Sabor Chapín', category: 'Restaurantes', rating: 4.8, description: 'Pepián, jocón y más platillos tradicionales.', dept: 'Chiquimula', muni: 'Quezaltepeque', barrio: 'Zona 2', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  { id: 9, name: 'Electrónica El Rayo', category: 'Tecnología', rating: 4.9, description: 'Reparación de celulares y laptops.', dept: 'Jalapa', muni: 'Monjas', barrio: 'Centro', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80' },
  { id: 10, name: 'Vivero Los Girasoles', category: 'Servicios', rating: 5.0, description: 'Venta de plantas y flores de temporada.', dept: 'Chiquimula', muni: 'San Jacinto', barrio: 'Entrada Principal', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80' }
])

const normalize = (str) => {
  if (!str) return ''
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase()
}

const filteredBusinesses = computed(() => {
  const keyword = normalize(searchKeyword.value)
  const barrioQuery = normalize(searchBarrio.value)
  return allBusinesses.value.filter(b => {
    const matchDept = selectedDept.value === 'Todas' || b.dept === selectedDept.value
    const matchMuni = selectedMuni.value === 'Todas' || b.muni === selectedMuni.value
    const matchBarrio = !barrioQuery || normalize(b.barrio).includes(barrioQuery)
    const matchCategory = selectedCategory.value === 'Todas' || b.category === selectedCategory.value
    const matchKeyword = normalize(b.name).includes(keyword) || normalize(b.category).includes(keyword) || normalize(b.description).includes(keyword)
    return matchDept && matchMuni && matchBarrio && matchCategory && matchKeyword
  })
})

const categories = ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio']
const toggleFilters = () => { if (!isDesktop.value) isFilterOpen.value = !isFilterOpen.value }
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar />
    
    <div class="container mx-auto px-4 md:px-6 pt-32 pb-12">
      <!-- Header with Toggle Button (Solo visible en celular) -->
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
        >
          {{ isFilterOpen ? 'Cerrar Buscador' : 'Busca negocios' }}
        </button>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar Filters: Always visible on PC, Toggleable on Mobile -->
        <transition :name="isDesktop ? '' : 'slide-fade'">
          <aside v-if="isFilterOpen || isDesktop" class="w-full lg:w-[320px] shrink-0">
            <div class="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 lg:sticky lg:top-28">
              <h2 class="text-xl font-black text-fiery-navy mb-6 uppercase tracking-widest text-sm">Filtros</h2>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Qué buscas?</label>
                  <input v-model="searchKeyword" type="text" placeholder="Nombre..." class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none transition-all font-bold text-fiery-navy shadow-sm">
                </div>

                <div class="space-y-4 pt-4 border-t border-slate-200">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación</label>
                  <select v-model="selectedDept" class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy appearance-none cursor-pointer shadow-sm">
                    <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
                  </select>
                  <select v-if="selectedDept !== 'Todas'" v-model="selectedMuni" class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy appearance-none cursor-pointer shadow-sm">
                    <option v-for="muni in municipalities" :key="muni" :value="muni">{{ muni }}</option>
                  </select>
                  <input v-if="selectedMuni !== 'Todas'" v-model="searchBarrio" type="text" placeholder="Zona o Barrio..." class="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-fiery-navy shadow-sm">
                </div>

                <div class="pt-4 border-t border-slate-200">
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categorías</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat" :class="[selectedCategory === cat ? 'bg-fiery-red text-white' : 'bg-white text-slate-500 hover:border-fiery-red/30', 'px-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-slate-100']">{{ cat }}</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </transition>

        <!-- Results Grid -->
        <main class="flex-1">
          <div v-if="filteredBusinesses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <BusinessCard v-for="business in filteredBusinesses" :key="business.id" :business="business" />
          </div>
          <div v-else class="bg-white rounded-[3rem] p-16 text-center border border-slate-100">
            <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit uppercase">Sin resultados</h3>
            <button @click="() => { searchKeyword = ''; selectedDept = 'Todas'; }" class="bg-fiery-red text-white font-black px-8 py-4 rounded-2xl">Reiniciar filtros</button>
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
