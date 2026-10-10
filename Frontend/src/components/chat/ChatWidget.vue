<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { sendChatMessage, trackChatClick } from '../../services/chatService'
import ChapiBot from './ChapiBot.vue'
import { swingScene, kiteScene, volcanoScene, lateScene } from './chapiScenes'

const props = defineProps({
  // 'directorio' | 'negocio' | 'coach'
  mode: { type: String, default: 'directorio' },
  businessId: { type: [Number, String], default: null },
  title: { type: String, default: 'Chapi' },
  subtitle: { type: String, default: 'Asistente del directorio' },
  greeting: { type: String, default: 'Hola, soy Chapi. ¿Qué andás buscando hoy en Chiquimula?' },
  suggestions: { type: Array, default: () => [] },
  buttonLabel: { type: String, default: 'Pregúntale a Chapi' },
  // Foto que reemplaza a Chapi (logo del negocio en modo negocio)
  avatar: { type: String, default: '' },
  // Burbuja que aparece una vez por sesión junto al botón flotante
  teaser: { type: String, default: '' },
  // Entrada animada: frases que Chapi "escribe" en el botón (la última se queda).
  // Puede ser una lista para todas las entradas o un objeto por entrada: { late, swing, kite, volcano, default }
  introLines: { type: [Array, Object], default: () => [] }
})

const TYPING_LABELS = {
  directorio: ['Buscando en el directorio', 'Revisando negocios', 'Comparando horarios'],
  negocio: ['Revisando el catálogo', 'Consultando la información del negocio'],
  coach: ['Revisando tus estadísticas', 'Analizando tu perfil', 'Preparando recomendaciones']
}

const SUGGESTION_LABEL = {
  descripcion: 'Descripción sugerida',
  producto: 'Producto',
  horario: 'Horario',
  fotos: 'Fotos',
  redes: 'Redes sociales',
  respuesta_resena: 'Respuesta a reseña',
  general: 'Sugerencia'
}

const isOpen = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const scroller = ref(null)
const textarea = ref(null)
const copiedId = ref(null)
const showTeaser = ref(false)
const typingIndex = ref(0)
let typingTimer = null
let teaserTimer = null

// ── Estado de ánimo de Chapi ───────────────────────────────
const reaction = ref('')        // reacción temporal: wave, happy, confused, sad
const userTyping = ref(false)
const sleeping = ref(false)
let reactionTimer = null
let userTypingTimer = null
let sleepTimer = null

const botState = computed(() => {
  if (reaction.value) return reaction.value
  if (loading.value) return 'thinking'
  if (userTyping.value) return 'watching'
  if (sleeping.value) return 'sleep'
  return 'idle'
})

const react = (name, ms = 2600) => {
  clearTimeout(reactionTimer)
  reaction.value = name
  reactionTimer = setTimeout(() => { reaction.value = '' }, ms)
}

// Se duerme tras 45 s sin actividad con el chat abierto
const wake = () => {
  sleeping.value = false
  clearTimeout(sleepTimer)
  sleepTimer = setTimeout(() => { if (isOpen.value && !loading.value) sleeping.value = true }, 45000)
}

watch(input, (value) => {
  wake()
  clearTimeout(userTypingTimer)
  userTyping.value = value.trim().length > 0
  if (userTyping.value) userTypingTimer = setTimeout(() => { userTyping.value = false }, 1600)
})

const typingLabels = computed(() => TYPING_LABELS[props.mode] || TYPING_LABELS.directorio)
const STATUS_TEXT = {
  thinking: 'Pensando…',
  watching: 'Leyendo lo que escribes…',
  sleep: 'Tomando una siesta',
  happy: '¡Listo!',
  surprised: '¡Ay! Me asustaste',
  giggle: '¡Jaja, cosquillas!',
  dance: '¡A bailar!',
  love: 'Yo también te quiero',
  spin: '¡Wiii!',
  dizzy: 'Me estás mareando…',
  bow: '¡Con mucho gusto!',
  covered: '¡Te escucho, no grités!',
  marimba: '¡Que suene la marimba!',
  eating: '¡Qué rico se ve!',
  knitting: 'Tejiendo ideas…',
  coffee: 'Con cafecito todo sale mejor',
  mirror: '¡Qué guapo me veo!',
  map: 'Te marco la ruta',
  send: '¡Mensaje en camino!'
}

// Cada toque provoca una reacción distinta; muchos toques seguidos lo marean
const POKE_REACTIONS = [['surprised', 1100], ['giggle', 1600], ['dance', 2600], ['love', 2200], ['spin', 1100]]
let pokeIndex = 0
let pokeStreak = 0
let pokeStreakTimer = null

const poke = () => {
  wake()
  // Mientras está mareado no reacciona a más toques
  if (reaction.value === 'dizzy') return
  clearTimeout(pokeStreakTimer)
  pokeStreak++
  pokeStreakTimer = setTimeout(() => { pokeStreak = 0 }, 1400)
  if (pokeStreak >= 6) {
    pokeStreak = 0
    react('dizzy', 3200)
    return
  }
  const [name, ms] = POKE_REACTIONS[pokeIndex % POKE_REACTIONS.length]
  pokeIndex++
  react(name, ms)
}
const statusText = computed(() => STATUS_TEXT[botState.value] || props.subtitle)
const canSend = computed(() => input.value.trim().length > 0 && !loading.value)
const storageKey = computed(() => `chat:${props.mode}:${props.businessId ?? 'general'}`)

// ── Entrada animada: Chapi llega a la bolita con una escena ──
const INTRO_KEY = 'chapi-intro'
const launcherAvatar = ref(null)
const introPhase = ref('done')   // waiting | scene | landed | done
const typed = ref('')
const typingCaret = ref(false)
let introTimers = []
let introCancelled = false
let sceneEls = []
const introHeadState = ref('idle')
const rumbling = ref(false)
const masked = ref(false)
const unmasking = ref(false)

// Chapi actor: el dibujo que mueven las escenas cuadro por cuadro
const actor = ref({ on: false, state: 'idle', hero: false, carry: false })
const actorEl = ref(null)

const linesFor = (style) => {
  const lines = props.introLines
  if (Array.isArray(lines)) return lines
  return lines[style] || lines.default || []
}
const hasIntro = computed(() => Object.keys(props.introLines).length > 0)
const launcherText = computed(() => (hasIntro.value ? typed.value : props.buttonLabel))
const showLauncherHead = computed(() => introPhase.value === 'landed' || introPhase.value === 'done')

const wait = (ms) => new Promise(resolve => introTimers.push(setTimeout(resolve, ms)))

const stopIntro = () => {
  introCancelled = true
  introTimers.forEach(clearTimeout)
  introTimers = []
  sceneEls.forEach(el => el.remove())
  sceneEls = []
  actor.value.on = false
}

const finishIntro = () => {
  stopIntro()
  masked.value = false
  unmasking.value = false
  rumbling.value = false
  introHeadState.value = 'idle'
  introPhase.value = 'done'
  typed.value = linesFor('default').at(-1) || ''
  typingCaret.value = false
  try { sessionStorage.setItem(INTRO_KEY, '1') } catch { /* sin storage */ }
}

const typeText = async (text, speed = 28) => {
  for (const ch of text) {
    if (introCancelled) return
    typed.value += ch
    await wait(speed)
  }
}

const eraseText = async (speed = 14) => {
  while (typed.value.length && !introCancelled) {
    typed.value = typed.value.slice(0, -1)
    await wait(speed)
  }
}

// Cada sesión nueva muestra la siguiente entrada. Con ?chapi=barrilete|volcan|heroe|tarde se fuerza una.
const INTRO_STYLES = ['kite', 'volcano', 'swing', 'late']
const INTRO_ALIASES = { barrilete: 'kite', volcan: 'volcano', 'volcán': 'volcano', heroe: 'swing', 'héroe': 'swing', tarde: 'late' }

const pickIntroStyle = () => {
  const forced = new URLSearchParams(window.location.search).get('chapi')?.toLowerCase()
  if (forced && (INTRO_ALIASES[forced] || INTRO_STYLES.includes(forced))) return INTRO_ALIASES[forced] || forced
  let turn = 0
  try { turn = Number(localStorage.getItem('chapi-intro-turn')) || 0 } catch { /* sin storage */ }
  try { localStorage.setItem('chapi-intro-turn', String(turn + 1)) } catch { /* sin storage */ }
  return INTRO_STYLES[turn % INTRO_STYLES.length]
}

// Ejecuta una escena de chapiScenes.js con el actor y la bolita
const playScene = async (scene, cx, cy) => {
  actor.value = { on: true, state: 'idle', hero: false, carry: false }
  introPhase.value = 'scene'
  await nextTick()
  if (!actorEl.value) return false
  let ok = false
  try {
    ok = await scene({
      actor: actorEl.value,
      cx,
      cy,
      cancelled: () => introCancelled,
      track: (el) => sceneEls.push(el),
      setActor: (patch) => Object.assign(actor.value, patch),
      setRumble: (on) => { rumbling.value = on },
      land: () => bounceLauncher()
    })
  } catch { ok = false }
  actor.value.on = false
  rumbling.value = false
  return ok && !introCancelled
}

const runIntro = async () => {
  introCancelled = false
  introPhase.value = 'waiting'
  typed.value = ''
  await nextTick()
  await wait(900)
  const rect = launcherAvatar.value?.getBoundingClientRect()
  if (introCancelled) return
  if (!rect) return finishIntro()

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const style = pickIntroStyle()
  const scene = { swing: swingScene, kite: kiteScene, volcano: volcanoScene, late: lateScene }[style]
  const arrived = await playScene(scene, cx, cy)
  if (introCancelled) return
  if (!arrived) return finishIntro()

  // Ya en la bolita; si llegó de superhéroe, se quita la máscara
  masked.value = style === 'swing'
  introPhase.value = 'landed'
  if (masked.value) {
    await wait(800)
    unmasking.value = true
    await wait(800)
    masked.value = false
    unmasking.value = false
  } else if (style === 'volcano') {
    // Quedó mareado de tanta vuelta
    introHeadState.value = 'dizzy'
    await wait(1500)
    introHeadState.value = 'idle'
  } else {
    await wait(550)
  }

  typingCaret.value = true
  const lines = linesFor(style)
  for (let i = 0; i < lines.length && !introCancelled; i++) {
    await typeText(lines[i])
    if (i < lines.length - 1) {
      await wait(900)
      await eraseText()
      await wait(180)
    }
  }
  if (introCancelled) return
  await wait(1800)
  finishIntro()
}

// ── Historial por pestaña ──────────────────────────────────
const loadHistory = () => {
  try {
    const saved = sessionStorage.getItem(storageKey.value)
    messages.value = saved ? JSON.parse(saved) : []
  } catch {
    messages.value = []
  }
}

const saveHistory = () => {
  try {
    const clean = messages.value.slice(-30).map(({ fresh, ...m }) => m)
    sessionStorage.setItem(storageKey.value, JSON.stringify(clean))
  } catch { /* storage lleno o bloqueado */ }
}

watch(storageKey, loadHistory, { immediate: true })

// ── Mirada que sigue el cursor ─────────────────────────────
const look = ref({ x: 0, y: 0 })
const headerBot = ref(null)
let pointerFrame = 0
let lastPointer = null
let lookResetTimer = null

const setLookTowards = (clientX, clientY) => {
  const el = isOpen.value ? headerBot.value : launcherAvatar.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const dx = clientX - (r.left + r.width / 2)
  const dy = clientY - (r.top + r.height * (isOpen.value ? 0.4 : 0.5))
  const dist = Math.hypot(dx, dy) || 1
  const k = Math.min(1, dist / 160) * 2.6
  look.value = { x: +(dx / dist * k).toFixed(2), y: +(dy / dist * k * 0.8).toFixed(2) }
}

const onPointerMove = (e) => {
  activity()
  lastPointer = e
  if (pointerFrame) return
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0
    if (lastPointer) setLookTowards(lastPointer.clientX, lastPointer.clientY)
  })
}

// Mira un momento hacia arriba o hacia abajo (por ejemplo, al hacer scroll)
const glance = (x, y, ms = 700) => {
  look.value = { x, y }
  clearTimeout(lookResetTimer)
  lookResetTimer = setTimeout(() => { look.value = { x: 0, y: 0 } }, ms)
}

// ── Scroll: al bajar, el chat se esconde y el botón se enrolla en la bolita ──
const collapsed = ref(false)
const rolling = ref('')
let lastScrollY = 0
let scrollFrame = 0
let rollTimer = null

const roll = (direction) => {
  rolling.value = direction
  clearTimeout(rollTimer)
  rollTimer = setTimeout(() => { rolling.value = '' }, 700)
}

const onScroll = () => {
  activity()
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    const y = window.scrollY
    const delta = y - lastScrollY
    if (Math.abs(delta) < 6) return
    lastScrollY = y
    if (delta > 0 && y > 80) {
      if (isOpen.value) close()
      if (!collapsed.value) { collapsed.value = true; roll('in') }
      glance(0, 2.4)
    } else if (delta < 0) {
      if (collapsed.value) { collapsed.value = false; roll('out') }
      glance(0, -2.4)
    }
  })
}

// ── Estado de la cabeza de Chapi en la bolita ──────────────
const launcherHeadState = ref('idle')
const launcherHeadHidden = ref(false)
const catching = ref(false)
let launcherStateTimer = null

const launcherReact = (state, ms = 2000) => {
  clearTimeout(launcherStateTimer)
  launcherHeadState.value = state
  launcherStateTimer = setTimeout(() => { launcherHeadState.value = 'idle' }, ms)
}
const launcherBotState = computed(() => (introHeadState.value !== 'idle' ? introHeadState.value : launcherHeadState.value))
const bounceLauncher = () => {
  catching.value = true
  setTimeout(() => { catching.value = false }, 650)
}

// ── Página sin actividad: bosteza ──────────────────────────
let idleTimer = null
let yawns = 0
const activity = () => {
  clearTimeout(idleTimer)
  if (yawns >= 3) return
  idleTimer = setTimeout(() => {
    if (isOpen.value || introPhase.value !== 'done') return activity()
    yawns++
    launcherReact('yawn', 1900)
    bounceLauncher()
    activity()
  }, 30000)
}

// ── Intención de salida: el cursor se va por arriba de la ventana ──
const teaserText = ref('')
const EXIT_KEY = 'chapi-exit'
const onMouseOut = (e) => {
  if (e.relatedTarget || e.clientY > 0 || isOpen.value || introPhase.value !== 'done') return
  try { if (sessionStorage.getItem(EXIT_KEY) === '1') return; sessionStorage.setItem(EXIT_KEY, '1') } catch { /* sin storage */ }
  teaserText.value = '¡Espera! ¿Te ayudo a encontrar algo antes de irte?'
  showTeaser.value = true
  launcherReact('surprised', 1600)
  bounceLauncher()
  clearTimeout(teaserTimer)
  teaserTimer = setTimeout(() => { showTeaser.value = false }, 7000)
}

// ── Accesorios según la fecha y la hora de Guatemala ──────
// Con ?chapi-tema=navidad|independencia|semanasanta|muertos|noche|manana se fuerza uno
const easterSunday = (year) => {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

const THEMES = {
  navidad: { hat: 'santa' },
  independencia: { hold: 'torch' },
  semanasanta: { carpet: true },
  muertos: { kite: true },
  noche: { hat: 'nightcap', night: true },
  manana: { hold: 'coffee' }
}

const accessory = computed(() => {
  const forced = new URLSearchParams(window.location.search).get('chapi-tema')?.toLowerCase()
  if (forced && THEMES[forced]) return THEMES[forced]
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guatemala', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23'
  }).formatToParts(new Date()).map(x => [x.type, Number(x.value)]))
  const { year, month, day, hour } = parts
  const today = Date.UTC(year, month - 1, day)
  const easter = easterSunday(year).getTime()
  if (month === 9 && (day === 14 || day === 15)) return THEMES.independencia
  if (month === 12) return THEMES.navidad
  if ((month === 10 && day === 31) || (month === 11 && day <= 2)) return THEMES.muertos
  if (today >= easter - 7 * 86400000 && today <= easter) return THEMES.semanasanta
  if (hour >= 19 || hour < 6) return THEMES.noche
  if (hour >= 6 && hour < 10) return THEMES.manana
  return {}
})

// ── Cielo del encabezado según la hora (o ?chapi-cielo=amanecer|dia|atardecer|noche) ──
const SKIES = {
  amanecer: ['#f4a76b', '#b8607a', '#003049'],
  dia: ['#8fd3ff', '#56aee6', '#2f86c4'],
  atardecer: ['#f08a4b', '#8e3f6c', '#003049'],
  noche: ['#020d18', '#012036', '#003049']
}
const sky = computed(() => {
  const params = new URLSearchParams(window.location.search)
  const forced = params.get('chapi-cielo')?.toLowerCase()
  if (forced && SKIES[forced]) return forced
  if (params.get('chapi-tema') === 'noche') return 'noche'
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guatemala', hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  if (hour >= 5 && hour < 7) return 'amanecer'
  if (hour >= 7 && hour < 17) return 'dia'
  if (hour >= 17 && hour < 19) return 'atardecer'
  return 'noche'
})
const skyStyle = computed(() => {
  const [top, mid, bottom] = SKIES[sky.value]
  return { background: `linear-gradient(180deg, ${top} 0%, ${mid} 52%, ${bottom} 100%)` }
})
// Colores del paisaje: de día el pueblo y los cerros se ven con su color; el resto, en silueta
const LANDS = {
  dia: { volcano: '#7ea9c9', volcanoOp: 0.95, hills: '#4f8f5c', hillsOp: 1, town: '#f6ecdb', roof: '#b5482f', church: '#fbf4e8', legible: 0.38, clouds: 0.85 },
  amanecer: { volcano: '#2a5b7c', volcanoOp: 0.55, hills: '#0f3a57', hillsOp: 0.85, town: '#0a2c44', roof: '#4a1d1a', church: '#0a2c44', legible: 0.6, clouds: 0.24 },
  atardecer: { volcano: '#2a5b7c', volcanoOp: 0.55, hills: '#0f3a57', hillsOp: 0.85, town: '#0a2c44', roof: '#4a1d1a', church: '#0a2c44', legible: 0.6, clouds: 0.24 },
  noche: { volcano: '#2a5b7c', volcanoOp: 0.55, hills: '#0f3a57', hillsOp: 0.85, town: '#0a2c44', roof: '#4a1d1a', church: '#0a2c44', legible: 0.6, clouds: 0.07 }
}
const land = computed(() => LANDS[sky.value])

const STARS = [[18, 14, 1.1], [52, 30, 0.8], [96, 10, 1.2], [140, 26, 0.9], [176, 8, 1], [212, 34, 0.8], [282, 14, 1.2], [318, 32, 0.9], [366, 12, 1.1], [394, 40, 0.8], [124, 44, 0.7], [248, 50, 0.8]]
const cloudPath = 'M0 22 a13 13 0 0 1 20 -11 a17 17 0 0 1 32 3 a12 12 0 0 1 6 23 h-52 a9 9 0 0 1 -6 -15z'

// ── Transición de Chapi entre la bolita y el encabezado ────
const transit = ref({ on: false, style: {}, state: 'happy' })
const transitEl = ref(null)
const headerBotHidden = ref(false)
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const calmMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const flyBetween = async (from, to, kind) => {
  const box = kind === 'open' ? to : from
  transit.value = {
    on: true,
    state: kind === 'open' ? 'happy' : 'wave',
    style: { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }
  }
  await nextTick()
  if (!transitEl.value) return
  const dx = (kind === 'open' ? from : to).left + (kind === 'open' ? from : to).width / 2 - (box.left + box.width / 2)
  const dy = (kind === 'open' ? from : to).top + (kind === 'open' ? from : to).height / 2 - (box.top + box.height / 2)
  const frames = kind === 'open'
    ? [
        { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) rotate(-15deg) scale(0.85)`, opacity: 1, offset: 0.55, easing: 'cubic-bezier(0.5, 0, 0.7, 1)' },
        { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 }
      ]
    : [
        { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1, easing: 'ease-out' },
        { transform: 'translate(0px, -10px) rotate(0deg) scale(1)', opacity: 1, offset: 0.4, easing: 'cubic-bezier(0.55, 0, 0.85, 0.35)' },
        { transform: `translate(${dx}px, ${dy}px) rotate(200deg) scale(0.3)`, opacity: 0 }
      ]
  try { await transitEl.value.animate(frames, { duration: kind === 'open' ? 750 : 1200, fill: 'forwards' }).finished } catch { /* cancelado */ }
  transit.value = { on: false, style: {}, state: 'idle' }
}

// ── Palabras clave en el mensaje del usuario ───────────────
const KEYWORDS = [
  [/\b(hola|holi|buenas|buenos d[ií]as|buenas tardes|buenas noches|qu[eé] onda|saludos)\b/i, 'wave'],
  [/\b(gracias|muchas gracias|te lo agradezco)\b/i, 'bow'],
  [/\b(ja){2,}|\bjeje|\bxd\b|\blol\b|\bchiste\b/i, 'giggle'],
  [/\bte (quiero|amo)\b/i, 'love']
]
const isShouting = (text) => /!{3,}/.test(text) || (/[A-ZÁÉÍÓÚÑ]{4,}/.test(text) && text === text.toUpperCase())
const keywordReaction = (text) => {
  if (isShouting(text)) return 'covered'
  return KEYWORDS.find(([re]) => re.test(text))?.[1] || ''
}

// Reacción según la categoría del negocio que encontró
const categoryReaction = (cards) => {
  const cat = (cards?.[0]?.categoria || '').toLowerCase()
  if (/caf[eé]/.test(cat)) return 'coffee'
  if (/gastronom|comida|comedor|restaur|snack|panader|reposter|bebida|antoj/.test(cat)) return 'eating'
  if (/artesan|tej|croch/.test(cat)) return 'knitting'
  if (/belleza|est[eé]tica|bisuter|maquill|ropa|moda/.test(cat)) return 'mirror'
  return 'happy'
}

const onCardClick = (businessId, tipo) => {
  trackChatClick(businessId, tipo)
  react(tipo === 'maps' ? 'map' : 'send', 2200)
}

// ── Abrir / cerrar ─────────────────────────────────────────
const scrollToBottom = async () => {
  await nextTick()
  if (scroller.value) scroller.value.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
}

const open = async () => {
  if (introPhase.value !== 'done') finishIntro()
  const from = launcherAvatar.value?.getBoundingClientRect()
  const jump = !!from && !props.avatar && !calmMotion()
  headerBotHidden.value = jump
  isOpen.value = true
  collapsed.value = false
  dismissTeaser()
  wake()
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  // En celular no abrimos el teclado de golpe
  if (window.matchMedia('(min-width: 640px)').matches) textarea.value?.focus()
  if (jump) {
    // Chapi salta de la bolita al encabezado cuando el panel termina de abrir
    await pause(430)
    const to = headerBot.value?.getBoundingClientRect()
    if (to && isOpen.value) await flyBetween(from, to, 'open')
    headerBotHidden.value = false
  }
  react('wave', 2400)
}

const close = async () => {
  if (!isOpen.value) return
  const from = headerBot.value?.getBoundingClientRect()
  const dive = !!from && !props.avatar && !calmMotion()
  isOpen.value = false
  clearTimeout(sleepTimer)
  sleeping.value = false
  if (!dive) return
  // Se despide con la mano y se clava de cabeza en la bolita
  launcherHeadHidden.value = true
  await nextTick()
  await pause(150)
  const to = launcherAvatar.value?.getBoundingClientRect()
  if (to) await flyBetween(from, to, 'close')
  launcherHeadHidden.value = false
  bounceLauncher()
}

const onKeydown = (e) => { if (e.key === 'Escape' && isOpen.value) close() }

// ── Burbuja de bienvenida (una vez por sesión) ─────────────
const teaserKey = computed(() => `chat-teaser:${props.mode}`)

const dismissTeaser = () => {
  showTeaser.value = false
  clearTimeout(teaserTimer)
  try { sessionStorage.setItem(teaserKey.value, '1') } catch { /* sin storage */ }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('mouseout', onMouseOut)
  lastScrollY = window.scrollY
  activity()
  if (hasIntro.value) {
    let seen = false
    try { seen = sessionStorage.getItem(INTRO_KEY) === '1' } catch { /* sin storage */ }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (seen || calm) finishIntro()
    else runIntro()
  }
  if (!props.teaser || messages.value.length) return
  let seen = false
  try { seen = sessionStorage.getItem(teaserKey.value) === '1' } catch { /* sin storage */ }
  if (!seen) teaserTimer = setTimeout(() => { if (!isOpen.value) showTeaser.value = true }, 3500)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('mouseout', onMouseOut)
  cancelAnimationFrame(pointerFrame)
  cancelAnimationFrame(scrollFrame)
  clearTimeout(idleTimer)
  clearTimeout(lookResetTimer)
  clearTimeout(rollTimer)
  clearTimeout(launcherStateTimer)
  clearTimeout(teaserTimer)
  clearInterval(typingTimer)
  clearTimeout(reactionTimer)
  clearTimeout(userTypingTimer)
  clearTimeout(sleepTimer)
  clearTimeout(pokeStreakTimer)
  stopIntro()
})

// ── Indicador "escribiendo" con texto que cambia ───────────
watch(loading, (isLoading) => {
  clearInterval(typingTimer)
  typingIndex.value = 0
  if (isLoading) {
    typingTimer = setInterval(() => {
      typingIndex.value = (typingIndex.value + 1) % typingLabels.value.length
    }, 1800)
  }
})

// ── Enviar ─────────────────────────────────────────────────
const autoGrow = () => {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

const request = async ({ keepReaction = false } = {}) => {
  if (!keepReaction) reaction.value = ''
  userTyping.value = false
  wake()
  loading.value = true
  scrollToBottom()
  try {
    const history = messages.value.filter(m => !m.error)
    const data = await sendChatMessage({ mode: props.mode, messages: history, businessId: props.businessId })
    const reply = data.reply || 'No tengo una respuesta para eso. ¿Lo puedes preguntar de otra forma?'
    messages.value.push({ role: 'assistant', content: reply, cards: data.cards || [], actions: data.actions || [], fresh: true })
    if (data.actions?.some(a => a.type === 'whatsapp')) react('send', 2400)
    else if (data.cards?.length) react(categoryReaction(data.cards), 3000)
    else if (data.actions?.length) react('happy', 2800)
    else if (/no (encontr|tengo|hay|pude)|lo siento/i.test(reply)) react('confused', 3200)
  } catch (err) {
    const content = err.response?.status === 429
      ? 'Enviaste muchos mensajes seguidos. Espera un momento y vuelve a intentar.'
      : err.response?.data?.error || 'No pude conectarme. Revisa tu conexión e intenta de nuevo.'
    messages.value.push({ role: 'assistant', content, error: true, fresh: true })
    react('sad', 3500)
  } finally {
    loading.value = false
    saveHistory()
    scrollToBottom()
  }
}

const send = async (text) => {
  const content = (text ?? input.value).trim()
  if (!content || loading.value) return
  input.value = ''
  nextTick(autoGrow)
  messages.value.push({ role: 'user', content, fresh: true })

  // Código secreto: Chapi baila con marimba sin consultar a la IA
  if (/^\s*chapi,?\s+baila\b/i.test(content)) {
    messages.value.push({ role: 'assistant', content: '¡Que suene la marimba! ♪ Cuando quieras seguimos buscando negocios.', fresh: true })
    saveHistory()
    scrollToBottom()
    react('marimba', 5000)
    return
  }

  const kw = keywordReaction(content)
  if (kw) react(kw, 1500)
  await request({ keepReaction: !!kw })
}

const retry = async () => {
  if (loading.value) return
  messages.value = messages.value.filter(m => !m.error)
  await request()
}

const reset = () => {
  messages.value = []
  saveHistory()
  textarea.value?.focus()
}

const onEnter = (e) => {
  if (e.shiftKey || e.isComposing) return
  e.preventDefault()
  send()
}

const copy = async (text, id) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    react('happy', 1800)
    setTimeout(() => { if (copiedId.value === id) copiedId.value = null }, 1800)
  } catch { /* clipboard no disponible */ }
}

// Formato mínimo y seguro: escapa HTML y luego aplica **negritas**, listas y saltos de línea
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const format = (text) => escapeHtml(text || '')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/^\s*[-•*]\s+(.*)$/gm, '<span class="chat-li">$1</span>')
  .replace(/\n{2,}/g, '<br>')
  .replace(/\n/g, '<br>')
</script>

<template>
  <div class="chat-root">
    <!-- Burbuja de bienvenida -->
    <Transition name="teaser">
      <div v-if="showTeaser && !isOpen"
        class="fixed bottom-[5.25rem] right-4 sm:right-6 z-[199] w-[min(18rem,calc(100vw-2rem))]">
        <button type="button" @click="open"
          class="teaser-bubble w-full text-left bg-white rounded-2xl rounded-br-md px-4 py-3 pr-9 text-sm text-fiery-navy">
          {{ teaserText || teaser }}
        </button>
        <button type="button" @click="dismissTeaser" aria-label="Cerrar mensaje"
          class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-fiery-navy hover:bg-slate-100 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </Transition>

    <!-- Chapi durante las escenas de entrada -->
    <div v-if="actor.on" ref="actorEl" class="chapi-actor" aria-hidden="true">
      <ChapiBot :state="actor.state" :hero="actor.hero" :carry="actor.carry" :accessory="accessory" />
    </div>

    <!-- Chapi saltando entre la bolita y el encabezado del chat -->
    <div v-if="transit.on" ref="transitEl" class="fixed z-[202] pointer-events-none" :style="transit.style" aria-hidden="true">
      <ChapiBot :state="transit.state" :accessory="accessory" />
    </div>

    <!-- Botón flotante -->
    <Transition name="launcher">
      <button v-if="!isOpen" type="button" @click="open"
        class="launcher fixed bottom-5 right-4 sm:right-6 z-[200] flex items-center rounded-full bg-fiery-navy text-white"
        :class="[launcherText && !collapsed ? 'gap-3 pl-1.5 pr-5 py-1.5' : 'gap-0 p-1.5', { 'is-collapsed': collapsed }]"
        :aria-label="`Abrir ${title}`">
        <span ref="launcherAvatar"
          class="launcher-avatar relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-fiery-red"
          :class="{ 'is-catching': introPhase === 'landed' || catching, 'no-nudge': hasIntro, 'is-rumbling': rumbling, 'is-roll-in': rolling === 'in', 'is-roll-out': rolling === 'out' }">
          <img v-if="avatar" :src="avatar" alt="" class="w-full h-full object-cover" />
          <Transition v-else name="head-pop">
            <span v-if="showLauncherHead && !launcherHeadHidden" class="w-9 h-9 mt-1"><ChapiBot variant="head" :hero="masked" :unmask="unmasking" :state="launcherBotState" :look="look" :accessory="accessory" /></span>
          </Transition>
        </span>
        <span v-if="launcherText" class="launcher-label text-sm font-bold whitespace-nowrap" aria-live="polite">
          {{ launcherText }}<span v-if="typingCaret" class="caret" aria-hidden="true"></span>
        </span>
      </button>
    </Transition>

    <!-- Panel -->
    <Transition name="panel">
      <section v-if="isOpen" role="dialog" :aria-label="title"
        class="panel fixed z-[200] inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[408px] sm:h-[min(660px,calc(100dvh-3rem))] flex flex-col bg-fiery-navy sm:rounded-[28px] overflow-hidden">

        <!-- Encabezado -->
        <header class="header relative overflow-hidden text-white px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[14px]" :style="skyStyle">
          <!-- Paisaje: cielo según la hora, volcanes, cerros y un pueblo en silueta -->
          <svg class="sky absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 408 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
              <linearGradient id="sky-legible" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stop-color="#003049" :stop-opacity="land.legible" /><stop offset="0.62" stop-color="#003049" stop-opacity="0" />
              </linearGradient>
              <radialGradient id="sky-glow" cx="0.62" cy="0.3" r="0.5">
                <stop offset="0" stop-color="#FDF0D5" stop-opacity="0.35" /><stop offset="1" stop-color="#FDF0D5" stop-opacity="0" />
              </radialGradient>
            </defs>
            <rect class="sky-breath" width="408" height="110" fill="url(#sky-glow)" />
            <g v-if="sky === 'noche'" fill="#FDF0D5">
              <circle v-for="(st, n) in STARS" :key="n" class="sky-star" :cx="st[0]" :cy="st[1]" :r="st[2]" :style="{ animationDelay: `${(n * 0.37) % 2.4}s` }" />
            </g>
            <path v-if="sky === 'noche'" d="M252 12 a11 11 0 1 0 11 16 a8.5 8.5 0 1 1 -11 -16z" fill="#FDF0D5" />
            <g v-else-if="sky === 'dia'">
              <circle class="sky-sun" cx="252" cy="24" r="26" fill="#FFE27A" opacity="0.3" />
              <circle cx="252" cy="24" r="12" fill="#FFD84D" />
              <g class="sky-birds" fill="none" stroke="#1d4f73" stroke-width="1.3" stroke-linecap="round" opacity="0.7">
                <path d="M150 20 q3 -3 6 0 q3 -3 6 0" /><path d="M166 30 q2.4 -2.4 4.8 0 q2.4 -2.4 4.8 0" />
              </g>
            </g>
            <g v-else>
              <circle cx="246" cy="80" r="30" fill="#F2B33D" opacity="0.25" /><circle cx="246" cy="80" r="17" fill="#F2B33D" opacity="0.95" />
            </g>
            <g fill="#ffffff" :opacity="land.clouds">
              <path class="sky-cloud" :d="cloudPath" style="animation-delay: -10s" transform="translate(0 14) scale(0.7)" />
              <path class="sky-cloud" :d="cloudPath" style="animation-delay: -42s; animation-duration: 95s" transform="translate(0 40) scale(0.5)" />
            </g>
            <path d="M150 110 L222 50 Q229 45 236 50 L312 110Z" :fill="land.volcano" :opacity="land.volcanoOp" />
            <path d="M252 110 L318 62 Q324 58 330 62 L408 102 V110Z" :fill="land.volcano" :opacity="land.volcanoOp * 0.85" />
            <g fill="#c9c4cc" opacity="0.5">
              <circle class="sky-smoke" cx="229" cy="45" r="3" /><circle class="sky-smoke" cx="229" cy="45" r="2.4" style="animation-delay: 1.6s" />
            </g>
            <path d="M0 110 V93 Q60 82 120 91 T240 87 T408 85 V110Z" :fill="land.hills" :opacity="land.hillsOp" />
            <g :fill="land.town">
              <rect x="236" y="95" width="24" height="15" /><path d="M233 95 L248 86 L263 95Z" :fill="land.roof" />
              <rect x="322" y="93" width="26" height="17" /><path d="M319 93 L335 84 L351 93Z" :fill="land.roof" />
              <rect x="354" y="96" width="22" height="14" /><path d="M351 96 L365 88 L379 96Z" :fill="land.roof" />
            </g>
            <g :fill="land.church">
              <rect x="268" y="70" width="10" height="40" /><path d="M267 71 L273 62 L279 71Z" :fill="sky === 'dia' ? land.roof : land.church" />
              <rect x="272.4" y="55" width="1.4" height="8" /><rect x="270" y="57.4" width="6.2" height="1.4" />
              <rect x="278" y="84" width="38" height="26" /><path d="M278 84 Q297 74 316 84Z" />
            </g>
            <g v-if="sky === 'dia'" fill="#5b4636" opacity="0.75">
              <path d="M293 110 v-10 a4 4 0 0 1 8 0 v10z" /><rect x="244" y="101" width="5" height="9" rx="1" /><rect x="331" y="100" width="6" height="10" rx="1" />
              <rect x="271" y="76" width="4" height="6" rx="2" />
            </g>
            <g v-if="sky === 'noche' || sky === 'atardecer'" fill="#F2B33D" opacity="0.8">
              <rect x="271" y="76" width="4" height="5" rx="1" /><rect x="292" y="94" width="4" height="5" rx="1" /><rect x="331" y="99" width="4" height="4" rx="1" />
            </g>
            <rect width="408" height="110" fill="url(#sky-legible)" />
          </svg>
          <div class="relative z-[1] flex items-end gap-3">
            <div v-if="avatar" class="avatar-logo w-12 h-12 mb-1.5 rounded-full overflow-hidden shrink-0">
              <img :src="avatar" alt="" class="w-full h-full object-cover" />
            </div>
            <div v-else ref="headerBot" class="w-[66px] h-[80px] -mb-[12px] -ml-1 shrink-0" :class="{ 'opacity-0': headerBotHidden }">
              <button type="button" @click="poke" class="chapi-poke block w-full h-full" aria-label="Tocar a Chapi">
                <ChapiBot :state="botState" :look="look" :accessory="accessory" />
              </button>
            </div>
            <div class="flex-1 min-w-0 pb-2">
              <p class="header-text font-extrabold text-[17px] leading-tight tracking-tight truncate">{{ title }}</p>
              <p class="header-text text-[13px] text-white/75 truncate mt-0.5">
                <Transition name="label" mode="out-in">
                  <span :key="statusText">{{ statusText }}</span>
                </Transition>
              </p>
            </div>
            <div class="flex items-center gap-1.5 pb-2">
              <button v-if="messages.length" type="button" @click="reset" title="Nueva conversación" aria-label="Nueva conversación"
                class="icon-btn w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.08] text-white/80 hover:text-white hover:bg-white/15">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
              </button>
              <button type="button" @click="close" aria-label="Cerrar chat"
                class="icon-btn w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.08] text-white/80 hover:text-white hover:bg-white/15">
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
              </button>
            </div>
          </div>
          <!-- Franja bordada como la de un huipil -->
          <div class="textile absolute left-0 right-0 bottom-0 h-[10px]" aria-hidden="true"></div>
        </header>

        <!-- Conversación y caja de texto -->
        <div class="relative flex-1 min-h-0 flex flex-col bg-[#f5f6f8]">
        <!-- Conversación -->
        <div ref="scroller" class="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-3">
          <!-- Bienvenida -->
          <div class="flex items-end gap-2 mb-4">
            <div class="mini-avatar"><img v-if="avatar" :src="avatar" alt="" /><ChapiBot v-else variant="head" :animated="false" class="mini-bot" /></div>
            <div class="bubble-bot">{{ greeting }}</div>
          </div>

          <div v-if="!messages.length && suggestions.length" class="pl-9 grid gap-2">
            <button v-for="(s, i) in suggestions" :key="s" type="button" @click="send(s)"
              class="chip group" :style="{ '--i': i }">
              <span>{{ s }}</span>
              <svg class="w-4 h-4 shrink-0 text-fiery-red transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            </button>
          </div>

          <template v-for="(m, i) in messages" :key="i">
            <!-- Usuario -->
            <div v-if="m.role === 'user'" class="flex justify-end mb-3" :class="{ 'msg-user-in': m.fresh }">
              <div class="bubble-user">{{ m.content }}</div>
            </div>

            <!-- Asistente -->
            <div v-else class="mb-4" :class="{ 'msg-bot-in': m.fresh }">
              <div class="flex items-end gap-2">
                <div class="mini-avatar"><img v-if="avatar" :src="avatar" alt="" /><ChapiBot v-else variant="head" :animated="false" class="mini-bot" /></div>
                <div v-if="m.error" class="bubble-error">
                  <p>{{ m.content }}</p>
                  <button v-if="i === messages.length - 1" type="button" @click="retry"
                    class="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-fiery-red hover:text-fiery-darkred">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                    Reintentar
                  </button>
                </div>
                <div v-else class="bubble-bot" v-html="format(m.content)"></div>
              </div>

              <!-- Tarjetas de negocios -->
              <div v-if="m.cards?.length" class="cards-track -mx-4 px-4 mt-3 pl-[3.25rem]"
                :class="m.cards.length > 1 ? 'flex gap-3 overflow-x-auto snap-x snap-mandatory' : ''">
                <article v-for="(card, k) in m.cards" :key="card.id" class="biz-card snap-start"
                  :class="m.cards.length > 1 ? 'w-[78%] shrink-0' : 'w-full'" :style="{ '--i': k }">
                  <RouterLink :to="`/negocio/${card.id}`" @click="close" class="block group">
                    <div class="relative h-24 bg-slate-100 overflow-hidden">
                      <img v-if="card.logo" :src="card.logo" :alt="card.nombre" loading="lazy"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div class="px-3.5 pt-3">
                      <div class="flex items-start justify-between gap-2">
                        <h4 class="font-extrabold text-[15px] leading-snug text-fiery-navy group-hover:text-fiery-red transition-colors line-clamp-1">{{ card.nombre }}</h4>
                        <span v-if="card.rating" class="shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-fiery-navy">
                          <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd"/></svg>
                          {{ Number(card.rating).toFixed(1) }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">{{ [card.categoria, card.ubicacion].filter(Boolean).join(' en ') }}</p>
                      <p v-if="card.horario" class="flex items-center gap-1.5 text-xs text-slate-600 mt-2 line-clamp-1">
                        <svg class="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span class="truncate">{{ card.horario }}</span>
                      </p>
                    </div>
                  </RouterLink>
                  <div class="flex gap-2 p-3.5 pt-3">
                    <a v-if="card.whatsapp" :href="card.whatsapp" target="_blank" rel="noopener"
                      @click="onCardClick(card.id, 'whatsapp')"
                      class="press flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
                      WhatsApp
                    </a>
                    <a v-if="card.maps" :href="card.maps" target="_blank" rel="noopener"
                      @click="onCardClick(card.id, 'maps')" title="Cómo llegar" aria-label="Cómo llegar"
                      class="press inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-fiery-navy/[0.07] hover:bg-fiery-navy hover:text-white text-fiery-navy text-xs font-bold transition-colors"
                      :class="card.whatsapp ? 'w-10' : 'flex-1'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                      <span v-if="!card.whatsapp">Cómo llegar</span>
                    </a>
                  </div>
                </article>
              </div>

              <!-- Acciones -->
              <div v-for="(a, j) in m.actions" :key="j" class="mt-3 pl-9">
                <div v-if="a.type === 'whatsapp'" class="wa-card">
                  <p class="text-[11px] font-bold text-green-800 mb-2">Mensaje listo para enviar</p>
                  <p class="wa-draft">{{ a.preview }}</p>
                  <a :href="a.url" target="_blank" rel="noopener" @click="onCardClick(a.id_emprendimiento, 'whatsapp')"
                    class="press mt-3 flex items-center justify-center gap-2 h-10 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold transition-colors">
                    Enviar por WhatsApp
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
                  </a>
                </div>

                <div v-else-if="a.type === 'sugerencia'" class="tip-card">
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <p class="text-[11px] font-bold text-fiery-darkred">{{ SUGGESTION_LABEL[a.tipo_campo] || 'Sugerencia' }}</p>
                    <button type="button" @click="copy(a.texto, `${i}-${j}`)"
                      class="press inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white text-[11px] font-bold text-fiery-navy hover:bg-fiery-navy hover:text-white transition-colors">
                      <svg v-if="copiedId !== `${i}-${j}`" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>
                      <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                      {{ copiedId === `${i}-${j}` ? 'Copiado' : 'Copiar' }}
                    </button>
                  </div>
                  <p class="text-[13px] leading-relaxed text-fiery-navy whitespace-pre-line">{{ a.texto }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Escribiendo -->
          <div v-if="loading" class="flex items-end gap-2 mb-2 msg-bot-in">
            <div class="mini-avatar"><img v-if="avatar" :src="avatar" alt="" /><ChapiBot v-else variant="head" :animated="false" class="mini-bot" /></div>
            <div class="bubble-bot !py-2.5 flex items-center gap-2.5">
              <span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>
              <Transition name="label" mode="out-in">
                <span :key="typingIndex" class="text-xs text-slate-500">{{ typingLabels[typingIndex] }}</span>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Escribir -->
        <form @submit.prevent="send()" class="composer px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#f5f6f8]">
          <div class="composer-box flex items-end gap-2 bg-white rounded-[22px] pl-4 pr-1.5 py-1.5">
            <label for="chat-input" class="sr-only">Escribe tu mensaje</label>
            <textarea id="chat-input" ref="textarea" v-model="input" rows="1" maxlength="1000"
              placeholder="Escribe tu mensaje"
              @input="autoGrow" @keydown.enter="onEnter"
              class="flex-1 resize-none bg-transparent py-2 text-fiery-navy placeholder-slate-500 focus:outline-none leading-snug"></textarea>
            <button type="submit" :disabled="!canSend" aria-label="Enviar"
              class="send-btn w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
              :class="canSend ? 'is-ready bg-fiery-red text-white hover:bg-fiery-darkred' : 'bg-slate-100 text-slate-400'">
              <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/></svg>
            </button>
          </div>
          <p class="text-[10.5px] text-slate-500 text-center mt-2">Respuestas generadas con IA. Confirma precios y disponibilidad con cada negocio.</p>
        </form>
        </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.chat-root { font-family: 'Outfit', sans-serif; }

/* ── Botón flotante ─────────────────────────────── */
.launcher {
  box-shadow: 0 10px 30px -8px rgb(0 48 73 / 0.55), 0 2px 6px rgb(0 48 73 / 0.25);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, padding 0.3s ease;
}
.launcher:hover { transform: translateY(-3px); box-shadow: 0 16px 36px -10px rgb(0 48 73 / 0.6), 0 2px 6px rgb(0 48 73 / 0.2); }
.launcher:active { transform: translateY(0) scale(0.97); }
/* Saludo único al cargar para que se note el botón */
.launcher-avatar { animation: nudge 0.9s cubic-bezier(0.36, 0, 0.2, 1) 1.2s 1 both; }
.launcher-avatar.no-nudge { animation: none; }

/* La bolita "atrapa" a Chapi cuando se mete */
.launcher-avatar.is-catching { animation: catch 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes catch {
  0% { transform: scale(1); }
  25% { transform: scale(1.25); }
  55% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.head-pop-enter-active { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s, opacity 0.2s ease 0.08s; }
.head-pop-enter-from { transform: scale(0.2) translateY(8px); opacity: 0; }

/* Chapi durante las escenas: lo mueve chapiScenes.js */
.chapi-actor {
  position: fixed; left: 0; top: 0; width: 58px; height: 72px; z-index: 201;
  pointer-events: none; transform-origin: 50% 50%; will-change: transform, opacity; opacity: 0;
}

/* Tocar a Chapi en el encabezado */
.chapi-poke { cursor: pointer; border-radius: 16px; transition: transform 0.2s ease; }
.chapi-poke:hover { transform: translateY(-2px); }
.chapi-poke:active { transform: scale(0.94); }

/* Celular: sin zoom por doble toque ni sombreado al tocar botones del chat */
.chat-root button, .chat-root a, .chat-root textarea {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.chapi-poke, .launcher { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }

/* Paisaje del encabezado */
.header-text { text-shadow: 0 1px 3px rgb(0 30 50 / 0.55); }
.sky-sun { animation: sunGlow 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes sunGlow { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.12); opacity: 0.45; } }
.sky-birds { animation: birds 9s ease-in-out infinite; }
@keyframes birds { 0% { transform: translate(-20px, 4px); } 50% { transform: translate(30px, -3px); } 100% { transform: translate(-20px, 4px); } }
.sky-cloud { animation: skyDrift 70s linear infinite; }
@keyframes skyDrift { from { transform: translateX(-80px); } to { transform: translateX(460px); } }
.sky-star { animation: twinkle 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes twinkle { 0%, 100% { opacity: 0.35; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
.sky-smoke { animation: skySmoke 3.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes skySmoke { 0% { opacity: 0; transform: translate(0, 0) scale(0.6); } 25% { opacity: 0.6; } 100% { opacity: 0; transform: translate(6px, -16px) scale(1.8); } }
.sky-breath { animation: breath 6s ease-in-out infinite; }
@keyframes breath { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.textile { z-index: 1; }

/* Scroll: el texto se mete y la bolita rueda como pelota */
.launcher-label {
  display: inline-block; max-width: 260px; overflow: hidden; vertical-align: middle;
  transition: max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.launcher.is-collapsed .launcher-label { max-width: 0; opacity: 0; }
.launcher-avatar.is-roll-in { animation: rollIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.launcher-avatar.is-roll-out { animation: rollOut 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes rollIn { 0% { transform: rotate(0) scale(1); } 60% { transform: rotate(-380deg) scale(1.12); } 100% { transform: rotate(-360deg) scale(1); } }
@keyframes rollOut { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(200deg) translateY(-6px) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }

/* Cursor de "escribiendo" dentro del botón */
.caret {
  display: inline-block; width: 2px; height: 1.05em; margin-left: 2px; vertical-align: -0.18em;
  background: #FDF0D5; border-radius: 1px; animation: caret 0.85s steps(1) infinite;
}
@keyframes caret { 50% { opacity: 0; } }

@keyframes nudge {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-14deg) scale(1.08); }
  45% { transform: rotate(10deg) scale(1.08); }
  70% { transform: rotate(-4deg); }
}

.launcher-enter-active { transition: opacity 0.3s ease 0.12s, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.12s; }
.launcher-leave-active { transition: opacity 0.12s ease, transform 0.15s ease; }
.launcher-enter-from, .launcher-leave-to { opacity: 0; transform: scale(0.85) translateY(8px); }

/* ── Burbuja de bienvenida ──────────────────────── */
.teaser-bubble { box-shadow: 0 12px 32px -12px rgb(0 48 73 / 0.35), 0 0 0 1px rgb(0 48 73 / 0.06); }
.teaser-enter-active { transition: opacity 0.35s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.teaser-leave-active { transition: opacity 0.15s ease, transform 0.2s ease; }
.teaser-enter-from { opacity: 0; transform: translateY(10px) scale(0.92); transform-origin: bottom right; }
.teaser-leave-to { opacity: 0; transform: scale(0.95); }

/* ── Panel: crece desde el botón ────────────────── */
.panel {
  box-shadow: 0 30px 80px -20px rgb(0 48 73 / 0.45), 0 0 0 1px rgb(0 48 73 / 0.06);
  transform-origin: bottom right;
}
.panel-enter-active { transition: opacity 0.25s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.panel-leave-active { transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.4, 0, 1, 1); }
.panel-enter-from { opacity: 0; transform: translate(12px, 24px) scale(0.6); }
.panel-leave-to { opacity: 0; transform: translate(8px, 16px) scale(0.85); }

/* Encabezado con luz suave desde la esquina de Chapi */
.header { background: #003049; }
.avatar-logo { box-shadow: 0 0 0 3px rgb(253 240 213 / 0.18), 0 6px 16px -6px rgb(0 0 0 / 0.45); }

/* Franja bordada: zigzag crema, rombos azules y puntos amarillos sobre rojo */
.textile {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='10'%3E%3Crect width='28' height='10' fill='%23C1121F'/%3E%3Crect width='28' height='1.6' fill='%23780000'/%3E%3Crect y='8.4' width='28' height='1.6' fill='%23780000'/%3E%3Cpolyline points='0,7 7,3 14,7 21,3 28,7' fill='none' stroke='%23FDF0D5' stroke-width='1.3' stroke-linejoin='round'/%3E%3Cpath d='M7 5.1l1.3 1.3-1.3 1.3-1.3-1.3z' fill='%23669BBC'/%3E%3Cpath d='M21 5.1l1.3 1.3-1.3 1.3-1.3-1.3z' fill='%23669BBC'/%3E%3Ccircle cx='14' cy='3.4' r='0.9' fill='%23F2B33D'/%3E%3Ccircle cx='0' cy='3.4' r='0.9' fill='%23F2B33D'/%3E%3Ccircle cx='28' cy='3.4' r='0.9' fill='%23F2B33D'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 28px 10px;
}
.panel-enter-active .textile { animation: weave 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
@keyframes weave { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

.icon-btn { transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease; }
.icon-btn:active { transform: scale(0.92); }

/* ── Mensajes ───────────────────────────────────── */
.mini-avatar {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; overflow: hidden;
  background: #C1121F;
  display: flex; align-items: center; justify-content: center;
}
.mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
.mini-avatar .mini-bot { width: 24px; height: 24px; margin-top: 3px; }

.bubble-bot {
  max-width: 85%; padding: 10px 14px; background: #fff; color: #003049;
  border-radius: 18px 18px 18px 6px; font-size: 14px; line-height: 1.55; overflow-wrap: anywhere;
  box-shadow: 0 1px 2px rgb(0 48 73 / 0.06), 0 0 0 1px rgb(0 48 73 / 0.05);
}
.bubble-bot :deep(strong) { font-weight: 700; color: #003049; }
.bubble-bot :deep(.chat-li) { display: block; position: relative; padding-left: 14px; margin-top: 4px; }
.bubble-bot :deep(.chat-li)::before {
  content: ''; position: absolute; left: 2px; top: 0.68em; width: 5px; height: 5px; border-radius: 2px; background: #C1121F;
}
.bubble-user {
  max-width: 82%; padding: 10px 14px; background: #003049; color: #fff;
  border-radius: 18px 18px 6px 18px; font-size: 14px; line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere;
}
.bubble-error {
  max-width: 85%; padding: 10px 14px; background: #fff; color: #780000; font-size: 14px; line-height: 1.5;
  border-radius: 18px 18px 18px 6px; box-shadow: inset 0 0 0 1px rgb(193 18 31 / 0.25);
}

.msg-bot-in { animation: botIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
.msg-user-in { animation: userIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes botIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes userIn { from { opacity: 0; transform: translateX(14px) scale(0.98); } to { opacity: 1; transform: none; } }

/* ── Sugerencias iniciales ──────────────────────── */
.chip {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;
  padding: 11px 14px; border-radius: 14px; background: #fff; text-align: left;
  font-size: 13.5px; font-weight: 600; color: #003049;
  box-shadow: 0 0 0 1px rgb(0 48 73 / 0.08);
  transition: box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  animation: chipIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.25s + var(--i) * 0.07s);
}
.chip:hover { box-shadow: 0 0 0 1.5px #C1121F, 0 6px 16px -8px rgb(193 18 31 / 0.4); transform: translateY(-1px); }
.chip:active { transform: scale(0.98); }
@keyframes chipIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* ── Tarjetas de negocio ────────────────────────── */
.cards-track { scroll-padding-left: 3.25rem; }
.biz-card {
  background: #fff; border-radius: 18px; overflow: hidden;
  box-shadow: 0 1px 2px rgb(0 48 73 / 0.06), 0 0 0 1px rgb(0 48 73 / 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  animation: cardIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.15s + var(--i) * 0.08s);
}
.biz-card:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -14px rgb(0 48 73 / 0.35), 0 0 0 1px rgb(0 48 73 / 0.08); }
@keyframes cardIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }

.press { transition: transform 0.15s ease, background-color 0.2s ease, color 0.2s ease; }
.press:active { transform: scale(0.96); }

/* ── Acciones ───────────────────────────────────── */
.wa-card {
  max-width: 88%; padding: 12px; border-radius: 18px; background: #ecfdf3;
  box-shadow: 0 0 0 1px rgb(21 128 61 / 0.18);
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}
.wa-draft {
  position: relative; padding: 9px 12px; background: #fff; border-radius: 12px 12px 4px 12px;
  font-size: 13.5px; line-height: 1.45; color: #14532d; box-shadow: 0 1px 1px rgb(20 83 45 / 0.12);
}
.tip-card {
  max-width: 88%; padding: 12px 14px; border-radius: 18px; background: #FDF0D5;
  box-shadow: 0 0 0 1px rgb(120 0 0 / 0.1);
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

/* ── Escribiendo ────────────────────────────────── */
.typing { display: inline-flex; gap: 3px; }
.typing i { width: 6px; height: 6px; border-radius: 50%; background: #C1121F; animation: wave 1.1s ease-in-out infinite; }
.typing i:nth-child(2) { animation-delay: 0.15s; }
.typing i:nth-child(3) { animation-delay: 0.3s; }
@keyframes wave { 0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 30% { transform: translateY(-4px); opacity: 1; } }
.label-enter-active, .label-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.label-enter-from { opacity: 0; transform: translateY(4px); }
.label-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Caja de texto ──────────────────────────────── */
.composer-box { box-shadow: 0 0 0 1px rgb(0 48 73 / 0.1), 0 4px 14px -8px rgb(0 48 73 / 0.25); transition: box-shadow 0.2s ease; }
.composer-box:focus-within { box-shadow: 0 0 0 2px rgb(193 18 31 / 0.55), 0 6px 18px -8px rgb(193 18 31 / 0.35); }
.send-btn { transition: background-color 0.2s ease, color 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.send-btn.is-ready { transform: scale(1); }
.send-btn:not(.is-ready) { transform: scale(0.9); }
.send-btn.is-ready:active { transform: scale(0.9); }

button:focus-visible, a:focus-visible { outline: 2px solid #C1121F; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .sky-cloud, .sky-star, .sky-smoke, .sky-breath { animation: none !important; }
  .launcher-avatar, .msg-bot-in, .msg-user-in, .chip, .biz-card, .wa-card, .tip-card,
  .panel-enter-active .textile, .typing i { animation: none !important; }
  .panel-enter-active, .panel-leave-active, .launcher-enter-active, .launcher-leave-active,
  .teaser-enter-active, .teaser-leave-active { transition: opacity 0.15s ease !important; }
  .panel-enter-from, .panel-leave-to, .launcher-enter-from, .launcher-leave-to, .teaser-enter-from { transform: none !important; }
}
</style>
