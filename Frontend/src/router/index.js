import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DirectoryView from '../views/DirectoryView.vue'
import BusinessDetailView from '../views/BusinessDetailView.vue'
import BlogView from '../views/BlogView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/directorio',
      name: 'directory',
      component: DirectoryView
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView
    },
    {
      path: '/negocio/:id',
      name: 'business-detail',
      component: BusinessDetailView
    }
  ]
})

export default router
