<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'
import arcoAntigua from '@/assets/fontabella.jpg'
import umgLogo from '@/assets/UMG.png'
import paisaje from '@/assets/alfombra.jpg'
import mercado from '@/assets/mercado.jpg'

let parallaxEl = null

const handleScroll = () => {
  if (!parallaxEl) return
  parallaxEl.style.transform = `translateY(${window.scrollY * 0.2}px)`
}

onMounted(() => {
  document.documentElement.style.scrollBehavior = 'smooth'
  parallaxEl = document.querySelector('.parallax-img')
  window.addEventListener('scroll', handleScroll, { passive: true })
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.05 })
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
})

onUnmounted(() => { window.removeEventListener('scroll', handleScroll) })

const pillars = [
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>`, label: 'Ingeniería en Sistemas', bg: '#003049' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>`, label: 'Administración & Marketing', bg: '#C1121F' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`, label: 'Impacto Comunitario', bg: '#669BBC' },
  { icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>`, label: 'Innovación Local', bg: '#780000' },
]

const howItWorks = [
  { num: '01', title: 'Regístrate',  desc: 'Crea tu perfil digital en nuestra plataforma, para dar a conocer tus productos y servicios a nivel nacional.', color: '#C1121F' },
  { num: '02', title: 'Publica',     desc: 'Solicita la publicación de tu emprendimiento. El equipo lo revisa y aprueba para garantizar calidad y puedas compartir tu negocio con el mundo.', color: '#FDF0D5' },
  { num: '03', title: 'Conéctate',   desc: 'Los clientes descubren tu negocio, ven tus productos, te califican y te contactan directamente.', color: '#669BBC' },
]

const impactItems = [
  { title: 'Visibilidad digital',    desc: 'Pequeños negocios que antes solo se conocían de boca en boca ahora tienen presencia en línea.' },
  { title: 'Geolocalización real',   desc: 'Los clientes encuentran negocios cercanos con mapas y ubicación exacta en toda Guatemala.' },
  { title: 'Reputación construida',  desc: 'Calificaciones y reseñas auténticas que ayudan a los mejores negocios a destacar.' },
  { title: 'Respaldo universitario', desc: 'Tecnología desarrollada con estándares académicos y visión de largo plazo.' },
]

const whyReasons = [
  { title: 'Economía local primero',     desc: 'El dinero que circula en negocios locales se reinvierte en la misma comunidad, generando un ciclo virtuoso de prosperidad.' },
  { title: 'Reducir la brecha digital',  desc: 'El acceso a tecnología no debe ser privilegio de las grandes empresas. Queremos nivelar el campo de juego.' },
  { title: 'Preservar el emprendimiento',desc: 'Los negocios familiares son patrimonio cultural. Darles visibilidad es una forma de preservar la identidad guatemalteca.' },
]
</script>

<template>
  <div class="page-root">
    <Navbar />

    <!-- PARALLAX BLOCK -->
    <div class="parallax-block">
      <div class="parallax-bg-wrap" aria-hidden="true">
        <img :src="arcoAntigua" alt="Ruinas de Antigua Guatemala" class="parallax-img" />
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
    <!-- FIN PARALLAX -->

    <!-- CÓMO FUNCIONA -->
    <section class="how-section" :style="{ backgroundImage: `url(${paisaje})` }">
      <div class="container">
        <div class="sec-header">
          <div class="reveal fade-up d0 badge-red">¿Qué es AquiTenes?</div>
          <h2 class="reveal fade-up d1 sec-heading how-heading">
            El directorio digital<br>de <span style="color:#C1121F;">Guatemala</span>
          </h2>
        </div>
        <div class="how-grid">
          <div
            v-for="(step, i) in howItWorks" :key="i"
            class="reveal fade-up how-card"
            :style="{ transitionDelay: (i * 100) + 'ms' }"
          >
            <div class="how-num" :style="{ color: step.color }">{{ step.num }}</div>
            <h3 class="how-title">{{ step.title }}</h3>
            <p class="how-desc">{{ step.desc }}</p>
            <div class="how-bar" :style="{ '--bar-color': step.color }"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- IMPACTO SOCIAL -->
    <section class="impact-section" :style="{ backgroundImage: `url(${mercado})` }">
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

    <!-- POR QUÉ -->
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
              <div><p class="why-sig-name">Equipo AquiTenes</p></div>
            </div>
          </div>
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

/* Scroll y rendering suave */
* { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
section { transform:translateZ(0); backface-visibility:hidden; }

/* REVEAL */
.reveal { transition:opacity .5s cubic-bezier(0.22,1,0.36,1), transform .5s cubic-bezier(0.22,1,0.36,1); }
.fade-up    { opacity:0; transform:translateY(20px); }
.fade-left  { opacity:0; transform:translateX(-20px); }
.fade-right { opacity:0; transform:translateX(20px); }
.reveal.is-revealed { opacity:1!important; transform:none!important; }
.d0{transition-delay:0ms}.d1{transition-delay:70ms}.d2{transition-delay:140ms}

/* PARALLAX */
.parallax-block { position:relative; isolation:isolate; }
.parallax-bg-wrap { position:absolute; inset:0; overflow:hidden; z-index:0; }
.parallax-img {
  position:absolute; top:-15%; left:0;
  width:100%; height:130%;
  object-fit:cover; object-position:center 30%;
  will-change:transform;
}
.parallax-overlay {
  position:absolute; inset:0;
  background:linear-gradient(170deg,
    rgba(5,2,0,.70) 0%,
    rgba(8,4,0,.65) 35%,
    rgba(5,2,0,.78) 65%,
    rgba(2,1,0,.93) 100%);
}
.parallax-accent {
  position:absolute; inset:0;
  background:radial-gradient(ellipse at 60% 40%, rgba(180,80,10,.15) 0%, transparent 60%);
}

/* HERO */
.hero-section { position:relative; z-index:1; padding:6rem 0 4rem; text-align:center; }
.eyebrow-wrap { display:inline-flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; }
.eyebrow-line { display:block; width:2rem; height:1px; background:#ff6b6b; }
.eyebrow-text {
  color:#ff6b6b;
  font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.25em;
  text-shadow:0 1px 6px rgba(0,0,0,.9);
}
.hero-title {
  font-size:clamp(2.5rem,7vw,6rem); font-weight:900; color:#fff;
  text-transform:uppercase; letter-spacing:-.04em; line-height:1; margin-bottom:1.25rem;
  text-shadow:0 2px 20px rgba(0,0,0,.8);
}
.hero-accent { color:#ff4444; text-shadow:0 0 40px rgba(193,18,31,.7), 0 2px 20px rgba(0,0,0,.9); }
.hero-sub {
  color:#fff;
  font-size:clamp(.95rem,2vw,1.25rem); max-width:34rem; margin:0 auto;
  font-weight:600; line-height:1.65;
  text-shadow:0 2px 12px rgba(0,0,0,.95);
}
.scroll-hint  { margin-top:3rem; display:flex; flex-direction:column; align-items:center; gap:.5rem; opacity:.6; }
.sh-label {
  color:#fff; font-size:.6rem; font-weight:900; text-transform:uppercase; letter-spacing:.25em;
  text-shadow:0 1px 6px rgba(0,0,0,.8);
}
.sh-line  { width:1px; height:2.5rem; background:linear-gradient(to bottom,rgba(255,255,255,.8),transparent); animation:pulse 2s ease-in-out infinite; }
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}

/* MISIÓN */
.mission-section { position:relative; z-index:1; padding:1rem 0 7rem; }
.badge-wrap  { text-align:center; margin-bottom:3rem; }
.glass-badge { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; border:1px solid rgba(255,100,100,.5); color:#ff6b6b; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; backdrop-filter:blur(10px); background:rgba(0,0,0,.2); }
.mission-card { border-radius:2.5rem; overflow:hidden; background:rgba(255,255,255,.06); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,.12); box-shadow:0 40px 80px rgba(0,0,0,.4); }
.mission-grid { display:grid; grid-template-columns:1fr; }
@media(min-width:768px){.mission-grid{grid-template-columns:1fr 1fr}}
.mission-text     { padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; }
.mission-heading  { font-size:clamp(1.75rem,3.5vw,2.75rem); font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:-.03em; line-height:1.05; margin-bottom:1.5rem; }
.mission-body     { color:rgba(255,240,220,.85); font-size:1rem; line-height:1.75; font-weight:500; margin-bottom:1rem; }
.mission-body-sec { color:rgba(255,240,220,.60); font-size:.875rem; line-height:1.75; }
.umg-mini-wrap  { margin-top:2rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,.1); }
.umg-mini-label { color:rgba(255,240,220,.40); font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1rem; }
.umg-mini-badge { display:inline-flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-radius:1rem; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(10px); }
.umg-mini-logo  { height:2.5rem; width:auto; object-fit:contain; filter:brightness(1.1); }
.umg-mini-name  { color:#fff; font-size:.8rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; line-height:1.3; font-family:'Outfit',sans-serif; }
.pillars-side   { padding:3rem 3.5rem; display:flex; flex-direction:column; justify-content:center; border-top:1px solid rgba(255,255,255,.08); }
@media(min-width:768px){.pillars-side{border-top:none;border-left:1px solid rgba(255,255,255,.08)}}
.pillars-label { color:rgba(255,240,220,.35); font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; }
.pillars-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.pillar-card   { aspect-ratio:1; border-radius:1.25rem; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1rem; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,.3); transition:transform .3s ease,box-shadow .3s ease; }
.pillar-card:hover { transform:scale(1.06) translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.4); }
.pillar-icon  { width:1.75rem; height:1.75rem; color:rgba(255,255,255,.9); margin-bottom:.75rem; }
.pillar-label { font-size:.6rem; font-weight:900; text-transform:uppercase; letter-spacing:.07em; color:#fff; line-height:1.35; }

/* CÓMO FUNCIONA */
.how-section {
  padding:8rem 0;
  background-size:cover;
  background-position:center 40%;
  background-attachment:fixed;
  position:relative;
}
.how-section::before {
  content:''; position:absolute; inset:0;
  background:rgba(0,18,8,.80);
  z-index:0;
}
.how-section .container { position:relative; z-index:1; }
.sec-header  { text-align:center; margin-bottom:5rem; }
.how-heading { color:#fff !important; text-shadow:0 2px 10px rgba(0,0,0,.5); }
.badge-red    { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; background:rgba(193,18,31,.2); color:#ff6b6b; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; border:1px solid rgba(193,18,31,.3); }
.badge-border { display:inline-block; padding:.5rem 1.25rem; border-radius:999px; border:1px solid rgba(193,18,31,.35); color:#C1121F; font-size:.65rem; font-weight:900; text-transform:uppercase; letter-spacing:.2em; margin-bottom:1.5rem; }
.sec-heading  { font-size:clamp(2rem,5vw,3.5rem); font-weight:900; color:#003049; text-transform:uppercase; letter-spacing:-.03em; line-height:1.05; }
.sec-heading.white{color:#fff}
.how-grid  { display:grid; grid-template-columns:1fr; gap:2rem; max-width:62rem; margin:0 auto; }
@media(min-width:768px){.how-grid{grid-template-columns:repeat(3,1fr)}}
.how-card  {
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.13);
  border-radius:2rem; padding:2.5rem; display:flex; flex-direction:column;
  backdrop-filter:blur(14px); box-shadow:0 8px 32px rgba(0,0,0,.3);
  transition:transform .4s ease,box-shadow .4s ease,background .3s ease;
}
.how-card:hover{transform:translateY(-8px);box-shadow:0 24px 60px rgba(0,0,0,.45);background:rgba(255,255,255,.12)}
.how-num   { font-size:4rem; font-weight:900; line-height:1; margin-bottom:1.25rem; }
.how-title { font-size:1.5rem; font-weight:900; text-transform:uppercase; letter-spacing:-.02em; margin-bottom:1rem; color:#fff; }
.how-desc  { color:rgba(255,255,255,.70); font-size:.875rem; line-height:1.75; flex:1; }
.how-bar   { height:3px; border-radius:999px; width:0; margin-top:1.5rem; background:var(--bar-color); transition:width .5s ease; }
.how-card:hover .how-bar{width:100%}

/* IMPACTO */
.impact-section {
  padding:8rem 0;
  background-size:cover;
  background-position:center;
  background-attachment:fixed;
  position:relative;
}
.impact-section::before {
  content:''; position:absolute; inset:0;
  background:rgba(0,0,0,.75);
  z-index:0;
}
.impact-section .container { position:relative; z-index:1; }
.impact-grid { max-width:72rem; margin:0 auto; display:grid; grid-template-columns:1fr; gap:4rem; align-items:center; }
@media(min-width:768px){.impact-grid{grid-template-columns:1fr 1fr;gap:5rem}}
.quote-text  { font-size:clamp(1.5rem,3vw,2.25rem); font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:-.02em; line-height:1.2; text-shadow:0 2px 10px rgba(0,0,0,.6); }
.impact-list { display:flex; flex-direction:column; gap:1.25rem; }
.impact-item { display:flex; align-items:flex-start; gap:1.25rem; padding:1.25rem; border-radius:1.25rem; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(8px); transition:transform .3s ease,background .3s ease; }
.impact-item:hover{transform:translateY(-3px);background:rgba(255,255,255,.14)}
.impact-dot  { width:10px; height:10px; border-radius:50%; background:#C1121F; flex-shrink:0; margin-top:6px; }
.impact-title{ color:#fff; font-weight:900; font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
.impact-desc { color:rgba(255,255,255,.72); font-size:.8rem; line-height:1.65; }

/* POR QUÉ */
.why-section { padding:8rem 0; background:#003049; position:relative; overflow:hidden; }
.blob { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; }
.blob-r { width:24rem; height:24rem; background:rgba(193,18,31,.09); top:0; right:0; transform:translate(30%,-30%); }
.blob-b { width:20rem; height:20rem; background:rgba(102,155,188,.12); bottom:0; left:0; transform:translate(-30%,30%); }
.why-grid { display:grid; grid-template-columns:1fr; gap:4rem; max-width:68rem; margin:0 auto; }
@media(min-width:768px){.why-grid{grid-template-columns:1fr 1fr;gap:5rem;align-items:start}}
.why-body { color:rgba(253,240,213,.72); font-size:1rem; line-height:1.85; margin-bottom:1.5rem; }
.why-signature { display:flex; align-items:center; gap:1.25rem; margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,.1); }
.why-sig-line { width:2.5rem; height:3px; background:#C1121F; border-radius:999px; flex-shrink:0; }
.why-sig-name { color:#fff; font-size:.75rem; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }
.why-cards { display:flex; flex-direction:column; gap:1.25rem; }
.why-card  { display:flex; align-items:flex-start; gap:1.25rem; padding:1.5rem; border-radius:1.25rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); transition:background .3s ease,transform .3s ease; }
.why-card:hover{background:rgba(255,255,255,.08);transform:translateX(6px)}
.why-card-num   { font-size:1.75rem; font-weight:900; color:#C1121F; line-height:1; flex-shrink:0; }
.why-card-title { color:#fff; font-size:.8rem; font-weight:900; text-transform:uppercase; letter-spacing:.07em; margin-bottom:.4rem; }
.why-card-desc  { color:rgba(253,240,213,.60); font-size:.8rem; line-height:1.65; }
</style>