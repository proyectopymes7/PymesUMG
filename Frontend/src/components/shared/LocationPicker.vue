<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  readonly:   { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const mapContainer  = ref(null)
const searchInputEl = ref(null)
const searchText    = ref('')
const suggestions   = ref([])
const showDropdown  = ref(false)
const dropdownStyle = ref({})
let map    = null
let marker = null
let searchTimer = null

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const loadGoogleMaps = async () => {
  if (window.google?.maps?.marker) return

  // Si el objeto google.maps ya existe (por HMR o script anterior), cargamos la librería dinámicamente
  if (window.google?.maps?.importLibrary) {
    try {
      await window.google.maps.importLibrary("marker")
      return
    } catch (e) {
      console.warn("Could not import marker library dynamically", e)
    }
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gmaps]')
    if (existing) {
      const poll = setInterval(() => {
        if (window.google?.maps?.marker) { clearInterval(poll); resolve() }
      }, 50)
      setTimeout(() => { clearInterval(poll); reject(new Error('timeout')) }, 10000)
      return
    }
    window.__gmapsCallback = resolve
    const script = document.createElement('script')
    script.setAttribute('data-gmaps', '1')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&v=weekly&loading=async&libraries=marker&callback=__gmapsCallback`
    script.async = true
    script.defer = true
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
    )
    const data = await res.json()
    const a = data.address || {}
    return {
      departamento: a.state || '',
      municipio:    a.city || a.town || a.municipality || a.county || '',
      localidad:    a.suburb || a.neighbourhood || a.quarter || a.village || '',
      direccion:    [a.road, a.house_number].filter(Boolean).join(' ') || ''
    }
  } catch {
    return { departamento: '', municipio: '', localidad: '', direccion: '' }
  }
}

const fetchSuggestions = async (text) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=gt&format=json&limit=5&accept-language=es`
    )
    const data = await res.json()
    suggestions.value = data.map(r => ({
      label: r.display_name,
      lat:   Number(r.lat),
      lng:   Number(r.lon)
    }))
  } catch {
    suggestions.value = []
  }
}

const placeMarker = (lat, lng) => {
  if (!map || !marker) return
  marker.position = { lat, lng }
  marker.map = map
  map.panTo({ lat, lng })
  map.setZoom(15)
}

const emitFull = (lat, lng, addr) => {
  emit('update:modelValue', { ...(props.modelValue || {}), lat, lng, ...addr })
}

const updateDropdownPosition = () => {
  if (!searchInputEl.value) return
  const rect = searchInputEl.value.getBoundingClientRect()
  dropdownStyle.value = {
    top:   `${rect.bottom + 4}px`,
    left:  `${rect.left}px`,
    width: `${rect.width}px`
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimer)
  const text = searchText.value.trim()
  if (text.length < 3) { suggestions.value = []; return }
  updateDropdownPosition()
  searchTimer = setTimeout(async () => {
    await fetchSuggestions(text)
    if (suggestions.value[0]) {
      const { lat, lng } = suggestions.value[0]
      const addr = await reverseGeocode(lat, lng)
      placeMarker(lat, lng)
      emitFull(lat, lng, addr)
    }
  }, 500)
}

const selectSuggestion = async (s) => {
  searchText.value = s.label
  suggestions.value = []
  showDropdown.value = false
  const addr = await reverseGeocode(s.lat, s.lng)
  placeMarker(s.lat, s.lng)
  emitFull(s.lat, s.lng, addr)
}

const onBlur = () => {
  setTimeout(() => { showDropdown.value = false }, 200)
}

onMounted(async () => {
  // Esperar al siguiente frame para que el contenedor esté visible
  // (necesario cuando se monta dentro de un modal con animación)
  await nextTick()
  await new Promise(r => setTimeout(r, 50))

  try {
    await loadGoogleMaps()
  } catch (e) {
    console.error('Error loading Google Maps:', e)
    return
  }

  const defaultCenter = { lat: 14.6349, lng: -90.5069 }
  const hasInitial = !!(props.modelValue?.lat && props.modelValue?.lng)
  const initialCenter = hasInitial
    ? { lat: Number(props.modelValue.lat), lng: Number(props.modelValue.lng) }
    : defaultCenter

  map = new window.google.maps.Map(mapContainer.value, {
    center: initialCenter,
    zoom: hasInitial ? 15 : 7,
    mapId: 'DEMO_MAP_ID',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER }
  })

  marker = new window.google.maps.marker.AdvancedMarkerElement({
    position: initialCenter,
    map: hasInitial ? map : null,
    gmpDraggable: !props.readonly
  })

  // Forzar redibujado de tiles cuando el contenedor cambia tamaño
  // (soluciona mapa en blanco dentro del modal de admin)
  new ResizeObserver(() => {
    if (map) window.google.maps.event.trigger(map, 'resize')
  }).observe(mapContainer.value)

  if (!props.readonly) {
    marker.addListener('dragend', async () => {
      const pos = marker.position
      const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat
      const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng
      const addr = await reverseGeocode(lat, lng)
      emitFull(lat, lng, addr)
    })

    map.addListener('click', async (e) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      placeMarker(lat, lng)
      const addr = await reverseGeocode(lat, lng)
      emitFull(lat, lng, addr)
    })
  }
})

watch(() => props.modelValue, (val) => {
  if (!map || !marker || !val?.lat) return
  const pos = { lat: Number(val.lat), lng: Number(val.lng) }
  marker.position = pos
  marker.map = map
  map.panTo(pos)
}, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <!-- Search con dropdown teleportado al body para evitar clipping del modal -->
    <div v-if="!readonly" class="relative">
      <input
        ref="searchInputEl"
        v-model="searchText"
        @input="onSearchInput"
        @focus="showDropdown = true"
        @blur="onBlur"
        type="text"
        placeholder="Busca la dirección del negocio en Guatemala..."
        class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-fiery-navy placeholder-slate-400 outline-none focus:border-fiery-red transition-all shadow-sm"
        autocomplete="off"
      />
      <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>

      <Teleport to="body">
        <div
          v-if="showDropdown && suggestions.length"
          :style="dropdownStyle"
          class="fixed bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          style="z-index: 99999;"
        >
          <button
            v-for="s in suggestions"
            :key="s.label"
            @mousedown.prevent="selectSuggestion(s)"
            class="w-full text-left px-4 py-2.5 text-xs text-fiery-navy hover:bg-slate-50 border-b border-slate-100 last:border-0 leading-snug"
          >
            {{ s.label }}
          </button>
        </div>
      </Teleport>
    </div>

    <!-- Map -->
    <div class="relative">
      <div
        ref="mapContainer"
        class="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
        :class="readonly ? 'h-56' : 'h-60'"
      ></div>

      <!-- Hint flotante siempre visible en modo edición -->
      <div
        v-if="!readonly"
        class="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none"
      >
        <div class="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <svg class="w-3.5 h-3.5 text-fiery-red flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span class="text-[11px] font-semibold text-fiery-navy">Haz clic en el mapa o arrastra el pin</span>
        </div>
      </div>
    </div>

    <!-- Location summary -->
    <div v-if="modelValue?.departamento" class="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1">
      <div class="text-xs"><span class="text-slate-400">Depto:</span> <span class="font-bold text-fiery-navy">{{ modelValue.departamento }}</span></div>
      <div class="text-xs"><span class="text-slate-400">Municipio:</span> <span class="font-bold text-fiery-navy">{{ modelValue.municipio }}</span></div>
      <div v-if="modelValue.localidad" class="text-xs col-span-2"><span class="text-slate-400">Localidad:</span> <span class="font-bold text-fiery-navy">{{ modelValue.localidad }}</span></div>
      <div v-if="modelValue.direccion" class="text-xs col-span-2"><span class="text-slate-400">Dirección:</span> <span class="font-bold text-fiery-navy">{{ modelValue.direccion }}</span></div>
    </div>
  </div>
</template>
