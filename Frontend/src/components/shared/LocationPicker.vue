<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const mapContainer = ref(null)
const searchInput = ref(null)
let map = null
let marker = null
let autocomplete = null

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    const existing = document.querySelector('script[data-gmaps]')
    if (existing) { existing.addEventListener('load', resolve); return }
    const script = document.createElement('script')
    script.setAttribute('data-gmaps', '1')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const extractAddressComponents = (components) => {
  const get = (type) => components.find(c => c.types.includes(type))?.long_name || ''
  return {
    departamento: get('administrative_area_level_1'),
    municipio:    get('locality') || get('administrative_area_level_2'),
    localidad:    get('sublocality_level_1') || get('neighborhood') || get('administrative_area_level_3') || '',
    direccion:    [get('route'), get('street_number')].filter(Boolean).join(' ') || get('premise') || ''
  }
}

const reverseGeocode = (lat, lng) => {
  const geocoder = new window.google.maps.Geocoder()
  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const addr = extractAddressComponents(results[0].address_components)
      emit('update:modelValue', { lat, lng, ...addr })
    }
  })
}

onMounted(async () => {
  await loadGoogleMaps()

  const defaultCenter = { lat: 14.6349, lng: -90.5069 }
  const hasInitial = props.modelValue?.lat && props.modelValue?.lng
  const initialCenter = hasInitial
    ? { lat: Number(props.modelValue.lat), lng: Number(props.modelValue.lng) }
    : defaultCenter

  map = new window.google.maps.Map(mapContainer.value, {
    center: initialCenter,
    zoom: hasInitial ? 15 : 7,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER }
  })

  marker = new window.google.maps.Marker({
    position: initialCenter,
    map,
    draggable: !props.readonly,
    visible: hasInitial,
    animation: window.google.maps.Animation.DROP
  })

  if (!props.readonly) {
    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      reverseGeocode(pos.lat(), pos.lng())
    })

    map.addListener('click', (e) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      marker.setPosition({ lat, lng })
      marker.setVisible(true)
      reverseGeocode(lat, lng)
    })

    autocomplete = new window.google.maps.places.Autocomplete(searchInput.value, {
      componentRestrictions: { country: 'gt' },
      fields: ['geometry', 'address_components']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry) return
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      map.setCenter({ lat, lng })
      map.setZoom(16)
      marker.setPosition({ lat, lng })
      marker.setVisible(true)
      const addr = extractAddressComponents(place.address_components)
      emit('update:modelValue', { lat, lng, ...addr })
    })
  }
})

watch(() => props.modelValue, (val) => {
  if (!map || !marker || !val?.lat) return
  const pos = { lat: Number(val.lat), lng: Number(val.lng) }
  marker.setPosition(pos)
  marker.setVisible(true)
  map.panTo(pos)
}, { deep: true })
</script>

<template>
  <div class="space-y-3">
    <!-- Buscador (solo edición) -->
    <input
      v-if="!readonly"
      ref="searchInput"
      type="text"
      placeholder="Busca la dirección del negocio en Guatemala..."
      class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-fiery-navy font-bold focus:outline-none focus:border-fiery-red transition-all text-sm"
    />

    <!-- Mapa -->
    <div ref="mapContainer" class="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" :class="readonly ? 'h-56' : 'h-60'"></div>

    <!-- Resumen de ubicación -->
    <div v-if="modelValue?.departamento" class="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1">
      <div class="text-xs"><span class="text-slate-400">Depto:</span> <span class="font-bold text-fiery-navy">{{ modelValue.departamento }}</span></div>
      <div class="text-xs"><span class="text-slate-400">Municipio:</span> <span class="font-bold text-fiery-navy">{{ modelValue.municipio }}</span></div>
      <div v-if="modelValue.localidad" class="text-xs col-span-2"><span class="text-slate-400">Localidad:</span> <span class="font-bold text-fiery-navy">{{ modelValue.localidad }}</span></div>
      <div v-if="modelValue.direccion" class="text-xs col-span-2"><span class="text-slate-400">Dirección:</span> <span class="font-bold text-fiery-navy">{{ modelValue.direccion }}</span></div>
    </div>
    <p v-else-if="!readonly" class="text-xs text-slate-400 text-center">Haz clic en el mapa o busca la dirección para seleccionar la ubicación</p>
  </div>
</template>
