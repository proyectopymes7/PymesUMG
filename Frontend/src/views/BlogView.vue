<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import arcoAntigua from '@/assets/arcoAntigua.jpg'
import umgLogo from '@/assets/UMG.png'

const scrollY = ref(0)
let ticking = false

const handleScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      scrollY.value = window.scrollY
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
})

onUnmounted(() => { window.removeEventListener('scroll', handleScroll) })

const pillars = [
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>`, label: 'Ingeniería en Sistemas', bg: '#003049' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>`, label: 'Administración & Marketing', bg: '#C1121F' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`, label: 'Impacto Comunitario', bg: '#669BBC' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>`, label: 'Innovación Local', bg: '#780000' },
]

const impactStats = [
  { value: '100+', label: 'Emprendimientos', sublabel: 'registrados en la plataforma' },
  { value: '4',    label: 'Facultades',      sublabel: 'colaborando en el proyecto' },
  { value: '1',    label: 'Misión',          sublabel: 'conectar Guatemala' },
]

const howItWorks = [
  { num: '01', title: 'Regístrate',  desc: 'Crea tu perfil digital en nuestra plataforma, para dar a conocer tus productos y servicios a nivel nacional.', color: '#003049' },
  { num: '02', title: 'Publica',     desc: 'Solicita la publicación de tu emprendimiento. El equipo lo revisa y aprueba para garantizar calidad y puedas compartir tu negocio con el mundo.',      color: '#C1121F' },
  { num: '03', title: 'Conéctate',   desc: 'Los clientes descubren tu negocio, ven tus productos, te califican y te contactan directamente.',           color: '#669BBC' },
]

const impactItems = [
  { title: 'Visibilidad digital',    desc: 'Pequeños negocios que antes solo se conocían de boca en boca ahora tienen presencia en línea.' },
  { title: 'Geolocalización real',   desc: 'Los clientes encuentran negocios cercanos con mapas y ubicación exacta en toda Guatemala.' },
  { title: 'Reputación construida',  desc: 'Calificaciones y reseñas auténticas que ayudan a los mejores negocios a destacar.' },
  { title: 'Respaldo universitario', desc: 'Tecnología desarrollada con estándares académicos y visión de largo plazo.' },
]

const facultyTags = ['Ingeniería en Sistemas', 'Administración de Empresas', 'Mercadotecnia', 'Chiquimula']

const whyReasons = [
  { title: 'Economía local primero', desc: 'El dinero que circula en negocios locales se reinvierte en la misma comunidad, generando un ciclo virtuoso de prosperidad.' },
  { title: 'Reducir la brecha digital', desc: 'El acceso a tecnología no debe ser privilegio de las grandes empresas. Queremos nivelar el campo de juego.' },
  { title: 'Preservar el emprendimiento', desc: 'Los negocios familiares son patrimonio cultural. Darles visibilidad es una forma de preservar la identidad guatemalteca.' },
]
</script>

<template>
  <div class="page-root">
    <Navbar />

    <!-- ═══ PARALLAX BLOCK — imagen cubre hero + misión ═══ -->
    <div class="parallax-block">
      <div class="parallax-bg-wrap" aria-hidden="true">
        <img
          :src="arcoAntigua"
          alt="Arco de Antigua Guatemala"
          class="parallax-img"
          :style="{ transform: `translateY(${scrollY * 0.2}px)` }"
        />
        <div class="parallax-overlay"></div>
        <div class="parallax-accent"></div>
      </div>

      <!-- HERO -->
      <section class="hero-section">
        <div class="container">
          <div class="reveal fade-up d0 eyebrow-wrap">
            <span class="eyebrow-line"></span>
            <span class="eyebrow-text">AquiTenes</span>
            <span class="eyebrow-line"></span>
          </div>
          <h1 class="reveal fade-up d1 hero-title">
            Nuestra<br><span class="hero-accent">Historia</span>
          </h1>
          <p class="reveal fade-up d2 hero-sub">
            Una plataforma creada para apoyar a los pequeños emprendedores de Guatemala.
          </p>
          <div class="scroll-hint">
            <span class="sh-label">Descubre más</span>
            <div class="sh-line"></div>
          </div>
        </div>
      </section>

      <!-- MISIÓN -->
      <section class="mission-section">
        <div class="container">
          <div class="reveal fade-up d0 badge-wrap">
            <span class="glass-badge">Colaboración Académica</span>
          </div>

          <div class="reveal fade-up d1 mission-card">
            <div class="mission-grid">
              <div class="mission-text">
                <h2 class="mission-heading">
                  Desarrollado con<br>
                  <span style="color:#C1121F;">Pasión</span> y
                  <span style="color:#FDF0D5;">Estrategia</span>
                </h2>
                <p class="mission-body">
                  AquiTenes es una aplicación desarrollada por estudiantes de
                  <strong style="color:#fff;">Ingeniería en Sistemas</strong> con el apoyo de
                  <strong style="color:#fff;">Administración de Empresas con énfasis en Mercadotecnia</strong>.
                </p>
                <p class="mission-body-sec">
                  Nació de la sinergia entre el rigor técnico y la visión comercial, creando una herramienta
                  diseñada para potenciar la economía local guatemalteca y visibilizar a los pequeños
                  emprendedores de Guatemala.
                </p>
                <div class="umg-mini-wrap">
                  <p class="umg-mini-label">Apoyado por</p>
                  <div class="umg-mini-badge">
                    <img :src="umgLogo" alt="UMG" class="umg-mini-logo" />
                    <div>
                      <p class="umg-mini-name">Universidad Mariano Gálvez de Guatemala</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pillars-side">
                <p class="pillars-label">Pilares del proyecto</p>
                <div class="pillars-grid">
                  <div v-for="(p, i) in pillars" :key="i" class="pillar-card" :style="{ background: p.bg }">
                    <svg class="pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="p.icon"></svg>
                    <span class="pillar-label">{{ p.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>
    </div>
    <!-- ═══ FIN PARALLAX BLOCK ═══ -->

    <!-- CÓMO FUNCIONA -->
    <section class="how-section">
      <div class="container">
        <div class="sec-header">
          <div class="reveal fade-up d0 badge-red">¿Qué es AquiTenes?</div>
          <h2 class="reveal fade-up d1 sec-heading">
            El directorio digital<br>de <span style="color:#C1121F;">Guatemala</span>
          </h2>
        </div>
        <div class="how-grid">
          <div
            v-for="(step, i) in howItWorks" :key="i"
            class="reveal fade-up how-card"
            :style="{ transitionDelay: (i * 120) + 'ms' }"
          >
            <div class="how-num" :style="{ color: step.color }">{{ step.num }}</div>
            <h3 class="how-title" :style="{ color: step.color }">{{ step.title }}</h3>
            <p class="how-desc">{{ step.desc }}</p>
            <div class="how-bar" :style="{ '--bar-color': step.color }"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- IMPACTO SOCIAL -->
    <section class="impact-section">
      <div class="container">
        <div class="impact-grid">
          <div class="reveal fade-left d0 quote-side">
            
            <blockquote class="quote-text">
              Cada emprendimiento visible es una familia que crece.
            </blockquote>
            
          </div>
          <div class="reveal fade-right d1 impact-list">
            <div v-for="(item, i) in impactItems" :key="i" class="impact-item">
              <div class="impact-dot"></div>
              <div>
                <h4 class="impact-title">{{ item.title }}</h4>
                <p class="impact-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- POR QUÉ AYUDAMOS A LOS EMPRENDEDORES -->
    <section class="why-section">
      <div class="blob blob-r" aria-hidden="true"></div>
      <div class="blob blob-b" aria-hidden="true"></div>
      <div class="container" style="position:relative;z-index:1;">

        <div class="sec-header">
          <div class="reveal fade-up d0 badge-border">Nuestra razón de ser</div>
          <h2 class="reveal fade-up d1 sec-heading white">
            ¿Por qué apoyamos a los<br><span style="color:#C1121F;">pequeños emprendedores?</span>
          </h2>
        </div>

        <div class="why-grid">

          <!-- Texto principal -->
          <div class="reveal fade-left d1 why-text">
            <p class="why-body">
              Guatemala es un país de emprendedores. Miles de familias sostienen su economía a través de
              pequeños negocios que ofrecen productos únicos, servicios personales y saberes heredados de
              generación en generación.
            </p>
            <p class="why-body">
              Sin embargo, muchos de estos negocios permanecen invisibles sin presencia digital, sin forma
              de llegar a nuevos clientes, sin herramientas para crecer. No porque no tengan calidad, sino
              porque nunca tuvieron acceso a la tecnología.
            </p>
            <p class="why-body">
              AquiTenes nació para cambiar eso. Creemos que cada emprendedor merece ser visto, cada
              producto merece ser encontrado, y cada comunidad merece prosperar con sus propios recursos.
            </p>
            <div class="why-signature">
              <div class="why-sig-line"></div>
              <div>
                <p class="why-sig-name">Equipo AquiTenes</p>
              </div>
            </div>
          </div>

          <!-- Cards de razones -->
          <div class="reveal fade-right d2 why-cards">
            <div class="why-card" v-for="(r, i) in whyReasons" :key="i">
              <div class="why-card-num">{{ String(i+1).padStart(2,'0') }}</div>
              <div>
                <h4 class="why-card-title">{{ r.title }}</h4>
                <p class="why-card-desc">{{ r.desc }}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>

  </div>
</template>

<style scoped>
.page-root { min-height:100vh; background:#fff; overflow-x:hidden; font-family:'Outfit',sans-serif; }
.container { max-width:72rem; margin:0 auto; padding:0 1.5rem; }

/* REVEAL */
.reveal { transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1); }
.fade-up    { opacity:0; transform:translateY(40px); }
.fade-left  { opacity:0; transform:translateX(-40px); }
.fade-right { opacity:0; transform:translateX(40px); }
.reveal.is-revealed { opacity:1!important; transform:none!important; }
.d0{transition-delay:0ms}.d1{transition-delay:130ms}.d2{transition-delay:260ms}

/* PARALLAX */
.parallax-block { position:relative; isolation:isolate; }
.parallax-bg-wrap { position:absolute; inset:0; overflow:hidden; z-index:0; }
.parallax-img { position:absolute; top:-15%; left:0; width:100%; height:130%; object-fit:cover; object-position:center 30%; will-change:transform; transition:transform .1s ease-out; }
.parallax-overlay { position:absolute; inset:0; background:linear-gradient(170deg,rgba(0,30,49,.85) 0%,rgba(0,48,73,.78) 40%,rgba(0,48,73,.92) 70%,rgba(0,20,40,.98) 100%); }
.parallax-accent  { position:absolute; inset:0; background:radial-gradient(ellipse at 78% 14%,rgba(193,18,31,.22) 0%,transparent 55%); }

/* HERO */
.hero-section { position:relative; z-index:1; padding:10rem 0 7rem; text-align:center; }
.eyebrow-wrap { display:inline-flex; align-items:center; gap:.75rem; margin-bottom:2rem; }
.eyebrow-line { display:block; width:2rem; height:1px; background:#C1121F; }
.eyebrow-text { color:#C1121F; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.25em; }
.hero-title   { font-size:clamp(3.5rem,10vw,9rem); font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:-.04em; line-height:1; margin-bottom:2rem; }
.hero-accent  { color:#C1121F; text-shadow:0 0 80px rgba(193,18,31,.45); }
.hero-sub     { color:rgba(253,240,213,.65); font-size:clamp(1rem,2.5vw,1.4rem); max-width:36rem; margin:0 auto; font-weight:500; line-height:1.65; }
.scroll-hint  { margin-top:5rem; display:flex; flex-direction:column; align-items:center; gap:.5rem; opacity:.35; }
.sh-label { color:#fff; font-size:.6rem; font-weight:900; text-transform:uppercase; letter-spacing:.25em; }
.sh-line  { width:1px; height:3rem; background:linear-gradient(to bottom,rgba(255,255,255,.6),transparent); animation:pulse 2s ease-in-out infinite; }
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}

/* MISIÓN */
.mission-section { position:relative; z-index:1; padding:1rem 0 8rem; }
.badge-wrap  { text-align:center; margin-bottom:4rem; }
.glass-badge { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; border:1px solid rgba(193,18,31,.4); color:#C1121F; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; backdrop-filter:blur(10px); background:rgba(255,255,255,.05); }
.mission-card { border-radius:2.5rem; overflow:hidden; background:rgba(255,255,255,.06); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.12); box-shadow:0 40px 80px rgba(0,0,0,.4); }
.mission-grid { display:grid; grid-template-columns:1fr; }
@media(min-width:768px){.mission-grid{grid-template-columns:1fr 1fr}}
.mission-text     { padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; }
.mission-heading  { font-size:clamp(1.75rem,3.5vw,2.75rem); font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:-.03em; line-height:1.05; margin-bottom:1.5rem; }
.mission-body     { color:rgba(253,240,213,.70); font-size:1rem; line-height:1.75; font-weight:500; margin-bottom:1rem; }
.mission-body-sec { color:rgba(253,240,213,.50); font-size:.875rem; line-height:1.75; }
.umg-mini-wrap  { margin-top:2rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,.1); }
.umg-mini-label { color:rgba(253,240,213,.35); font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1rem; }
.umg-mini-badge { display:inline-flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-radius:1rem; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(10px); }
.umg-mini-logo  { height:2.5rem; width:auto; object-fit:contain; filter:brightness(1.1); }
.umg-mini-name  { color:#fff; font-size:.8rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; line-height:1.3; font-family:'Outfit',sans-serif; }
.umg-mini-sub   { color:rgba(253,240,213,.45); font-size:.65rem; font-weight:500; margin-top:.2rem; }
.pillars-side   { padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; border-top:1px solid rgba(255,255,255,.08); }
@media(min-width:768px){.pillars-side{border-top:none;border-left:1px solid rgba(255,255,255,.08)}}
.pillars-label { color:rgba(253,240,213,.35); font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; }
.pillars-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.pillar-card   { aspect-ratio:1; border-radius:1.25rem; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1rem; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,.3); transition:transform .3s ease,box-shadow .3s ease; }
.pillar-card:hover { transform:scale(1.06) translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.4); }
.pillar-icon  { width:1.75rem; height:1.75rem; color:rgba(255,255,255,.85); margin-bottom:.75rem; transition:color .2s; }
.pillar-card:hover .pillar-icon { color:#fff; }
.pillar-label { font-size:.6rem; font-weight:900; text-transform:uppercase; letter-spacing:.07em; color:#fff; line-height:1.35; }
.stats-row { display:grid; grid-template-columns:1fr; gap:1.5rem; max-width:50rem; margin:2.5rem auto 0; }
@media(min-width:768px){.stats-row{grid-template-columns:repeat(3,1fr)}}
.stat-card { text-align:center; padding:2rem 1.5rem; border-radius:1.5rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(10px); transition:transform .3s ease; }
.stat-card:hover{transform:translateY(-4px)}
.stat-val { font-size:3rem; font-weight:900; color:#C1121F; line-height:1; margin-bottom:.35rem; }
.stat-lbl { color:#fff; font-size:.7rem; font-weight:900; text-transform:uppercase; letter-spacing:.15em; }
.stat-sub { color:rgba(253,240,213,.35); font-size:.65rem; margin-top:.25rem; font-weight:500; }

/* CÓMO FUNCIONA */
.how-section { padding:8rem 0; background:#fff; }
.sec-header  { text-align:center; margin-bottom:5rem; }
.badge-red    { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; background:rgba(193,18,31,.1); color:#C1121F; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; }
.badge-border { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; border:1px solid rgba(193,18,31,.35); color:#C1121F; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; }
.sec-heading  { font-size:clamp(2rem,5vw,3.5rem); font-weight:900; color:#003049; text-transform:uppercase; letter-spacing:-.03em; line-height:1.05; }
.sec-heading.white{color:#fff}
.how-grid  { display:grid; grid-template-columns:1fr; gap:2rem; max-width:62rem; margin:0 auto; }
@media(min-width:768px){.how-grid{grid-template-columns:repeat(3,1fr)}}
.how-card  { background:#fff; border:1px solid #f1f5f9; border-radius:2rem; padding:2.5rem; display:flex; flex-direction:column; box-shadow:0 4px 20px rgba(0,0,0,.06); transition:transform .4s ease,box-shadow .4s ease; }
.how-card:hover{transform:translateY(-8px);box-shadow:0 20px 50px rgba(0,0,0,.12)}
.how-num   { font-size:4rem; font-weight:900; line-height:1; margin-bottom:1.25rem; opacity:.12; transition:opacity .3s; }
.how-card:hover .how-num{opacity:.22}
.how-title { font-size:1.5rem; font-weight:900; text-transform:uppercase; letter-spacing:-.02em; margin-bottom:1rem; }
.how-desc  { color:#64748b; font-size:.875rem; line-height:1.75; flex:1; }
.how-bar   { height:3px; border-radius:999px; width:0; margin-top:1.5rem; background:var(--bar-color); transition:width .5s ease; }
.how-card:hover .how-bar{width:100%}

/* IMPACTO */
.impact-section { padding:8rem 0; background:#f8f9fa; }
.impact-grid { max-width:72rem; margin:0 auto; display:grid; grid-template-columns:1fr; gap:4rem; align-items:center; }
@media(min-width:768px){.impact-grid{grid-template-columns:1fr 1fr;gap:5rem}}
.quote-mark  { font-size:6rem; font-weight:900; color:rgba(193,18,31,.18); line-height:1; margin-bottom:.5rem; }
.quote-text  { font-size:clamp(1.5rem,3vw,2.25rem); font-weight:900; color:#003049; text-transform:uppercase; letter-spacing:-.02em; line-height:1.2; }
.quote-attr  { margin-top:2rem; display:flex; align-items:center; gap:1rem; }
.quote-line  { width:3rem; height:3px; background:#C1121F; border-radius:999px; }
.quote-author{ color:#94a3b8; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; }
.impact-list { display:flex; flex-direction:column; gap:1.25rem; }
.impact-item { display:flex; align-items:flex-start; gap:1.25rem; padding:1.25rem; border-radius:1.25rem; background:#fff; border:1px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.04); transition:transform .3s ease,box-shadow .3s ease; }
.impact-item:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.09)}
.impact-title{ color:#003049; font-weight:900; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
.impact-desc { color:#64748b; font-size:.8rem; line-height:1.65; }

/* IMPACTO — dot en lugar de emoji */
.impact-dot { width:10px; height:10px; border-radius:50%; background:#C1121F; flex-shrink:0; margin-top:6px; }

/* POR QUÉ section */
.why-section { padding:8rem 0; background:#003049; position:relative; overflow:hidden; }
.blob { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; }
.blob-r { width:24rem; height:24rem; background:rgba(193,18,31,.09); top:0; right:0; transform:translate(30%,-30%); }
.blob-b { width:20rem; height:20rem; background:rgba(102,155,188,.12); bottom:0; left:0; transform:translate(-30%,30%); }

.why-grid { display:grid; grid-template-columns:1fr; gap:4rem; max-width:68rem; margin:0 auto; }
@media(min-width:768px){ .why-grid { grid-template-columns:1fr 1fr; gap:5rem; align-items:start; } }

.why-body { color:rgba(253,240,213,.68); font-size:1rem; line-height:1.85; margin-bottom:1.5rem; }
.why-signature { display:flex; align-items:center; gap:1.25rem; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,.1); }
.why-sig-line { width:2.5rem; height:3px; background:#C1121F; border-radius:999px; flex-shrink:0; }
.why-sig-name { color:#fff; font-size:.75rem; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }
.why-sig-sub  { color:rgba(253,240,213,.4); font-size:.65rem; margin-top:.2rem; }

.why-cards { display:flex; flex-direction:column; gap:1.25rem; }
.why-card  { display:flex; align-items:flex-start; gap:1.25rem; padding:1.5rem; border-radius:1.25rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); transition:background .3s ease, transform .3s ease; }
.why-card:hover { background:rgba(255,255,255,.07); transform:translateX(6px); }
.why-card-num   { font-size:1.75rem; font-weight:900; color:#C1121F; line-height:1; flex-shrink:0; opacity:.7; }
.why-card-title { color:#fff; font-size:.8rem; font-weight:900; text-transform:uppercase; letter-spacing:.07em; margin-bottom:.4rem; }
.why-card-desc  { color:rgba(253,240,213,.55); font-size:.8rem; line-height:1.65; }
</style>