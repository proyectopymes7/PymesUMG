<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { sendChatMessage, trackChatClick } from '../../services/chatService'
import ChapiBot from './ChapiBot.vue'

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
  dizzy: 'Me estás mareando…'
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

// ── Entrada: Chapi llega tarde con su maletín y se mete a la bolita ──
const INTRO_KEY = 'chapi-intro'
const RUNNER = { w: 58, h: 72 }
const launcherAvatar = ref(null)
const runner = ref(null)
const introPhase = ref('done')   // waiting | arriving | landed | done
const typed = ref('')
const typingCaret = ref(false)
const runnerStyle = ref({})
let introAnim = null
let introTimers = []
let introCancelled = false
let kiteAnim = null
let sparkEls = []
const introHeadState = ref('idle')
const rumbling = ref(false)
const kiteVisible = ref(false)
const kiteHoldsChapi = ref(true)
const kiteStyle = ref({})
const flyerState = ref('happy')
const flyerHero = ref(false)

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
  introAnim?.cancel()
  kiteAnim?.cancel()
  introTimers.forEach(clearTimeout)
  introTimers = []
  sparkEls.forEach(el => el.remove())
  sparkEls = []
}

const finishIntro = () => {
  stopIntro()
  masked.value = false
  unmasking.value = false
  rumbling.value = false
  kiteVisible.value = false
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

// Recorrido: sale de debajo del borde, avanza a saltitos y se lanza dentro de la bolita
const buildRunPath = (distance) => {
  const frames = []
  const up = 'cubic-bezier(0.2, 0.7, 0.4, 1)'
  const down = 'cubic-bezier(0.6, 0, 0.8, 0.4)'
  const at = (offset, x, y, { scale = 1, opacity = 1, easing = 'linear' } = {}) =>
    frames.push({ offset, transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity, easing })

  at(0, -distance, 110, { easing: up })
  at(0.13, -distance + 14, -52, { easing: down })
  at(0.22, -distance + 28, 0, { easing: up })
  const hops = 3
  const from = -distance + 28
  const step = (-62 - from) / hops
  for (let i = 0; i < hops; i++) {
    const t = 0.22 + i * 0.17
    at(t + 0.085, from + step * (i + 0.5), -20, { easing: down })
    at(t + 0.17, from + step * (i + 1), 0, { easing: up })
  }
  at(0.87, -34, -62, { scale: 0.9, easing: down })
  at(1, 0, 0, { scale: 0.3, opacity: 0 })
  return frames
}

// Entrada de superhéroe: baja columpiándose de un hilo de colores, se suelta y cae en la bolita
const SWINGER = { w: 58, h: 72, handX: 52, handY: 24 }
const pendulum = ref(null)
const swinger = ref(null)
const rope = ref(null)
const flyer = ref(null)
const pendulumStyle = ref({})
const swingerStyle = ref({})
const flyerStyle = ref({})
const masked = ref(false)
const unmasking = ref(false)

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

const arriveLate = async (cx, cy) => {
  const distance = Math.min(320, cx - 30)
  runnerStyle.value = {
    left: `${cx - RUNNER.w / 2}px`,
    top: `${cy - RUNNER.h / 2 - 4}px`,
    width: `${RUNNER.w}px`,
    height: `${RUNNER.h}px`,
    transform: `translate(${-distance}px, 110px)`
  }
  introPhase.value = 'arriving'
  await nextTick()
  if (!runner.value) return false
  introAnim = runner.value.animate(buildRunPath(distance), { duration: 2700, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  return !introCancelled
}

const arriveSwinging = async (cx, cy) => {
  const anchorY = -40
  const length = Math.max(240, cy - 70 - anchorY)
  const swing = 'cubic-bezier(0.45, 0, 0.55, 1)'
  pendulumStyle.value = { left: `${cx - 150}px`, top: `${anchorY}px`, height: `${length}px`, transform: 'rotate(95deg)' }
  swingerStyle.value = {
    width: `${SWINGER.w}px`,
    height: `${SWINGER.h}px`,
    left: `${-SWINGER.handX}px`,
    top: `${length - SWINGER.handY}px`
  }
  introPhase.value = 'swinging'
  await nextTick()
  if (!pendulum.value) return false
  introAnim = pendulum.value.animate([
    { transform: 'rotate(95deg)', easing: swing },
    { transform: 'rotate(-14deg)', offset: 0.55, easing: swing },
    { transform: 'rotate(9deg)', offset: 0.8, easing: swing },
    { transform: 'rotate(-8deg)' }
  ], { duration: 2800, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  if (introCancelled || !swinger.value) return false

  // Se suelta: el hilo se recoge y Chapi da una voltereta hacia la bolita
  const r = swinger.value.getBoundingClientRect()
  flyerStyle.value = { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` }
  flyerState.value = 'happy'
  flyerHero.value = true
  introPhase.value = 'flying'
  await nextTick()
  rope.value?.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' })
  if (!flyer.value) return false
  const dx = cx - (r.left + r.width / 2)
  const dy = cy - (r.top + r.height / 2)
  introAnim = flyer.value.animate([
    { transform: 'translate(0, 0) rotate(0deg) scale(1)', easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 55}px) rotate(200deg) scale(0.9)`, offset: 0.5, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
    { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(0.3)`, opacity: 0 }
  ], { duration: 850, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  return !introCancelled
}

// Barrilete: baja planeando agarrado de un barrilete gigante, se suelta y el barrilete se va volando
const KITE = { w: 120, h: 175, chapiX: 37, chapiY: 132 }
const kiteRig = ref(null)
const kiteChapi = ref(null)
const KITE_COLORS = ['#C1121F', '#669BBC', '#F2B33D', '#003049']
const KITE_WEDGES = Array.from({ length: 8 }, (_, i) => {
  const point = (deg) => {
    const rad = (deg - 90) * Math.PI / 180
    return `${(50 + 40 * Math.cos(rad)).toFixed(2)} ${(50 + 40 * Math.sin(rad)).toFixed(2)}`
  }
  return { d: `M50 50 L${point(i * 45)} A40 40 0 0 1 ${point((i + 1) * 45)} Z`, fill: KITE_COLORS[i % 4] }
})

const arriveKite = async (cx, cy) => {
  const left = cx - KITE.chapiX
  const top = cy - 58 - KITE.chapiY
  kiteStyle.value = { left: `${left}px`, top: `${top}px`, width: `${KITE.w}px`, height: `${KITE.h}px` }
  const startY = -(top + KITE.h + 20)
  const keepInside = (dx) => Math.max(dx, -(left - 12))
  const ease = 'cubic-bezier(0.45, 0, 0.55, 1)'
  kiteHoldsChapi.value = true
  kiteVisible.value = true
  introPhase.value = 'kite'
  await nextTick()
  if (!kiteRig.value) return false
  introAnim = kiteRig.value.animate([
    { transform: `translate(${keepInside(-240)}px, ${startY}px) rotate(-10deg)`, easing: ease },
    { transform: `translate(${keepInside(-90)}px, ${startY * 0.62}px) rotate(9deg)`, offset: 0.3, easing: ease },
    { transform: `translate(${keepInside(-200)}px, ${startY * 0.3}px) rotate(-8deg)`, offset: 0.6, easing: ease },
    { transform: `translate(${keepInside(-50)}px, -40px) rotate(6deg)`, offset: 0.85, easing: ease },
    { transform: 'translate(0px, 0px) rotate(0deg)' }
  ], { duration: 3400, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  if (introCancelled || !kiteChapi.value) return false

  // Chapi se suelta y cae en la bolita
  const r = kiteChapi.value.getBoundingClientRect()
  flyerStyle.value = { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` }
  flyerState.value = 'happy'
  flyerHero.value = false
  kiteHoldsChapi.value = false
  introPhase.value = 'dropping'
  await nextTick()

  // El barrilete se queda flotando un momento y luego se va volando
  kiteAnim = kiteRig.value?.animate([
    { transform: 'translate(0px, 0px) rotate(0deg)', easing: ease },
    { transform: 'translate(8px, -28px) rotate(-6deg)', offset: 0.3, easing: ease },
    { transform: 'translate(-6px, -16px) rotate(5deg)', offset: 0.55, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
    { transform: `translate(240px, ${-(top + KITE.h + 80)}px) rotate(25deg)`, opacity: 0 }
  ], { duration: 2800, fill: 'forwards' })
  if (kiteAnim) kiteAnim.onfinish = () => { kiteVisible.value = false }

  if (!flyer.value) return false
  const dx = cx - (r.left + r.width / 2)
  const dy = cy - (r.top + r.height / 2)
  introAnim = flyer.value.animate([
    { transform: 'translate(0px, 0px) scale(1)', easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' },
    { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 }
  ], { duration: 560, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  return !introCancelled
}

// Chispas y humo que salen de la bolita (elementos sueltos que se borran solos)
const burst = (cx, cy) => {
  const colors = ['#C1121F', '#F2B33D', '#ff7a1a', '#FDF0D5', '#780000']
  const add = (style, frames, options) => {
    const el = document.createElement('span')
    Object.assign(el.style, { position: 'fixed', borderRadius: '50%', zIndex: '202', pointerEvents: 'none' }, style)
    document.body.appendChild(el)
    sparkEls.push(el)
    const anim = el.animate(frames, options)
    anim.onfinish = anim.oncancel = () => { el.remove(); sparkEls = sparkEls.filter(x => x !== el) }
  }
  for (let i = 0; i < 22; i++) {
    const size = 4 + Math.random() * 5
    const angle = (-90 + (Math.random() - 0.5) * 160) * Math.PI / 180
    const dist = 60 + Math.random() * 120
    const x = Math.cos(angle) * dist
    const y = Math.sin(angle) * dist
    add(
      { left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px`,
        background: colors[i % colors.length], boxShadow: '0 0 8px rgb(255 122 26 / 0.7)' },
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${x * 0.7}px, ${y * 0.75}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x}px, ${y + 55}px) scale(0.4)`, opacity: 0 }
      ],
      { duration: 800 + Math.random() * 600, delay: Math.random() * 150, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)', fill: 'backwards' }
    )
  }
  for (let i = 0; i < 5; i++) {
    const size = 16 + Math.random() * 14
    const x = (Math.random() - 0.5) * 50
    add(
      { left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px`, background: 'rgb(110 110 120 / 0.45)', filter: 'blur(2px)' },
      [
        { transform: 'translate(0, 0) scale(0.4)', opacity: 0.9 },
        { transform: `translate(${x}px, ${-70 - Math.random() * 50}px) scale(1.6)`, opacity: 0 }
      ],
      { duration: 1400 + Math.random() * 600, delay: 100 + i * 90, easing: 'ease-out', fill: 'backwards' }
    )
  }
}

// Volcán: la bolita tiembla, hace erupción y Chapi sale disparado girando antes de caer de vuelta
const arriveVolcano = async (cx, cy) => {
  introPhase.value = 'rumbling'
  rumbling.value = true
  await wait(1100)
  if (introCancelled) return false
  rumbling.value = false

  flyerStyle.value = { left: `${cx - SWINGER.w / 2}px`, top: `${cy - SWINGER.h / 2}px`, width: `${SWINGER.w}px`, height: `${SWINGER.h}px` }
  flyerState.value = 'surprised'
  flyerHero.value = false
  introPhase.value = 'erupting'
  await nextTick()
  burst(cx, cy)
  if (!flyer.value) return false
  const rise = Math.min(280, cy - 80)
  introAnim = flyer.value.animate([
    { transform: 'translateY(0px) rotate(0deg) scale(0.3)', opacity: 0, easing: 'cubic-bezier(0.15, 0.8, 0.3, 1)' },
    { transform: `translateY(${-rise}px) rotate(540deg) scale(1)`, opacity: 1, offset: 0.42, easing: 'ease-in-out' },
    { transform: `translateY(${-rise + 14}px) rotate(680deg) scale(1)`, opacity: 1, offset: 0.55, easing: 'cubic-bezier(0.55, 0, 0.85, 0.35)' },
    { transform: 'translateY(0px) rotate(1080deg) scale(0.3)', opacity: 0 }
  ], { duration: 2000, fill: 'forwards' })
  try { await introAnim.finished } catch { return false }
  return !introCancelled
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
  const arrive = { swing: arriveSwinging, kite: arriveKite, volcano: arriveVolcano, late: arriveLate }[style]
  const arrived = await arrive(cx, cy)
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

// ── Abrir / cerrar ─────────────────────────────────────────
const scrollToBottom = async () => {
  await nextTick()
  if (scroller.value) scroller.value.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
}

const open = async () => {
  if (introPhase.value !== 'done') finishIntro()
  isOpen.value = true
  dismissTeaser()
  react('wave', 2400)
  wake()
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  // En celular no abrimos el teclado de golpe
  if (window.matchMedia('(min-width: 640px)').matches) textarea.value?.focus()
}

const close = () => {
  isOpen.value = false
  clearTimeout(sleepTimer)
  sleeping.value = false
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

const request = async () => {
  reaction.value = ''
  userTyping.value = false
  wake()
  loading.value = true
  scrollToBottom()
  try {
    const history = messages.value.filter(m => !m.error)
    const data = await sendChatMessage({ mode: props.mode, messages: history, businessId: props.businessId })
    const reply = data.reply || 'No tengo una respuesta para eso. ¿Lo puedes preguntar de otra forma?'
    messages.value.push({ role: 'assistant', content: reply, cards: data.cards || [], actions: data.actions || [], fresh: true })
    if (data.cards?.length || data.actions?.length) react('happy', 2800)
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
  await request()
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
          {{ teaser }}
        </button>
        <button type="button" @click="dismissTeaser" aria-label="Cerrar mensaje"
          class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-fiery-navy hover:bg-slate-100 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </Transition>

    <!-- Chapi llegando tarde (solo durante la entrada) -->
    <div v-if="introPhase === 'arriving'" ref="runner" class="fixed z-[201] pointer-events-none"
      :style="runnerStyle" aria-hidden="true">
      <ChapiBot state="running" carry />
    </div>

    <!-- Chapi columpiándose de un hilo de colores -->
    <div v-if="introPhase === 'swinging' || introPhase === 'flying'" ref="pendulum"
      class="pendulum fixed z-[201] w-0 pointer-events-none" :style="pendulumStyle" aria-hidden="true">
      <div ref="rope" class="rope absolute -left-[1.5px] top-0 w-[3px] h-full"></div>
      <div v-show="introPhase === 'swinging'" ref="swinger" class="absolute" :style="swingerStyle">
        <ChapiBot state="swinging" hero />
      </div>
    </div>
    <div v-if="['flying', 'dropping', 'erupting'].includes(introPhase)" ref="flyer" class="fixed z-[201] pointer-events-none"
      :style="flyerStyle" aria-hidden="true">
      <ChapiBot :state="flyerState" :hero="flyerHero" />
    </div>

    <!-- Barrilete gigante del que cuelga Chapi -->
    <div v-if="kiteVisible" ref="kiteRig" class="kite-rig fixed z-[201] pointer-events-none" :style="kiteStyle" aria-hidden="true">
      <svg class="kite absolute left-[15px] top-0 w-[90px] h-[90px] overflow-visible" viewBox="0 0 100 100">
        <g class="kite-tail" fill="none" stroke-width="3" stroke-linecap="round">
          <path d="M22 80 q-12 16 0 30 t-6 32" stroke="#C1121F" />
          <path d="M28 86 q-8 14 4 26 t-2 28" stroke="#669BBC" />
        </g>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#C1121F" stroke-width="8" stroke-dasharray="5 7" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#F2B33D" stroke-width="8" stroke-dasharray="4 8" stroke-dashoffset="6" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#669BBC" stroke-width="8" stroke-dasharray="3 9" stroke-dashoffset="11" />
        <path v-for="(w, k) in KITE_WEDGES" :key="k" :d="w.d" :fill="w.fill" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#FDF0D5" stroke-width="1.6" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#FDF0D5" stroke-width="5" stroke-dasharray="3 3" />
        <circle cx="50" cy="50" r="14" fill="#780000" />
        <rect x="44" y="44" width="12" height="12" fill="#FDF0D5" />
        <rect x="44" y="44" width="12" height="12" fill="#FDF0D5" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="3.5" fill="#C1121F" />
      </svg>
      <div v-show="kiteHoldsChapi" class="kite-string absolute left-[59px] top-[86px] w-[1.6px] h-[36px]"></div>
      <div v-show="kiteHoldsChapi" ref="kiteChapi" class="absolute left-[8px] top-[96px] w-[58px] h-[72px]">
        <ChapiBot state="swinging" />
      </div>
    </div>

    <!-- Botón flotante -->
    <Transition name="launcher">
      <button v-if="!isOpen" type="button" @click="open"
        class="launcher fixed bottom-5 right-4 sm:right-6 z-[200] flex items-center rounded-full bg-fiery-navy text-white"
        :class="launcherText ? 'gap-3 pl-1.5 pr-5 py-1.5' : 'gap-0 p-1.5'"
        :aria-label="`Abrir ${title}`">
        <span ref="launcherAvatar"
          class="launcher-avatar relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-fiery-red"
          :class="{ 'is-catching': introPhase === 'landed', 'no-nudge': hasIntro, 'is-rumbling': rumbling }">
          <img v-if="avatar" :src="avatar" alt="" class="w-full h-full object-cover" />
          <Transition v-else name="head-pop">
            <span v-if="showLauncherHead" class="w-9 h-9 mt-1"><ChapiBot variant="head" :hero="masked" :unmask="unmasking" :state="introHeadState" /></span>
          </Transition>
        </span>
        <span v-if="launcherText" class="text-sm font-bold whitespace-nowrap" aria-live="polite">
          {{ launcherText }}<span v-if="typingCaret" class="caret" aria-hidden="true"></span>
        </span>
      </button>
    </Transition>

    <!-- Panel -->
    <Transition name="panel">
      <section v-if="isOpen" role="dialog" :aria-label="title"
        class="panel fixed z-[200] inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[408px] sm:h-[min(660px,calc(100dvh-3rem))] flex flex-col bg-fiery-navy sm:rounded-[28px] overflow-hidden">

        <!-- Encabezado -->
        <header class="header relative text-white px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[14px]">
          <div class="flex items-end gap-3">
            <div v-if="avatar" class="avatar-logo w-12 h-12 mb-1.5 rounded-full overflow-hidden shrink-0">
              <img :src="avatar" alt="" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-[66px] h-[80px] -mb-[12px] -ml-1 shrink-0">
              <button type="button" @click="poke" class="chapi-poke block w-full h-full" aria-label="Tocar a Chapi">
                <ChapiBot :state="botState" />
              </button>
            </div>
            <div class="flex-1 min-w-0 pb-2">
              <p class="font-extrabold text-[17px] leading-tight tracking-tight truncate">{{ title }}</p>
              <p class="text-[13px] text-white/60 truncate mt-0.5">
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
                      @click="trackChatClick(card.id, 'whatsapp')"
                      class="press flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>
                      WhatsApp
                    </a>
                    <a v-if="card.maps" :href="card.maps" target="_blank" rel="noopener"
                      @click="trackChatClick(card.id, 'maps')" title="Cómo llegar" aria-label="Cómo llegar"
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
                  <a :href="a.url" target="_blank" rel="noopener" @click="trackChatClick(a.id_emprendimiento, 'whatsapp')"
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

/* Hilo de colores del que cuelga Chapi */
.pendulum { transform-origin: 0 0; }
.rope {
  transform-origin: top;
  background: repeating-linear-gradient(180deg, #C1121F 0 10px, #FDF0D5 10px 14px, #669BBC 14px 22px, #F2B33D 22px 26px);
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgb(0 48 73 / 0.25);
}

/* Barrilete */
.kite-rig { transform-origin: 60px 45px; }
.kite { animation: kiteFlutter 0.7s ease-in-out infinite alternate; transform-origin: 50% 50%; }
.kite-tail { transform-origin: 25px 80px; animation: tail 0.5s ease-in-out infinite alternate; }
.kite-string { background: #FDF0D5; box-shadow: 0 0 0 0.5px rgb(0 48 73 / 0.4); }
@keyframes kiteFlutter { from { transform: rotate(-3deg); } to { transform: rotate(3deg) scale(1.02); } }
@keyframes tail { from { transform: rotate(-8deg); } to { transform: rotate(10deg); } }

/* Volcán: la bolita tiembla y se pone al rojo vivo */
.launcher-avatar.is-rumbling {
  animation: rumble 0.08s linear infinite;
  background: radial-gradient(circle at 50% 60%, #ffb347, #ff7a1a 45%, #C1121F 80%);
  box-shadow: 0 0 0 3px rgb(255 122 26 / 0.45), 0 0 22px 6px rgb(255 90 0 / 0.55);
}
@keyframes rumble {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1.5px, 1px) rotate(-2deg); }
  50% { transform: translate(1.5px, -1px); }
  75% { transform: translate(-1px, -1px) rotate(2deg); }
}

/* Tocar a Chapi en el encabezado */
.chapi-poke { cursor: pointer; border-radius: 16px; transition: transform 0.2s ease; }
.chapi-poke:hover { transform: translateY(-2px); }
.chapi-poke:active { transform: scale(0.94); }

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
.header {
  background:
    radial-gradient(120% 150% at 0% 0%, rgb(102 155 188 / 0.3), transparent 55%),
    #003049;
}
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
  .launcher-avatar, .msg-bot-in, .msg-user-in, .chip, .biz-card, .wa-card, .tip-card,
  .panel-enter-active .textile, .typing i { animation: none !important; }
  .panel-enter-active, .panel-leave-active, .launcher-enter-active, .launcher-leave-active,
  .teaser-enter-active, .teaser-leave-active { transition: opacity 0.15s ease !important; }
  .panel-enter-from, .panel-leave-to, .launcher-enter-from, .launcher-leave-to, .teaser-enter-from { transform: none !important; }
}
</style>
