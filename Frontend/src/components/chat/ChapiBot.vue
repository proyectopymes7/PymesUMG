<script setup>
import { computed } from 'vue'

// Mascota del chat: robot con huipil y tocoyal guatemaltecos
const props = defineProps({
  // 'full' (cuerpo completo) | 'head' (solo cabeza, para avatares pequeños)
  variant: { type: String, default: 'full' },
  // Estados: idle, wave, watching (el usuario escribe), thinking, happy, confused, sad, sleep,
  // running, swinging y las reacciones al tocarlo: surprised, giggle, dance, love, spin, dizzy
  state: { type: String, default: 'idle' },
  // Lleva su maletín (cuando llega tarde a trabajar)
  carry: { type: Boolean, default: false },
  // Traje de superhéroe: máscara de luchador y capa
  hero: { type: Boolean, default: false },
  // Se quita la máscara
  unmask: { type: Boolean, default: false },
  animated: { type: Boolean, default: true }
})

const uid = `chapi-${Math.random().toString(36).slice(2, 8)}`

const happyEyes = computed(() => ['happy', 'giggle', 'dance'].includes(props.state))
const bigSmile = computed(() => ['happy', 'giggle', 'dance', 'swinging', 'love'].includes(props.state))
</script>

<template>
  <svg
    :viewBox="variant === 'head' ? '14 0 72 70' : '6 0 88 110'"
    class="chapi"
    :class="[`is-${state}`, { 'is-animated': animated }]"
    role="img" aria-label="Chapi, el robot asistente">
    <defs>
      <clipPath :id="`${uid}-head`"><rect x="22" y="18" width="56" height="44" rx="18" /></clipPath>
      <clipPath :id="`${uid}-body`"><path d="M29 66 Q50 61 71 66 L77 101 Q50 105 23 101 Z" /></clipPath>
      <linearGradient :id="`${uid}-visor`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a4466" />
        <stop offset="1" stop-color="#002233" />
      </linearGradient>
    </defs>

    <g class="posture">
      <g class="float">
        <!-- Capa de superhéroe -->
        <g v-if="variant === 'full' && hero" class="cape">
          <path d="M31 66 Q19 86 13 107 Q50 99 87 107 Q81 86 69 66 Z" fill="#780000" />
          <path d="M13 107 Q50 99 87 107" fill="none" stroke="#F2B33D" stroke-width="1.6" />
        </g>

        <!-- Brazo izquierdo -->
        <g v-if="variant === 'full'" class="arm-left">
          <line x1="26" y1="70" x2="19.5" y2="87" stroke="#a50f1a" stroke-width="9" stroke-linecap="round" />
          <circle cx="18.5" cy="90" r="4.6" fill="#FDF0D5" />
        </g>

        <!-- Cuerpo: huipil rojo con bordado en el pecho -->
        <g v-if="variant === 'full'">
          <rect x="44" y="60" width="12" height="7" rx="2" fill="#669BBC" />
          <path d="M29 66 Q50 61 71 66 L77 101 Q50 105 23 101 Z" fill="#C1121F" />
          <g :clip-path="`url(#${uid}-body)`">
            <rect x="20" y="74" width="60" height="12" fill="#780000" />
            <polyline points="20,83 26,77 32,83 38,77 44,83 50,77 56,83 62,77 68,83 74,77 80,83"
              fill="none" stroke="#FDF0D5" stroke-width="1.6" stroke-linejoin="round" />
            <g fill="#669BBC">
              <path d="M32 77.6 l2 2 -2 2 -2 -2z" /><path d="M44 77.6 l2 2 -2 2 -2 -2z" />
              <path d="M56 77.6 l2 2 -2 2 -2 -2z" /><path d="M68 77.6 l2 2 -2 2 -2 -2z" />
            </g>
            <g fill="#F2B33D">
              <circle cx="26" cy="82.6" r="1" /><circle cx="38" cy="82.6" r="1" />
              <circle cx="50" cy="82.6" r="1" /><circle cx="62" cy="82.6" r="1" /><circle cx="74" cy="82.6" r="1" />
            </g>
            <rect x="20" y="95" width="60" height="3" fill="#003049" />
            <rect x="20" y="96.2" width="60" height="0.8" fill="#F2B33D" />
          </g>
          <path d="M43 65 h14 v4 q-7 3 -14 0z" fill="#FDF0D5" />
        </g>

        <!-- Brazo derecho -->
        <g v-if="variant === 'full'" v-show="state !== 'swinging'" class="arm-wave">
          <line x1="74" y1="70" x2="80.5" y2="87" stroke="#a50f1a" stroke-width="9" stroke-linecap="round" />
          <g v-if="carry">
            <path d="M78.6 94 v-2.4 a2.9 2.9 0 0 1 5.8 0 v2.4" fill="none" stroke="#4a2a14" stroke-width="1.8" />
            <rect x="73" y="93.5" width="17" height="12.5" rx="2.4" fill="#7a4a24" />
            <rect x="73" y="97.6" width="17" height="3.2" fill="#C1121F" />
            <rect x="73" y="98.6" width="17" height="0.9" fill="#F2B33D" />
            <rect x="80.4" y="96.6" width="2.2" height="2.6" rx="0.6" fill="#F2B33D" />
          </g>
          <circle cx="81.5" cy="90" r="4.6" fill="#FDF0D5" />
        </g>

        <!-- Cabeza completa: se inclina según el estado -->
        <g class="head-group">
          <g class="antenna-group">
            <line x1="50" y1="19" x2="50" y2="10" stroke="#FDF0D5" stroke-width="2.8" stroke-linecap="round" />
            <circle class="antenna" cx="50" cy="7" r="4.2" fill="#C1121F" />
          </g>

          <rect x="17" y="35" width="7" height="16" rx="3.5" fill="#669BBC" />
          <rect x="76" y="35" width="7" height="16" rx="3.5" fill="#669BBC" />

          <rect x="22" y="18" width="56" height="44" rx="18" fill="#FDF0D5" />
          <g :clip-path="`url(#${uid}-head)`">
            <!-- Tocoyal: cinta tejida alrededor de la cabeza -->
            <rect x="20" y="22" width="60" height="7" fill="#C1121F" />
            <rect x="20" y="23.4" width="60" height="1" fill="#F2B33D" />
            <rect x="20" y="26.6" width="60" height="1" fill="#669BBC" />
            <rect x="20" y="57" width="60" height="6" fill="#f0dcb4" />
          </g>
          <g class="tassel">
            <line x1="25" y1="27" x2="21" y2="35" stroke="#780000" stroke-width="1.4" />
            <circle cx="20.5" cy="36.5" r="2.6" fill="#C1121F" />
            <circle cx="24" cy="38.5" r="2.1" fill="#F2B33D" />
          </g>

          <!-- Visor y cara -->
          <rect x="29" y="32" width="42" height="23" rx="11" :fill="`url(#${uid}-visor)`" />
          <g v-if="hero" class="mask" :class="{ 'is-off': unmask }">
            <rect x="21" y="17" width="58" height="46" rx="19" fill="#C1121F" />
            <g :clip-path="`url(#${uid}-head)`">
              <rect x="20" y="19.5" width="60" height="6.5" fill="#780000" />
              <polyline points="20,25 25,21 30,25 35,21 40,25 45,21 50,25 55,21 60,25 65,21 70,25 75,21 80,25"
                fill="none" stroke="#FDF0D5" stroke-width="1.2" stroke-linejoin="round" />
            </g>
            <path d="M50 28.5 l3 3.6 -3 3.6 -3 -3.6z" fill="#F2B33D" />
            <ellipse cx="41" cy="42.6" rx="7.8" ry="6.6" fill="#062a3f" stroke="#FDF0D5" stroke-width="1.8" />
            <ellipse cx="59" cy="42.6" rx="7.8" ry="6.6" fill="#062a3f" stroke="#FDF0D5" stroke-width="1.8" />
            <ellipse cx="50" cy="51.2" rx="5.6" ry="3.2" fill="#062a3f" />
          </g>
          <g class="eye-pos">
            <!-- Feliz: ojitos ^ ^ -->
            <g v-if="happyEyes" fill="none" stroke="#9fd6f7" stroke-width="2.4" stroke-linecap="round">
              <path d="M37.8 45 q3.2 -5.4 6.4 0" /><path d="M55.8 45 q3.2 -5.4 6.4 0" />
            </g>
            <!-- Enamorado: corazones -->
            <g v-else-if="state === 'love'" class="heart-eyes" fill="#ff6b8a">
              <path d="M41 46.6 l-3.8 -3.9 a2.3 2.3 0 0 1 3.8 -2.9 a2.3 2.3 0 0 1 3.8 2.9z" />
              <path d="M59 46.6 l-3.8 -3.9 a2.3 2.3 0 0 1 3.8 -2.9 a2.3 2.3 0 0 1 3.8 2.9z" />
            </g>
            <!-- Mareado: espirales -->
            <g v-else-if="state === 'dizzy'" fill="none" stroke="#9fd6f7" stroke-width="1.5" stroke-linecap="round">
              <path class="spiral" d="M41 42.6 m0 -1 a1 1 0 1 1 -1 1 a2 2 0 1 1 2 2 a3 3 0 1 1 -3 -3" />
              <path class="spiral" d="M59 42.6 m0 -1 a1 1 0 1 1 -1 1 a2 2 0 1 1 2 2 a3 3 0 1 1 -3 -3" />
            </g>
            <!-- Sorprendido: ojos grandes -->
            <g v-else-if="state === 'surprised'" fill="#9fd6f7">
              <rect x="36.8" y="37" width="8.4" height="11" rx="4.2" /><rect x="54.8" y="37" width="8.4" height="11" rx="4.2" />
              <circle cx="42.6" cy="39.6" r="1.3" fill="#fff" /><circle cx="60.6" cy="39.6" r="1.3" fill="#fff" />
            </g>
            <!-- Dormido: ojos cerrados -->
            <g v-else-if="state === 'sleep'" fill="none" stroke="#9fd6f7" stroke-width="2" stroke-linecap="round">
              <path d="M37.8 43 q3.2 2.6 6.4 0" /><path d="M55.8 43 q3.2 2.6 6.4 0" />
            </g>
            <!-- Normal, triste y confundido -->
            <g v-else class="eyes">
              <rect x="37.6" :y="state === 'sad' ? 41.5 : 38.5" width="6.8" :height="state === 'sad' ? 5.6 : 8.4" rx="3.4" fill="#9fd6f7" />
              <rect x="55.6" :y="state === 'sad' ? 41.5 : state === 'confused' ? 37.4 : 38.5" width="6.8" :height="state === 'sad' ? 5.6 : 8.4" rx="3.4" fill="#9fd6f7" />
              <circle cx="42.4" :cy="state === 'sad' ? 43 : 40.6" r="1.1" fill="#fff" />
              <circle cx="60.4" :cy="state === 'sad' ? 43 : 40.6" r="1.1" fill="#fff" />
            </g>
            <!-- Cejas -->
            <g v-if="state === 'sad'" stroke="#9fd6f7" stroke-width="1.6" stroke-linecap="round">
              <line x1="37" y1="37.4" x2="43.5" y2="39.4" /><line x1="63" y1="37.4" x2="56.5" y2="39.4" />
            </g>
            <g v-else-if="state === 'confused'" stroke="#9fd6f7" stroke-width="1.6" stroke-linecap="round">
              <line x1="37.5" y1="36.4" x2="44" y2="35.4" /><line x1="56" y1="34.4" x2="62.5" y2="35.8" />
            </g>
          </g>

          <!-- Boca -->
          <path v-if="bigSmile" d="M44.6 48.6 Q50 54.6 55.4 48.6 Z" fill="#9fd6f7" />
          <ellipse v-else-if="state === 'surprised'" cx="50" cy="51" rx="2.4" ry="2.9" fill="#9fd6f7" />
          <path v-else-if="state === 'dizzy'" d="M45.5 51 q1.5 -1.6 3 0 t3 0 t3 0" fill="none" stroke="#9fd6f7" stroke-width="1.6" stroke-linecap="round" />
          <path v-else-if="state === 'sad'" d="M45.5 52 Q50 48.8 54.5 52" fill="none" stroke="#9fd6f7" stroke-width="1.8" stroke-linecap="round" />
          <path v-else-if="state === 'confused'" d="M45.8 50.6 q2.1 -1.6 4.2 0 t4.2 0" fill="none" stroke="#9fd6f7" stroke-width="1.7" stroke-linecap="round" />
          <path v-else-if="state === 'thinking'" d="M47 50.6 h6.5" fill="none" stroke="#9fd6f7" stroke-width="1.8" stroke-linecap="round" />
          <ellipse v-else-if="state === 'sleep' || state === 'watching'" cx="50" cy="50.4" rx="1.8" ry="1.5" fill="#9fd6f7" />
          <ellipse v-else-if="state === 'running'" cx="50" cy="50.6" rx="2.6" ry="2.1" fill="#9fd6f7" />
          <path v-else d="M45.5 49.6 Q50 52.8 54.5 49.6" fill="none" stroke="#9fd6f7" stroke-width="1.8" stroke-linecap="round" />
        </g>
        <!-- Brazo levantado que sujeta el hilo al columpiarse -->
        <g v-if="variant === 'full' && state === 'swinging'">
          <line x1="72" y1="69" x2="84" y2="41" stroke="#a50f1a" stroke-width="9" stroke-linecap="round" />
          <circle cx="85" cy="37.5" r="4.8" fill="#FDF0D5" />
        </g>
      </g>
    </g>

    <!-- Efectos según el estado (solo cuerpo completo) -->
    <template v-if="variant === 'full' && animated">
      <g v-if="state === 'thinking'" class="fx-think" fill="#FDF0D5">
        <circle cx="74" cy="15" r="1.6" /><circle cx="79.5" cy="9.5" r="2.3" /><circle cx="87" cy="3.5" r="3.4" />
      </g>
      <g v-if="state === 'happy'" class="fx-sparkle" fill="#F2B33D">
        <path d="M16 12 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4z" />
        <path d="M84 6 l1.1 2.9 2.9 1.1 -2.9 1.1 -1.1 2.9 -1.1 -2.9 -2.9 -1.1 2.9 -1.1z" />
        <path d="M88 30 l0.9 2.3 2.3 0.9 -2.3 0.9 -0.9 2.3 -0.9 -2.3 -2.3 -0.9 2.3 -0.9z" />
      </g>
      <text v-if="state === 'confused'" class="fx-question" x="78" y="16" fill="#F2B33D"
        font-size="15" font-weight="800" font-family="Outfit, sans-serif">?</text>
      <path v-if="state === 'sad' || state === 'running'" class="fx-sweat" d="M76 24 q-3 5 0 6.4 q3 -1.4 0 -6.4z" fill="#9fd6f7" />
      <g v-if="state === 'love'" class="fx-hearts" fill="#ff6b8a">
        <path d="M80 22 l-3.2 -3.3 a1.9 1.9 0 0 1 3.2 -2.4 a1.9 1.9 0 0 1 3.2 2.4z" />
        <path d="M18 26 l-2.6 -2.7 a1.6 1.6 0 0 1 2.6 -2 a1.6 1.6 0 0 1 2.6 2z" />
        <path d="M86 40 l-2.2 -2.3 a1.3 1.3 0 0 1 2.2 -1.6 a1.3 1.3 0 0 1 2.2 1.6z" />
      </g>
      <g v-if="state === 'giggle'" class="fx-ja" fill="#F2B33D" font-family="Outfit, sans-serif" font-weight="800">
        <text x="76" y="18" font-size="9">ja</text>
        <text x="10" y="24" font-size="7">ja</text>
      </g>
      <g v-if="state === 'dance'" class="fx-notes" fill="#FDF0D5" font-family="Outfit, sans-serif" font-weight="800">
        <text x="78" y="20" font-size="11">♪</text>
        <text x="12" y="16" font-size="9">♫</text>
      </g>
      <g v-if="state === 'dizzy'" class="fx-stars" fill="#F2B33D">
        <path d="M26 12 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z" />
        <path d="M74 12 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z" />
        <path d="M50 4 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z" />
      </g>
      <text v-if="state === 'surprised'" class="fx-bang" x="78" y="17" fill="#F2B33D"
        font-size="15" font-weight="800" font-family="Outfit, sans-serif">!</text>
      <g v-if="state === 'sleep'" class="fx-zzz" fill="#FDF0D5" font-family="Outfit, sans-serif" font-weight="800">
        <text x="72" y="18" font-size="6">z</text>
        <text x="78" y="11" font-size="8">z</text>
        <text x="85" y="4" font-size="10">z</text>
      </g>
    </template>

    <ellipse v-if="variant === 'full'" class="shadow" cx="50" cy="107" rx="20" ry="2.6" fill="#001b29" opacity="0.25" />
  </svg>
</template>

<style scoped>
.chapi { display: block; width: 100%; height: 100%; overflow: visible; }
.chapi * { transform-box: fill-box; }

/* Puntos de giro en coordenadas del dibujo */
.posture { transform-box: view-box; transform-origin: 50px 104px; }
.head-group { transform-box: view-box; transform-origin: 50px 62px; }
.antenna-group { transform-box: view-box; transform-origin: 50px 19px; }
.arm-left { transform-box: view-box; transform-origin: 27px 68px; }
.arm-wave { transform-box: view-box; transform-origin: 73px 68px; }
.tassel { transform-box: view-box; transform-origin: 25px 27px; }
.eye-pos { transform-origin: center; }

/* Cambios de postura suaves con un pequeño rebote */
.posture, .head-group, .antenna-group, .arm-left, .arm-wave, .eye-pos {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Siempre vivo ─────────────────────────────── */
.is-animated .float { animation: float 3.4s ease-in-out infinite; }
.is-animated .shadow { transform-origin: center; animation: shadow 3.4s ease-in-out infinite; }
.is-animated .eyes { transform-origin: center; animation: blink 4.8s infinite; }
.is-animated .antenna { transform-origin: center; animation: glow 2.6s ease-in-out infinite; }
.is-animated .tassel { animation: sway 3.4s ease-in-out infinite; }

/* ── Saluda ───────────────────────────────────── */
.is-animated.is-wave .arm-wave { animation: wave 1.9s cubic-bezier(0.45, 0, 0.25, 1) 0.3s 1 both; }

/* ── Mira lo que escribes: se agacha hacia la caja de texto ── */
.is-watching .posture { transform: translateY(5px) scaleY(0.96); }
.is-watching .head-group { transform: translate(1.5px, 3px) rotate(10deg); }
.is-watching .eye-pos { transform: translateY(2.6px); }
.is-watching .arm-left { transform: rotate(-18deg); }
.is-watching .arm-wave { transform: rotate(18deg); }
.is-animated.is-watching .eyes { animation: read 1.3s ease-in-out infinite; }
.is-animated.is-watching .head-group { animation: nodRead 0.9s ease-in-out infinite; }

/* ── Pensando ─────────────────────────────────── */
.is-thinking .head-group { transform: rotate(-8deg); }
.is-thinking .eye-pos { transform: translate(2.4px, -2.4px); }
.is-thinking .arm-left { transform: rotate(-35deg); }
.is-animated.is-thinking .antenna { animation: glow 0.6s ease-in-out infinite; }
.is-animated.is-thinking .eyes { animation: ponder 2.2s ease-in-out infinite; }
.is-animated.is-thinking .antenna-group { animation: antennaSpin 1.6s ease-in-out infinite; }
.fx-think circle { transform-origin: center; animation: bubble 1.5s ease-in-out infinite both; }
.fx-think circle:nth-child(2) { animation-delay: 0.2s; }
.fx-think circle:nth-child(3) { animation-delay: 0.4s; }

/* ── Feliz: salta y sube los brazos ───────────── */
.is-happy .arm-left { transform: rotate(150deg); }
.is-happy .arm-wave { transform: rotate(-150deg); }
.is-animated.is-happy .posture { animation: jump 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 2; }
.fx-sparkle path { transform-origin: center; animation: sparkle 1.1s ease-in-out infinite both; }
.fx-sparkle path:nth-child(2) { animation-delay: 0.25s; }
.fx-sparkle path:nth-child(3) { animation-delay: 0.5s; }

/* ── Confundido ───────────────────────────────── */
.is-confused .head-group { transform: rotate(-12deg); }
.is-confused .antenna-group { transform: rotate(-18deg); }
.fx-question { animation: bob 1.2s ease-in-out infinite both; transform-origin: center; }

/* ── Triste ───────────────────────────────────── */
.is-sad .head-group { transform: translateY(3px) rotate(5deg); }
.is-sad .antenna-group { transform: rotate(35deg); }
.is-sad .posture { transform: translateY(2px); }
.fx-sweat { animation: sweat 1.6s ease-in infinite both; }

/* ── Corriendo con prisa: se inclina y mueve los brazos ── */
.is-running .posture { transform: rotate(9deg); }
.is-running .eye-pos { transform: translateX(2.6px); }
.is-animated.is-running .float { animation: trot 0.32s ease-in-out infinite; }
.is-animated.is-running .arm-left { animation: swingL 0.32s ease-in-out infinite alternate; }
.is-animated.is-running .arm-wave { animation: swingR 0.32s ease-in-out infinite alternate; }
.is-animated.is-running .tassel { animation: sway 0.32s ease-in-out infinite; }
.is-running .fx-sweat { animation-duration: 0.8s; }

/* ── Superhéroe ──────────────────────────────── */
.cape { transform-box: view-box; transform-origin: 50px 66px; }
.is-animated .cape { animation: cape 0.45s ease-in-out infinite alternate; }
.mask { transform-box: view-box; transform-origin: 50px 18px; }
.mask.is-off { animation: unmask 0.8s cubic-bezier(0.5, 0, 0.7, 0.4) forwards; }
.is-swinging .arm-left { transform: rotate(70deg); }
.is-swinging .posture { transform: rotate(-8deg); }

/* ── Reacciones al tocarlo ────────────────────── */
.float { transform-box: view-box; transform-origin: 50px 62px; }
.is-animated.is-surprised .posture { animation: startle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.is-surprised .arm-left { transform: rotate(40deg); }
.is-surprised .arm-wave { transform: rotate(-40deg); }
.is-animated.is-giggle .posture { animation: giggle 0.11s linear 10; }
.is-giggle .head-group { transform: rotate(-6deg); }
.is-animated.is-dance .posture { animation: danceSway 0.42s ease-in-out infinite alternate; }
.is-animated.is-dance .arm-left { animation: danceL 0.42s ease-in-out infinite alternate; }
.is-animated.is-dance .arm-wave { animation: danceR 0.42s ease-in-out infinite alternate; }
.is-animated.is-dance .head-group { animation: danceHead 0.42s ease-in-out infinite alternate; }
.is-love .head-group { transform: rotate(-5deg); }
.is-animated.is-love .heart-eyes { transform-origin: center; animation: heartbeat 0.6s ease-in-out infinite; }
.is-love .arm-left { transform: rotate(-20deg); }
.is-love .arm-wave { transform: rotate(20deg); }
.is-animated.is-spin .float { animation: spin 0.8s cubic-bezier(0.5, 0, 0.3, 1) 1; }
.is-spin .arm-left { transform: rotate(120deg); }
.is-spin .arm-wave { transform: rotate(-120deg); }
.is-animated.is-dizzy .head-group { animation: wobble 0.9s ease-in-out infinite; }
.is-animated.is-dizzy .posture { animation: totter 1.8s ease-in-out infinite; }
.spiral { transform-origin: center; }
.is-animated.is-dizzy .spiral { animation: spinSpiral 0.8s linear infinite; }
.fx-stars { transform-box: view-box; transform-origin: 50px 14px; animation: orbit 1.4s linear infinite; }
.fx-hearts path { transform-origin: center; animation: floatUp 1.6s ease-out infinite both; }
.fx-hearts path:nth-child(2) { animation-delay: 0.4s; }
.fx-hearts path:nth-child(3) { animation-delay: 0.8s; }
.fx-ja text, .fx-notes text { animation: floatUp 1.2s ease-out infinite both; }
.fx-ja text:nth-child(2), .fx-notes text:nth-child(2) { animation-delay: 0.5s; }
.fx-bang { transform-origin: center; animation: bang 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

/* ── Dormido ──────────────────────────────────── */
.is-sleep .posture { transform: translateY(3px); }
.is-sleep .head-group { transform: rotate(7deg) translateY(2px); }
.is-animated.is-sleep .float { animation-duration: 5.5s; }
.is-sleep .antenna { opacity: 0.45; }
.fx-zzz text { animation: zzz 2.4s ease-out infinite both; }
.fx-zzz text:nth-child(2) { animation-delay: 0.6s; }
.fx-zzz text:nth-child(3) { animation-delay: 1.2s; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
@keyframes shadow { 0%, 100% { transform: scaleX(1); opacity: 0.25; } 50% { transform: scaleX(0.86); opacity: 0.16; } }
@keyframes blink { 0%, 91%, 97%, 100% { transform: scaleY(1); } 94% { transform: scaleY(0.1); } }
@keyframes glow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.82); } }
@keyframes sway { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(9deg); } }
@keyframes wave {
  0% { transform: rotate(0); }
  18% { transform: rotate(-158deg); }
  32% { transform: rotate(-128deg); }
  46% { transform: rotate(-158deg); }
  60% { transform: rotate(-128deg); }
  74% { transform: rotate(-150deg); }
  100% { transform: rotate(0); }
}
@keyframes read { 0% { transform: translateX(-2.4px); } 70% { transform: translateX(2.4px); } 85%, 100% { transform: translateX(-2.4px); } }
@keyframes nodRead { 0%, 100% { transform: translate(1.5px, 3px) rotate(10deg); } 50% { transform: translate(1.5px, 4px) rotate(12deg); } }
@keyframes ponder { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-1.6px); } 65% { transform: translateX(1.6px); } }
@keyframes antennaSpin { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes bubble { 0% { opacity: 0; transform: scale(0.3); } 35%, 70% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.8) translateY(-2px); } }
@keyframes jump {
  0% { transform: translateY(0) scaleY(1); }
  20% { transform: translateY(1px) scaleY(0.92); }
  50% { transform: translateY(-9px) scaleY(1.04); }
  80% { transform: translateY(0) scaleY(0.96); }
  100% { transform: translateY(0) scaleY(1); }
}
@keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0.2) rotate(0); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes bob { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-2.5px) rotate(8deg); } }
@keyframes sweat { 0% { opacity: 0; transform: translateY(-2px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(7px); } }
@keyframes trot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes swingL { from { transform: rotate(-30deg); } to { transform: rotate(25deg); } }
@keyframes swingR { from { transform: rotate(20deg); } to { transform: rotate(-22deg); } }
@keyframes cape { from { transform: skewX(-7deg); } to { transform: skewX(7deg) scaleY(1.05); } }
@keyframes unmask {
  0% { transform: none; opacity: 1; }
  25% { transform: translateY(-3px) scaleY(1.06); opacity: 1; }
  100% { transform: translate(12px, -75px) rotate(28deg); opacity: 0; }
}
@keyframes startle { 0% { transform: none; } 30% { transform: translateY(-8px) scale(1.05); } 100% { transform: none; } }
@keyframes giggle { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1.6px) rotate(-2deg); } 75% { transform: translateX(1.6px) rotate(2deg); } }
@keyframes danceSway { from { transform: rotate(-9deg) translateY(0); } to { transform: rotate(9deg) translateY(-3px); } }
@keyframes danceL { from { transform: rotate(150deg); } to { transform: rotate(10deg); } }
@keyframes danceR { from { transform: rotate(-10deg); } to { transform: rotate(-150deg); } }
@keyframes danceHead { from { transform: rotate(6deg); } to { transform: rotate(-6deg); } }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.3); } }
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
@keyframes wobble { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg) translateX(2px); } }
@keyframes totter { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes spinSpiral { to { transform: rotate(360deg); } }
@keyframes orbit { to { transform: rotate(360deg); } }
@keyframes floatUp { 0% { opacity: 0; transform: translateY(4px) scale(0.6); } 30% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-10px) scale(0.9); } }
@keyframes bang { from { opacity: 0; transform: scale(0.2) rotate(-20deg); } to { opacity: 1; transform: scale(1) rotate(8deg); } }
@keyframes zzz { 0% { opacity: 0; transform: translate(0, 4px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(4px, -6px); } }

@media (prefers-reduced-motion: reduce) {
  .chapi * { animation: none !important; transition: none !important; }
}
</style>
