<script setup>
import { ref, onMounted } from 'vue'
import Navbar from '../components/layout/Navbar.vue'

const articles = ref([
  {
    id: 1,
    title: 'Transformación Digital para PYMEs en Guatemala',
    excerpt: 'Descubre cómo la tecnología está cambiando la forma en que los pequeños negocios conectan con sus clientes.',
    category: 'Tecnología',
    date: 'Mayo 2026',
    author: 'Facultad de Ingeniería',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Estrategias de Marketing Local',
    excerpt: 'Aprende a posicionar tu negocio en tu comunidad utilizando herramientas digitales de última generación.',
    category: 'Marketing',
    date: 'Abril 2026',
    author: 'Facultad de Administración',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 3,
    title: 'El Futuro del Comercio en Línea',
    excerpt: '¿Hacia dónde va el mercado guatemalteco? Analizamos las tendencias para los próximos años.',
    category: 'Análisis',
    date: 'Marzo 2026',
    author: 'Equipo ConectaPYME',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop'
  }
])

const revealedElements = ref(new Set());
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) revealedElements.value.add(entry.target.dataset.id);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.id = `blog-${i}`;
    observer.observe(el);
  });
});
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar />

    <!-- Hero Section -->
    <section class="relative pt-40 pb-20 bg-fiery-navy overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute top-0 right-0 w-96 h-96 bg-fiery-red/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-fiery-red/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>
      </div>
      
      <div class="container mx-auto px-6 relative z-10 text-center">
        <h1 class="text-5xl md:text-7xl font-black text-white font-outfit uppercase tracking-tighter mb-6">Nuestro <span class="text-fiery-red">Blog</span></h1>
        <p class="text-fiery-cream/60 text-lg md:text-xl max-w-2xl mx-auto font-medium">Historias, tecnología y estrategias para el crecimiento de Guatemala.</p>
      </div>
    </section>

    <!-- Academic Collaboration Section -->
    <section class="py-24 bg-slate-50/50">
      <div class="container mx-auto px-6">
        <div class="max-w-5xl mx-auto bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-fiery-navy/5 border border-slate-100 flex flex-col md:flex-row items-center gap-12 reveal" :class="revealedElements.has('blog-0') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'">
          <div class="flex-1 space-y-6">
            <div class="inline-block px-4 py-2 bg-fiery-red/10 rounded-full text-fiery-red text-xs font-black uppercase tracking-widest">Colaboración Académica</div>
            <h2 class="text-3xl md:text-4xl font-black text-fiery-navy font-outfit uppercase tracking-tighter leading-none">Desarrollado con <span class="text-fiery-red">Pasión y Estrategia</span></h2>
            <p class="text-slate-600 text-lg leading-relaxed font-medium italic">
              "Esta es una aplicación desarrollada con los estudiantes de **Ingeniería en Sistemas** con el apoyo de **Administración de Empresas con énfasis en Mercadotecnia**."
            </p>
            <p class="text-slate-500 font-medium">
              ConectaPYME nace de la sinergia entre el rigor técnico y la visión comercial, creando una herramienta diseñada para potenciar la economía local guatemalteca.
            </p>
          </div>
          <div class="w-full md:w-1/3 grid grid-cols-2 gap-4">
            <div class="aspect-square bg-fiery-navy rounded-3xl flex flex-col items-center justify-center text-white p-4 text-center">
              <svg class="w-8 h-8 mb-3 text-fiery-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              <span class="text-[10px] font-black uppercase tracking-widest leading-tight">Ingeniería en Sistemas</span>
            </div>
            <div class="aspect-square bg-fiery-red rounded-3xl flex flex-col items-center justify-center text-white p-4 text-center">
              <svg class="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span class="text-[10px] font-black uppercase tracking-widest leading-tight">Administración & Marketing</span>
            </div>
            <div class="col-span-2 h-24 bg-fiery-cream rounded-3xl flex items-center justify-center gap-4 text-fiery-navy border border-fiery-red/10">
              <span class="font-black text-xl">UFM + ConectaPYME</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Articles Grid -->
    <section class="py-24 bg-white">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <article v-for="(article, i) in articles" :key="article.id" class="group reveal" :class="revealedElements.has('blog-' + (i+1)) ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'" :style="{ transitionDelay: (i * 200) + 'ms' }">
            <div class="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col hover:-translate-y-2">
              <div class="h-56 overflow-hidden relative">
                <img :src="article.image" :alt="article.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-fiery-red uppercase tracking-widest">{{ article.category }}</div>
              </div>
              <div class="p-8 flex-1 flex flex-col">
                <div class="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                  <span>{{ article.date }}</span>
                  <span class="w-1 h-1 bg-fiery-red rounded-full"></span>
                  <span>{{ article.author }}</span>
                </div>
                <h3 class="text-xl font-black text-fiery-navy mb-4 group-hover:text-fiery-red transition-colors font-outfit uppercase tracking-tighter">{{ article.title }}</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-6">{{ article.excerpt }}</p>
                <button class="mt-auto text-[10px] font-black uppercase tracking-[0.2em] text-fiery-navy flex items-center gap-2 group/btn">
                  Leer más
                  <svg class="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Footer CTA -->
    <section class="py-24 bg-fiery-navy text-center relative overflow-hidden">
      <div class="container mx-auto px-6 relative z-10">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-6 font-outfit uppercase tracking-tight">¿Quieres colaborar?</h2>
        <p class="text-fiery-cream/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">Estamos siempre en busca de mentes brillantes para mejorar el ecosistema PYME en el país.</p>
        <button class="bg-fiery-red text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-fiery-navy transition-all shadow-2xl">Contáctanos</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.reveal {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
