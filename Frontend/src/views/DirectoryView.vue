<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/layout/Navbar.vue'
import BusinessCard from '../components/business/BusinessCard.vue'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const selectedDept = ref('Todas')
const selectedMuni = ref('Todas')
const searchBarrio = ref('')
const selectedCategory = ref('Todas')

// BASE DE DATOS COMPLETA DE GUATEMALA
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

watch(selectedMuni, () => {
  searchBarrio.value = ''
})

const departments = ['Todas', ...Object.keys(locationsData)]

const municipalities = computed(() => {
  if (selectedDept.value === 'Todas') return []
  return ['Todas', ...locationsData[selectedDept.value]]
})

onMounted(() => {
  if (route.query.q) searchKeyword.value = route.query.q
})

const categories = ['Todas', 'Restaurantes', 'Salud', 'Servicios', 'Tecnología', 'Belleza', 'Comercio']

// RESTAURANDO TODOS LOS LOCALES Y MÁS
const allBusinesses = ref([
  { id: 1, name: 'Café El Despertar', category: 'Restaurantes', rating: 4.8, description: 'El mejor café artesanal.', dept: 'Sacatepéquez', muni: 'Antigua Guatemala', barrio: 'Barrio Santa Ana', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: 'Clínica Dental Sonrisas', category: 'Salud', rating: 4.9, description: 'Atención dental profesional.', dept: 'Guatemala', muni: 'Guatemala', barrio: 'Zona 10', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: 'Servicios de Plomería Express', category: 'Servicios', rating: 4.5, description: 'Soluciones rápidas 24/7.', dept: 'Guatemala', muni: 'Mixco', barrio: 'San Cristóbal', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80' },
  { id: 4, name: 'TechFix Reparaciones', category: 'Tecnología', rating: 4.7, description: 'Reparación de computadoras.', dept: 'Guatemala', muni: 'Guatemala', barrio: 'Zona 4', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80' },
  { id: 5, name: 'Spa Relajación Total', category: 'Belleza', rating: 4.6, description: 'Masajes y tratamientos.', dept: 'Guatemala', muni: 'Guatemala', barrio: 'Zona 14', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
  { id: 6, name: 'Boutique La Moda', category: 'Comercio', rating: 4.3, description: 'Ropa de última tendencia.', dept: 'Guatemala', muni: 'Villa Nueva', barrio: 'El Frutal', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80' },
  { id: 7, name: 'Burger Kinga', category: 'Restaurantes', rating: 4.2, description: 'Hamburguesas gigantes.', dept: 'Guatemala', muni: 'Guatemala', barrio: 'Zona 1', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { id: 8, name: 'Peluquería Estilos', category: 'Belleza', rating: 4.8, description: 'Cortes y tintes.', dept: 'Quetzaltenango', muni: 'Quetzaltenango', barrio: 'Zona 3', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' },
  { id: 9, name: 'Hotel Selva Verde', category: 'Servicios', rating: 4.9, description: 'Ecoturismo puro.', dept: 'Petén', muni: 'Ciudad Flores', barrio: 'Isla de Flores', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' },
  { id: 10, name: 'Mariscos del Puerto', category: 'Restaurantes', rating: 4.4, description: 'Sabor a mar.', dept: 'Escuintla', muni: 'San José', barrio: 'Barrio El Laberinto', image: 'https://images.unsplash.com/photo-1534604973900-c41ab46d1334?auto=format&fit=crop&w=800&q=80' }
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
    const bBarrio = normalize(b.barrio)
    const matchBarrio = !barrioQuery || bBarrio.includes(barrioQuery)
    const matchCategory = selectedCategory.value === 'Todas' || b.category === selectedCategory.value
    
    const name = normalize(b.name)
    const category = normalize(b.category)
    const description = normalize(b.description)
    const matchKeyword = name.includes(keyword) || category.includes(keyword) || description.includes(keyword)

    return matchDept && matchMuni && matchBarrio && matchCategory && matchKeyword
  })
})

const triggerSearch = () => {
  router.push({ query: { q: searchKeyword.value, dept: selectedDept.value, muni: selectedMuni.value } })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />
    
    <div class="container mx-auto px-6 pt-32 pb-12">
      <div class="flex flex-col lg:flex-row gap-8">
        
        <aside class="w-full lg:w-1/4">
          <div class="bg-white rounded-[2.5rem] shadow-xl shadow-fiery-navy/5 border border-slate-100 p-8 sticky top-28">
            <h2 class="text-2xl font-black text-fiery-navy mb-8 font-outfit">Filtros</h2>
            
            <div class="space-y-6">
              <div>
                <label class="block text-xs font-black text-fiery-navy/40 uppercase tracking-widest mb-3 pl-1">Búsqueda rápida</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-fiery-red transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <input v-model="searchKeyword" @keyup.enter="triggerSearch" type="text" placeholder="Ej. Restaurante..." class="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-fiery-red/20 focus:bg-white focus:ring-4 focus:ring-fiery-red/5 outline-none transition-all font-bold text-fiery-navy">
                </div>
              </div>

              <div class="space-y-5 pt-4 border-t border-slate-100">
                <div>
                  <label class="block text-xs font-black text-fiery-navy/40 uppercase tracking-widest mb-2 pl-1">Departamento</label>
                  <div class="relative">
                    <select v-model="selectedDept" class="w-full pl-4 pr-10 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-fiery-red/20 focus:bg-white focus:ring-4 focus:ring-fiery-red/5 outline-none transition-all font-bold text-fiery-navy appearance-none cursor-pointer">
                      <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
                    </select>
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                </div>

                <transition name="fade">
                  <div v-if="selectedDept !== 'Todas'">
                    <label class="block text-xs font-black text-fiery-navy/40 uppercase tracking-widest mb-2 pl-1">Municipio</label>
                    <div class="relative">
                      <select v-model="selectedMuni" class="w-full pl-4 pr-10 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-fiery-red/20 focus:bg-white focus:ring-4 focus:ring-fiery-red/5 outline-none transition-all font-bold text-fiery-navy appearance-none cursor-pointer">
                        <option v-for="muni in municipalities" :key="muni" :value="muni">{{ muni }}</option>
                      </select>
                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </span>
                    </div>
                  </div>
                </transition>

                <transition name="fade">
                  <div v-if="selectedMuni !== 'Todas'">
                    <label class="block text-xs font-black text-fiery-navy/40 uppercase tracking-widest mb-2 pl-1">Aldea / Barrio</label>
                    <div class="relative group">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-fiery-red transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </span>
                      <input v-model="searchBarrio" type="text" placeholder="¿En qué zona?" class="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-fiery-red/20 focus:bg-white focus:ring-4 focus:ring-fiery-red/5 outline-none transition-all font-bold text-fiery-navy">
                    </div>
                  </div>
                </transition>
              </div>

              <div class="pt-4 border-t border-slate-100">
                <label class="block text-xs font-black text-fiery-navy/40 uppercase tracking-widest mb-4 pl-1">Categorías</label>
                <div class="space-y-2">
                  <label v-for="cat in categories" :key="cat" class="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-fiery-red/5 transition-colors">
                    <div class="relative flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all" :class="selectedCategory === cat ? 'border-fiery-red bg-fiery-red shadow-lg shadow-fiery-red/20' : 'border-slate-200 group-hover:border-fiery-red/50'">
                      <svg v-if="selectedCategory === cat" class="w-4 h-4 text-white absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                      <input type="radio" :value="cat" v-model="selectedCategory" class="opacity-0 absolute w-full h-full cursor-pointer" />
                    </div>
                    <span class="text-slate-600 font-bold transition-colors text-sm" :class="selectedCategory === cat ? 'text-fiery-navy' : 'group-hover:text-fiery-red'">{{ cat }}</span>
                  </label>
                </div>
              </div>
              
              <button @click="triggerSearch" class="w-full bg-fiery-navy hover:bg-fiery-red text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-fiery-navy/10 mt-6 uppercase tracking-[0.2em] text-xs">
                Ver resultados
              </button>
            </div>
          </div>
        </aside>

        <main class="w-full lg:w-3/4">
          <div v-if="filteredBusinesses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <BusinessCard v-for="business in filteredBusinesses" :key="business.id" :business="business" />
          </div>
          
          <div v-else class="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-xl shadow-fiery-navy/5">
            <div class="w-24 h-24 bg-fiery-cream rounded-full flex items-center justify-center mx-auto mb-6 text-fiery-red">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 class="text-3xl font-black text-fiery-navy mb-4 font-outfit">Sin coincidencias</h3>
            <p class="text-slate-500 text-lg mb-8 max-w-md mx-auto">No hay negocios que coincidan con estos filtros específicos.</p>
            <button @click="() => { searchKeyword = ''; selectedDept = 'Todas'; triggerSearch(); }" class="bg-fiery-red text-white font-black px-8 py-4 rounded-2xl hover:bg-fiery-darkred transition-all shadow-lg shadow-fiery-red/20">
              Reiniciar filtros
            </button>
          </div>
        </main>

      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>
