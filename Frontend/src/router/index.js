import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DirectoryView from '../views/DirectoryView.vue'
import BusinessDetailView from '../views/BusinessDetailView.vue'
import BlogView from '../views/BlogView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import EditProfileView from '../views/ProfileView.vue'
import BusinessRegisterView from '../views/BusinessRegisterView.vue'
import TraderView from '../views/TraderView.vue'
import { useAuthStore } from '../stores/auth'
import ImageUploadTestView from '../views/ImageUploadTestView.vue'

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
      path: '/admin',
      name: 'admin',
      component: AdminDashboardView
    },
    {
      path: '/negocio/:id',
      name: 'business-detail',
      component: BusinessDetailView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/perfil',
      name: 'edit-profile',
      component: EditProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/registrar-negocio',
      name: 'business-register',
      component: BusinessRegisterView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mi-negocio',
      name: 'trader',
      component: TraderView,
      meta: { requiresAuth: true }
    },
    {
      path: '/test-upload',
      name: 'test-upload',
      component: ImageUploadTestView
    }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.path.startsWith('/admin') && !authStore.hasAdminPanel) {
    return authStore.isAuthenticated ? '/' : '/login'
  }
  if (to.path === '/mi-negocio' && !authStore.isEmprendedor) {
    return authStore.isAuthenticated ? '/' : '/login'
  }
  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }
  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    return '/'
  }
})

export default router