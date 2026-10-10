// Escenas de entrada de Chapi. Se dibujan cuadro por cuadro con requestAnimationFrame
// para que el movimiento tenga física (péndulo, gravedad, viento) y movimiento secundario.
//
// Cada escena recibe un contexto:
//   actor      elemento fijo de 58×72 px con el dibujo de Chapi
//   cx, cy     centro de la bolita donde termina
//   cancelled  () => true si hay que detenerse
//   track(el)  registra elementos creados para limpiarlos al cancelar
//   setActor   cambia el estado del dibujo ({ state, hero, carry })
//   setRumble  hace temblar la bolita
//   land       rebote de la bolita al recibir a Chapi

const NS = 'http://www.w3.org/2000/svg'
const ACTOR = { w: 58, h: 72 }
// Mano levantada (estado "swinging") respecto al centro del dibujo
const HAND = { x: 23, y: -12 }

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const rad = (deg) => deg * Math.PI / 180
const ease = {
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: (t) => 1 - (1 - t) ** 3,
  outQuad: (t) => 1 - (1 - t) ** 2,
  inQuad: (t) => t * t
}
const bezier = (p0, p1, p2, t) => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
})
const frame = () => new Promise(resolve => requestAnimationFrame(resolve))

// Ejecuta una animación de `ms` milisegundos: onFrame(t de 0 a 1, dt en segundos, tiempo total)
async function run (ctx, ms, onFrame) {
  const start = performance.now()
  let last = start
  for (;;) {
    const now = await frame()
    if (ctx.cancelled()) return false
    const t = Math.min(1, (now - start) / ms)
    onFrame(t, Math.min(0.05, (now - last) / 1000), (now - start) / 1000)
    last = now
    if (t >= 1) return true
  }
}

function place (ctx, x, y, { rot = 0, sx = 1, sy = 1, opacity = 1 } = {}) {
  const el = ctx.actor
  el.style.transform = `translate(${x - ACTOR.w / 2}px, ${y - ACTOR.h / 2}px) rotate(${rot}deg) scale(${sx}, ${sy})`
  el.style.opacity = String(opacity)
}

// Coloca a Chapi para que su mano levantada quede en el punto (x, y)
function hangFrom (ctx, x, y, rot, opts = {}) {
  const r = rad(rot)
  const ox = HAND.x * Math.cos(r) - HAND.y * Math.sin(r)
  const oy = HAND.x * Math.sin(r) + HAND.y * Math.cos(r)
  place(ctx, x - ox, y - oy, { rot, ...opts })
}

const setWind = (ctx, deg) => ctx.actor.style.setProperty('--wind', `${deg.toFixed(1)}deg`)

// Capa de escenario a pantalla completa (debajo de la bolita y de Chapi)
function overlay (ctx, inner, z = 199) {
  const W = window.innerWidth
  const H = window.innerHeight
  const wrap = document.createElement('div')
  wrap.setAttribute('aria-hidden', 'true')
  Object.assign(wrap.style, { position: 'fixed', inset: '0', zIndex: String(z), pointerEvents: 'none', opacity: '0' })
  wrap.innerHTML = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible">${inner}</svg>`
  document.body.appendChild(wrap)
  ctx.track(wrap)
  return wrap
}

const fadeIn = (el, ms = 350) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'forwards', easing: 'ease-out' })
const fadeOutAndRemove = (el, ms = 500) => {
  const anim = el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: ms, fill: 'forwards', easing: 'ease-in' })
  anim.onfinish = () => el.remove()
}

// Estela: copia tenue de Chapi que se desvanece
function ghost (ctx, opacity = 0.28) {
  const g = ctx.actor.cloneNode(true)
  g.style.opacity = String(opacity)
  g.style.zIndex = '200'
  document.body.appendChild(g)
  ctx.track(g)
  const anim = g.animate([{ opacity }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' })
  anim.onfinish = () => g.remove()
}

// Polvito al aterrizar
function dust (ctx, x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span')
    const size = 6 + Math.random() * 6
    Object.assign(s.style, {
      position: 'fixed', left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px`,
      borderRadius: '50%', background: 'rgba(170, 160, 150, 0.55)', zIndex: '200', pointerEvents: 'none'
    })
    document.body.appendChild(s)
    ctx.track(s)
    const dir = (i % 2 ? 1 : -1) * (8 + Math.random() * 18)
    const anim = s.animate([
      { transform: 'translate(0, 0) scale(0.5)', opacity: 0.8 },
      { transform: `translate(${dir}px, ${-6 - Math.random() * 8}px) scale(1.6)`, opacity: 0 }
    ], { duration: 520 + Math.random() * 200, easing: 'ease-out', fill: 'forwards' })
    anim.onfinish = () => s.remove()
  }
}

// Chispas con gravedad que rebotan en el borde inferior de la pantalla
function sparks (ctx, x, y, count = 30) {
  const colors = ['#C1121F', '#F2B33D', '#ff7a1a', '#FDF0D5', '#ff4d2e']
  const floor = window.innerHeight - 3
  const parts = Array.from({ length: count }, (_, i) => {
    const el = document.createElement('span')
    const size = 3 + Math.random() * 5
    Object.assign(el.style, {
      position: 'fixed', left: '0', top: '0', width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: colors[i % colors.length], boxShadow: '0 0 8px rgba(255, 122, 26, 0.8)', zIndex: '202', pointerEvents: 'none'
    })
    document.body.appendChild(el)
    ctx.track(el)
    const angle = rad(-90 + (Math.random() - 0.5) * 120)
    const speed = 260 + Math.random() * 420
    return { el, size, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.3 + Math.random() * 0.9, age: 0 }
  })
  run(ctx, 2400, (_t, dt) => {
    for (const p of parts) {
      if (p.age > p.life) continue
      p.age += dt
      p.vy += 980 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.y > floor) { p.y = floor; p.vy *= -0.42; p.vx *= 0.7 }
      p.el.style.transform = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px)`
      p.el.style.opacity = String(clamp(1 - p.age / p.life, 0, 1))
    }
  }).finally(() => parts.forEach(p => p.el.remove()))
}

// ════════════════════════════════════════════════════════════
// Superhéroe: se columpia de edificio en edificio con física de péndulo
// ════════════════════════════════════════════════════════════
export async function swingScene (ctx) {
  const { cx, cy } = ctx
  const W = window.innerWidth
  const H = window.innerHeight
  const k = clamp((cx - 60) / 620, 0.5, 1)
  const anchors = [
    { x: cx - 560 * k, y: Math.max(30, cy - 390), L: 190 * k + 40 },
    { x: cx - 320 * k, y: Math.max(30, cy - 340), L: 175 * k + 35 },
    { x: cx - 120 * k, y: Math.max(30, cy - 280), L: 140 * k + 35 }
  ]
  const [a0, a1, a2] = anchors

  // Pueblo en silueta: volcán al fondo, edificio, iglesia con torre, casas con tejas y un poste de luz
  const navy = '#0b2f47'
  const wall = '#164564'
  const roof = '#7a2e22'
  const windows = []
  for (let y = a0.y + 34; y < H - 24; y += 26) {
    for (const dx of [-24, -6, 12]) windows.push(`<rect x="${a0.x + dx}" y="${y}" width="10" height="12" rx="1.5" fill="#F2B33D" opacity="${(0.25 + Math.random() * 0.5).toFixed(2)}"/>`)
  }
  const house = (x, w, h) => `<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="${wall}"/><path d="M${x - 6} ${H - h} L${x + w / 2} ${H - h - 22} L${x + w + 6} ${H - h}Z" fill="${roof}"/><rect x="${x + w / 2 - 8}" y="${H - h + 18}" width="16" height="${h - 18}" rx="7" fill="${navy}"/>`
  const scene = overlay(ctx, `
    <defs>
      <linearGradient id="town-fade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.18" stop-color="#fff" stop-opacity="1"/>
      </linearGradient>
      <mask id="town-mask"><rect x="${a0.x - 220}" y="0" width="${W - a0.x + 240}" height="${H}" fill="url(#town-fade)"/></mask>
    </defs>
    <g mask="url(#town-mask)" opacity="0.92">
      <path d="M${cx - 780 * k} ${H} L${cx - 470 * k} ${H - 300} Q${cx - 450 * k} ${H - 312} ${cx - 430 * k} ${H - 300} L${cx - 120 * k} ${H}Z" fill="#669BBC" opacity="0.32"/>
      ${house(a0.x - 150, 84, 70)}${house(a1.x + 110, 80, 60)}${house(a2.x + 40, 76, 54)}
      <rect x="${a0.x - 32}" y="${a0.y + 16}" width="64" height="${H - a0.y}" rx="2" fill="${navy}"/>
      <line x1="${a0.x}" y1="${a0.y}" x2="${a0.x}" y2="${a0.y + 16}" stroke="${navy}" stroke-width="3"/>
      ${windows.join('')}
      <rect x="${a1.x + 10}" y="${H - 118}" width="92" height="118" fill="${wall}"/>
      <path d="M${a1.x + 10} ${H - 118} Q${a1.x + 56} ${H - 150} ${a1.x + 102} ${H - 118}Z" fill="${wall}"/>
      <path d="M${a1.x + 44} ${H} v-40 a12 12 0 0 1 24 0 v40z" fill="${navy}"/>
      <path d="M${a1.x + 24} ${H - 80} v-14 a6 6 0 0 1 12 0 v14z M${a1.x + 76} ${H - 80} v-14 a6 6 0 0 1 12 0 v14z" fill="#F2B33D" opacity="0.5"/>
      <rect x="${a1.x - 12}" y="${a1.y + 26}" width="24" height="${H}" fill="${navy}"/>
      <path d="M${a1.x - 15} ${a1.y + 28} L${a1.x} ${a1.y + 10} L${a1.x + 15} ${a1.y + 28}Z" fill="${navy}"/>
      <path d="M${a1.x - 5} ${a1.y + 58} v-8 a5 5 0 0 1 10 0 v8z" fill="#F2B33D" opacity="0.6"/>
      <line x1="${a1.x}" y1="${a1.y}" x2="${a1.x}" y2="${a1.y + 12}" stroke="${navy}" stroke-width="3"/>
      <line x1="${a1.x - 5}" y1="${a1.y + 4}" x2="${a1.x + 5}" y2="${a1.y + 4}" stroke="${navy}" stroke-width="3"/>
      <line x1="${a2.x}" y1="${a2.y}" x2="${a2.x}" y2="${H}" stroke="${navy}" stroke-width="6" stroke-linecap="round"/>
      <line x1="${a2.x - 20}" y1="${a2.y + 16}" x2="${a2.x + 20}" y2="${a2.y + 16}" stroke="${navy}" stroke-width="4" stroke-linecap="round"/>
      <path d="M${a2.x + 20} ${a2.y + 16} Q${(a2.x + W) / 2} ${a2.y + 60} ${W + 10} ${a2.y + 30}" fill="none" stroke="${navy}" stroke-width="1.4"/>
      <path d="M${a2.x - 20} ${a2.y + 16} Q${(a2.x + a1.x) / 2} ${a2.y + 64} ${a1.x + 12} ${a1.y + 60}" fill="none" stroke="${navy}" stroke-width="1.4"/>
    </g>
    <line id="rope-a" stroke="#FDF0D5" stroke-width="2.4" stroke-linecap="round" opacity="0"/>
    <line id="rope-b" stroke="#C1121F" stroke-width="2.4" stroke-dasharray="5 7" opacity="0"/>
  `)
  fadeIn(scene)
  const ropes = [...scene.querySelectorAll('line[id^="rope"]')]
  const setRope = (A, E, opacity = 1) => ropes.forEach(l => {
    l.setAttribute('x1', A.x); l.setAttribute('y1', A.y); l.setAttribute('x2', E.x); l.setAttribute('y2', E.y)
    l.setAttribute('opacity', opacity)
  })
  const hideRope = () => ropes.forEach(l => l.setAttribute('opacity', 0))

  ctx.setActor({ state: 'swinging', hero: true, carry: false })
  const BACK = -68
  const FWD = 50
  const onRope = (A, th) => ({ x: A.x + A.L * Math.sin(rad(th)), y: A.y + A.L * Math.cos(rad(th)) })
  const handAt = (p, rot) => p // la mano es el extremo del hilo

  // Entrada: salta desde fuera de la pantalla y lanza el primer hilo
  const start = { x: -80, y: a0.y + a0.L * 0.5 }
  const catch0 = onRope(a0, BACK)
  const ctrl0 = { x: (start.x + catch0.x) / 2, y: Math.min(start.y, catch0.y) - 70 }
  if (!await run(ctx, 430, (t) => {
    const p = bezier(start, ctrl0, catch0, t)
    hangFrom(ctx, p.x, p.y, lerp(40, -BACK, t))
    setWind(ctx, -18)
    if (t > 0.6) setRope(a0, handAt(p), (t - 0.6) / 0.4)
  })) return false

  let frameNo = 0
  for (let i = 0; i < anchors.length; i++) {
    const A = anchors[i]
    let prevTh = BACK
    // Balanceo: rápido abajo, lento en los extremos (como un péndulo)
    if (!await run(ctx, 920, (t, dt) => {
      const th = lerp(BACK, FWD, ease.inOutSine(t))
      const omega = dt > 0 ? (th - prevTh) / dt : 0
      prevTh = th
      const p = onRope(A, th)
      hangFrom(ctx, p.x, p.y, -th)
      setRope(A, p)
      setWind(ctx, clamp(-omega * 0.11, -30, 30))
      if (t > 0.3 && t < 0.7 && ++frameNo % 3 === 0) ghost(ctx, 0.18)
    })) return false

    const release = onRope(A, FWD)
    const tangent = { x: Math.cos(rad(FWD)), y: -Math.sin(rad(FWD)) }

    if (i < anchors.length - 1) {
      // Vuelo hasta el siguiente hilo: se suelta, gira y lanza el hilo nuevo
      const B = anchors[i + 1]
      const target = onRope(B, BACK)
      const dist = Math.hypot(target.x - release.x, target.y - release.y)
      const ctrl = { x: release.x + tangent.x * dist * 0.45, y: release.y + tangent.y * dist * 0.45 - 30 }
      if (!await run(ctx, 380, (t) => {
        const p = bezier(release, ctrl, target, t)
        hangFrom(ctx, p.x, p.y, lerp(-FWD, -BACK, ease.inOutSine(t)))
        setWind(ctx, 22)
        if (t < 0.25) setRope(A, { x: lerp(p.x, A.x, t / 0.25), y: lerp(p.y, A.y, t / 0.25) }, 1 - t / 0.25)
        else if (t > 0.65) setRope(B, p, (t - 0.65) / 0.35)
        else hideRope()
      })) return false
    } else {
      // Último salto: voltereta completa y se mete en la bolita
      hideRope()
      ctx.setActor({ state: 'happy', hero: true })
      const end = { x: cx, y: cy }
      const ctrl = { x: (release.x + end.x) / 2 + 20, y: Math.min(release.y, end.y) - 90 }
      if (!await run(ctx, 680, (t) => {
        const p = bezier(release, ctrl, end, ease.inOutSine(t))
        const s = t > 0.75 ? lerp(1, 0.3, (t - 0.75) / 0.25) : 1
        place(ctx, p.x, p.y, { rot: -FWD + 360 * ease.inOutSine(t), sx: s, sy: s, opacity: t > 0.85 ? lerp(1, 0, (t - 0.85) / 0.15) : 1 })
        setWind(ctx, 16)
        if (++frameNo % 2 === 0 && t < 0.85) ghost(ctx, 0.22)
      })) return false
    }
  }
  ctx.land()
  fadeOutAndRemove(scene, 600)
  return true
}

// ════════════════════════════════════════════════════════════
// Barrilete: baja planeando con viento irregular; la cola sigue la trayectoria
// ════════════════════════════════════════════════════════════
const KITE_COLORS = ['#C1121F', '#669BBC', '#F2B33D', '#003049']
const kiteSvg = () => {
  const r = 30
  const pt = (deg, rr = r) => `${(rr * Math.cos(rad(deg - 90))).toFixed(2)} ${(rr * Math.sin(rad(deg - 90))).toFixed(2)}`
  const wedges = Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${pt(i * 45)} A${r} ${r} 0 0 1 ${pt((i + 1) * 45)}Z" fill="${KITE_COLORS[i % 4]}"/>`).join('')
  return `
    <circle r="35" fill="none" stroke="#C1121F" stroke-width="7" stroke-dasharray="4 6"/>
    <circle r="35" fill="none" stroke="#F2B33D" stroke-width="7" stroke-dasharray="3 7" stroke-dashoffset="5"/>
    <circle r="35" fill="none" stroke="#669BBC" stroke-width="7" stroke-dasharray="2 8" stroke-dashoffset="9"/>
    ${wedges}
    <circle r="30" fill="none" stroke="#FDF0D5" stroke-width="1.4"/>
    <circle r="18" fill="none" stroke="#FDF0D5" stroke-width="4" stroke-dasharray="2.5 2.5"/>
    <circle r="10" fill="#780000"/>
    <rect x="-4.5" y="-4.5" width="9" height="9" fill="#FDF0D5"/>
    <rect x="-4.5" y="-4.5" width="9" height="9" fill="#FDF0D5" transform="rotate(45)"/>
    <circle r="2.6" fill="#C1121F"/>`
}

const cloudPath = 'M0 22 a13 13 0 0 1 20 -11 a17 17 0 0 1 32 3 a12 12 0 0 1 6 23 h-52 a9 9 0 0 1 -6 -15z'

export async function kiteScene (ctx) {
  const { cx, cy } = ctx
  const W = window.innerWidth
  const scene = overlay(ctx, `
    <style>
      .wind { stroke-dasharray: 60 240; animation: windDash 1.6s linear infinite; }
      .wind:nth-of-type(2) { animation-delay: .5s } .wind:nth-of-type(3) { animation-delay: 1s }
      @keyframes windDash { from { stroke-dashoffset: 300 } to { stroke-dashoffset: 0 } }
    </style>
    <g id="clouds" fill="#ffffff">
      <path d="${cloudPath}" transform="translate(${W * 0.15} 70) scale(1.6)" opacity="0.85"/>
      <path d="${cloudPath}" transform="translate(${W * 0.5} 40) scale(1.1)" opacity="0.7"/>
      <path d="${cloudPath}" transform="translate(${W * 0.78} 110) scale(1.35)" opacity="0.8"/>
    </g>
    <g fill="none" stroke="#FDF0D5" stroke-width="2" stroke-linecap="round" opacity="0.7">
      <path class="wind" d="M${cx - 520} 160 q120 -30 240 0 t240 0"/>
      <path class="wind" d="M${cx - 440} 250 q110 -26 220 0 t220 0"/>
      <path class="wind" d="M${cx - 600} 330 q130 -30 260 0 t260 0"/>
    </g>
    <polyline id="tail-a" fill="none" stroke="#C1121F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline id="tail-b" fill="none" stroke="#669BBC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <line id="string" stroke="#FDF0D5" stroke-width="1.4"/>
    <g id="kite">${kiteSvg()}</g>
  `, 200)
  fadeIn(scene)
  const kite = scene.querySelector('#kite')
  const string = scene.querySelector('#string')
  const tails = [scene.querySelector('#tail-a'), scene.querySelector('#tail-b')]
  const clouds = [...scene.querySelectorAll('#clouds path')]
  const cloudX = clouds.map(c => Number(c.getAttribute('transform').match(/translate\(([\d.-]+)/)[1]))
  const history = []

  ctx.setActor({ state: 'swinging', hero: false, carry: false })
  const handEnd = { x: cx + HAND.x, y: cy - 70 + HAND.y }
  const handStart = { x: Math.max(60, cx - 280), y: -170 }
  let prev = { ...handStart }
  let swing = 0
  let swingV = 0
  let kitePos = { x: handStart.x, y: handStart.y - 110 }
  let kiteRot = 0

  const drawKite = (time) => {
    kite.setAttribute('transform', `translate(${kitePos.x.toFixed(1)} ${kitePos.y.toFixed(1)}) rotate(${kiteRot.toFixed(1)})`)
    const bottom = { x: kitePos.x - Math.sin(rad(kiteRot)) * 30, y: kitePos.y + Math.cos(rad(kiteRot)) * 30 }
    history.unshift(bottom)
    if (history.length > 22) history.pop()
    tails.forEach((tail, j) => tail.setAttribute('points', history.map((p, n) =>
      `${(p.x - 18 + j * 8 + Math.sin(time * 6 + n * 0.6 + j) * n * 0.7).toFixed(1)},${(p.y + n * 2.4).toFixed(1)}`).join(' ')))
    clouds.forEach((c, j) => {
      cloudX[j] += 0.25 + j * 0.1
      c.setAttribute('transform', c.getAttribute('transform').replace(/translate\([\d.-]+/, `translate(${cloudX[j].toFixed(1)}`))
    })
    return bottom
  }

  // Descenso planeando con ráfagas de viento
  if (!await run(ctx, 3600, (t, dt, time) => {
    const fade = (1 - t) ** 1.2
    const gust = Math.sin(t * 9.2) * 60 * fade + Math.sin(t * 21 + 1.3) * 14 * fade
    const hand = {
      x: lerp(handStart.x, handEnd.x, ease.inOutSine(t)) + gust,
      y: lerp(handStart.y, handEnd.y, ease.outQuad(t))
    }
    const vx = dt > 0 ? (hand.x - prev.x) / dt : 0
    prev = hand
    // Chapi cuelga del hilo con retraso, como péndulo amortiguado
    const target = clamp(-vx * 0.06, -28, 28)
    swingV += ((target - swing) * 38 - swingV * 6) * dt
    swing += swingV * dt
    kitePos = { x: hand.x + Math.sin(time * 3.1) * 9 + vx * 0.05, y: hand.y - 112 + Math.sin(time * 2.3) * 5 }
    kiteRot = clamp(vx * 0.05, -26, 26) + Math.sin(time * 5) * 4
    const bottom = drawKite(time)
    string.setAttribute('x1', bottom.x); string.setAttribute('y1', bottom.y)
    string.setAttribute('x2', hand.x); string.setAttribute('y2', hand.y)
    hangFrom(ctx, hand.x, hand.y, swing)
    setWind(ctx, clamp(-swingV * 0.3, -20, 20))
  })) return false

  // Chapi se suelta; el barrilete flota un momento y se va con el viento
  string.setAttribute('opacity', '0')
  const drop = { x: handEnd.x - HAND.x, y: handEnd.y - HAND.y }
  const kiteStart = { ...kitePos }
  run(ctx, 2600, (t, _dt, time) => {
    const hover = t < 0.4
    const away = hover ? 0 : ease.inQuad((t - 0.4) / 0.6)
    kitePos = {
      x: kiteStart.x + Math.sin(time * 2.6) * 10 + away * 320,
      y: kiteStart.y - (hover ? Math.sin(t / 0.4 * Math.PI) * 26 : 0) - away * (kiteStart.y + 200)
    }
    kiteRot = Math.sin(time * 4) * 8 + away * 30
    drawKite(time)
  }).then(() => fadeOutAndRemove(scene, 400))

  ctx.setActor({ state: 'happy', hero: false })
  if (!await run(ctx, 560, (t) => {
    const s = lerp(1, 0.32, ease.inQuad(t))
    place(ctx, drop.x, lerp(drop.y, cy, ease.inQuad(t)), { rot: 0, sx: s, sy: s * (t > 0.6 ? 1.1 : 1), opacity: t > 0.8 ? lerp(1, 0, (t - 0.8) / 0.2) : 1 })
  })) return false
  ctx.land()
  return true
}

// ════════════════════════════════════════════════════════════
// Volcán: sube detrás de la bolita, humea, hace erupción y lanza a Chapi
// ════════════════════════════════════════════════════════════
export async function volcanoScene (ctx) {
  const { cx, cy } = ctx
  const H = window.innerHeight
  const k = clamp((cx - 60) / 520, 0.45, 1)
  const vx = cx - 190 * k
  const vy = Math.max(120, cy - 190)
  const base = 280 * k + 60
  const scene = overlay(ctx, `
    <defs>
      <linearGradient id="lava" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffb347"/><stop offset="0.5" stop-color="#ff7a1a"/><stop offset="1" stop-color="#C1121F" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4a3a40"/><stop offset="1" stop-color="#231b20"/>
      </linearGradient>
      <radialGradient id="crater-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse id="glow" cx="${vx}" cy="${vy}" rx="60" ry="30" fill="url(#crater-glow)" opacity="0"/>
    <path d="M${vx - base} ${H + 20} Q${vx - base * 0.35} ${vy + 120} ${vx - 30} ${vy + 6} Q${vx} ${vy + 16} ${vx + 30} ${vy + 6} Q${vx + base * 0.35} ${vy + 120} ${vx + base} ${H + 20}Z" fill="url(#rock)"/>
    <path d="M${vx - base * 0.55} ${H + 20} Q${vx - base * 0.2} ${vy + 150} ${vx - 20} ${vy + 30} L${vx + 20} ${vy + 30} Q${vx + base * 0.2} ${vy + 150} ${vx + base * 0.55} ${H + 20}Z" fill="#3a2e33" opacity="0.7"/>
    <path id="lava1" d="M${vx - 14} ${vy + 10} q-16 60 -60 ${H - vy}" fill="none" stroke="url(#lava)" stroke-width="8" stroke-linecap="round" opacity="0"/>
    <path id="lava2" d="M${vx + 12} ${vy + 10} q20 70 50 ${H - vy}" fill="none" stroke="url(#lava)" stroke-width="6" stroke-linecap="round" opacity="0"/>
  `)
  const rise = scene.animate([{ opacity: 1, transform: 'translateY(320px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' })
  try { await rise.finished } catch { return false }
  if (ctx.cancelled()) return false

  // Tiembla, el cráter brilla y echa humo; la bolita también tiembla
  ctx.setRumble(true)
  const glow = scene.querySelector('#glow')
  glow.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], { duration: 1100, fill: 'forwards' })
  const shake = scene.animate([
    { transform: 'translate(0, 0)' }, { transform: 'translate(-2px, 1px)' }, { transform: 'translate(2px, -1px)' }, { transform: 'translate(0, 0)' }
  ], { duration: 120, iterations: 9 })
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('span')
    const size = 16 + Math.random() * 18
    Object.assign(s.style, { position: 'fixed', left: `${vx - size / 2}px`, top: `${vy - size / 2}px`, width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'rgba(110, 105, 115, 0.55)', filter: 'blur(2px)', zIndex: '199', pointerEvents: 'none' })
    document.body.appendChild(s)
    ctx.track(s)
    const anim = s.animate([
      { transform: 'translate(0, 0) scale(0.4)', opacity: 0.9 },
      { transform: `translate(${(Math.random() - 0.5) * 60}px, ${-110 - Math.random() * 70}px) scale(1.9)`, opacity: 0 }
    ], { duration: 1400, delay: i * 150, easing: 'ease-out', fill: 'backwards' })
    anim.onfinish = () => s.remove()
  }
  if (!await run(ctx, 1100, () => {})) { shake.cancel(); return false }
  ctx.setRumble(false)
  scene.querySelectorAll('[id^="lava"]').forEach(l => l.animate([{ opacity: 0 }, { opacity: 0.95 }], { duration: 400, fill: 'forwards' }))

  // Erupción: chispas con gravedad y Chapi sale disparado del cráter, gira y cae en arco a la bolita
  sparks(ctx, vx, vy, 34)
  ctx.setActor({ state: 'surprised', hero: false, carry: false })
  const peak = { x: (vx + cx) / 2, y: Math.max(40, vy - 230) }
  let frameNo = 0
  let prev = { x: vx, y: vy }
  if (!await run(ctx, 1800, (t, dt) => {
    // Subida rápida que frena arriba y caída que acelera (parábola)
    let x, y
    if (t < 0.45) {
      const u = ease.outCubic(t / 0.45)
      x = lerp(vx, peak.x, u)
      y = lerp(vy, peak.y, u)
    } else {
      const u = ease.inQuad((t - 0.45) / 0.55)
      x = lerp(peak.x, cx, (t - 0.45) / 0.55)
      y = lerp(peak.y, cy, u)
    }
    const speed = dt > 0 ? Math.hypot(x - prev.x, y - prev.y) / dt : 0
    prev = { x, y }
    const s = t < 0.12 ? lerp(0.4, 1, t / 0.12) : t > 0.85 ? lerp(1, 0.3, (t - 0.85) / 0.15) : 1
    const o = t < 0.06 ? t / 0.06 : t > 0.92 ? lerp(1, 0, (t - 0.92) / 0.08) : 1
    place(ctx, x, y, { rot: 1080 * ease.inOutSine(t), sx: s, sy: s, opacity: o })
    if (speed > 300 && ++frameNo % 2 === 0) ghost(ctx, 0.25)
  })) return false
  ctx.land()
  scene.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(340px)' }], { duration: 800, delay: 600, easing: 'ease-in', fill: 'forwards' }).onfinish = () => scene.remove()
  return true
}

// ════════════════════════════════════════════════════════════
// Llega tarde: corre por la banqueta (postes y fachadas en paralaje) con su maletín
// ════════════════════════════════════════════════════════════
export async function lateScene (ctx) {
  const { cx, cy } = ctx
  const W = window.innerWidth
  const H = window.innerHeight
  const ground = cy + 30
  const distance = Math.min(360, cx - 40)
  const posts = Array.from({ length: 10 }, (_, i) => {
    const x = i * 150 + 60
    return `<line x1="${x}" y1="${ground}" x2="${x}" y2="${ground - 110}" stroke="#0b2f47" stroke-width="5" stroke-linecap="round"/><path d="M${x} ${ground - 110} q16 -4 24 6" fill="none" stroke="#0b2f47" stroke-width="4" stroke-linecap="round"/><circle cx="${x + 24}" cy="${ground - 102}" r="5" fill="#F2B33D" opacity="0.85"/>`
  }).join('')
  const fronts = Array.from({ length: 8 }, (_, i) => {
    const x = i * 190
    const h = 70 + (i % 3) * 18
    return `<rect x="${x}" y="${ground - h}" width="170" height="${h}" fill="#164564" opacity="0.55"/><path d="M${x - 6} ${ground - h} h182 l-10 -14 h-162z" fill="#7a2e22" opacity="0.6"/><rect x="${x + 20}" y="${ground - h + 18}" width="34" height="26" rx="2" fill="#F2B33D" opacity="0.35"/><rect x="${x + 110}" y="${ground - 42}" width="28" height="42" rx="12" fill="#0b2f47" opacity="0.6"/>`
  }).join('')
  const left = Math.max(0, cx - distance - 160)
  const scene = overlay(ctx, `
    <defs>
      <linearGradient id="street-fade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.25" stop-color="#fff" stop-opacity="1"/>
      </linearGradient>
      <mask id="street-mask"><rect x="${left}" y="0" width="${W - left}" height="${H}" fill="url(#street-fade)"/></mask>
    </defs>
    <g mask="url(#street-mask)">
      <g id="fronts" opacity="0.6">${fronts}</g>
      <rect x="0" y="${ground}" width="${W}" height="${H - ground + 10}" fill="#0b2f47" opacity="0.5"/>
      <rect x="0" y="${ground}" width="${W}" height="3" fill="#FDF0D5" opacity="0.6"/>
      <g id="posts">${posts}</g>
    </g>
  `)
  fadeIn(scene, 300)
  const fronts$ = scene.querySelector('#fronts')
  const posts$ = scene.querySelector('#posts')
  const parallax = (t) => {
    fronts$.setAttribute('transform', `translate(${(-140 * t).toFixed(1)} 0)`)
    posts$.setAttribute('transform', `translate(${(-380 * t).toFixed(1)} 0)`)
  }

  ctx.setActor({ state: 'running', hero: false, carry: true })
  const baseY = cy - 4
  const x0 = cx - distance
  const total = 2900
  let elapsed = 0
  const segment = async (ms, fn) => {
    const ok = await run(ctx, ms, (t, dt) => { elapsed += dt * 1000; parallax(Math.min(1, elapsed / total)); fn(t) })
    return ok
  }

  // Sale de abajo de la pantalla con un salto
  if (!await segment(420, (t) => place(ctx, x0, lerp(H + 60, baseY, ease.outCubic(t)) - Math.sin(t * Math.PI) * 50))) return false
  if (!await segment(90, (t) => place(ctx, x0, baseY, { sx: lerp(1.15, 1, t), sy: lerp(0.84, 1, t) }))) return false
  dust(ctx, x0, ground)

  // Tres saltitos: se agacha, salta y se aplasta al caer
  const hops = 3
  const stop = cx - 70
  for (let i = 0; i < hops; i++) {
    const from = lerp(x0, stop, i / hops)
    const to = lerp(x0, stop, (i + 1) / hops)
    if (!await segment(70, (t) => place(ctx, from, baseY + 3 * t, { sx: 1 + 0.08 * t, sy: 1 - 0.1 * t }))) return false
    if (!await segment(330, (t) => place(ctx, lerp(from, to, t), baseY - 30 * 4 * t * (1 - t), { sx: 0.95, sy: 1.06 }))) return false
    if (!await segment(90, (t) => place(ctx, to, baseY, { sx: lerp(1.15, 1, t), sy: lerp(0.84, 1, t) }))) return false
    dust(ctx, to, ground, 4)
  }

  // Anticipación y gran salto a la bolita
  if (!await segment(150, (t) => place(ctx, stop, baseY + 5 * t, { sx: 1 + 0.12 * t, sy: 1 - 0.16 * t }))) return false
  ctx.setActor({ state: 'happy', hero: false, carry: true })
  let frameNo = 0
  if (!await segment(560, (t) => {
    const x = lerp(stop, cx, t)
    const y = lerp(baseY, cy, t) - 80 * 4 * t * (1 - t)
    const s = t > 0.7 ? lerp(1, 0.3, (t - 0.7) / 0.3) : 1
    place(ctx, x, y, { rot: 20 * t, sx: s, sy: s, opacity: t > 0.85 ? lerp(1, 0, (t - 0.85) / 0.15) : 1 })
    if (++frameNo % 3 === 0 && t < 0.8) ghost(ctx, 0.2)
  })) return false
  ctx.land()
  fadeOutAndRemove(scene, 500)
  return true
}
