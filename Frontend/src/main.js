// Evitar restauración de scroll del browser y forzar tope al recargar
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.addEventListener('load', () => window.scrollTo(0, 0), { once: true })

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vue3GoogleLogin, {
  clientId: '768418717547-p74uerpkpn09dcufaq7n6rbps39hjldr.apps.googleusercontent.com'
})

app.mount('#app')
