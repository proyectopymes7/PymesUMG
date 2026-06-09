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
import ResetPasswordView from '../views/ResetPasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'instant' }
  },
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
      meta: { requiresAuth: true, requiresEmprendedor: true }
    },
    {
      path: '/test-upload',
      name: 'test-upload',
      component: ImageUploadTestView
    },

    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Rutas que requieren rol emprendedor: refrescar perfil primero para capturar
  // promociones recientes que el admin haya hecho mientras el usuario estaba en sesión
  if (to.meta?.requiresEmprendedor && authStore.isAuthenticated) {
    await authStore.checkAuth()
  }

  if (to.path.startsWith('/admin') && !authStore.hasAdminPanel) {
    return authStore.isAuthenticated ? '/' : '/login'
  }

  if (to.meta?.requiresEmprendedor && !(authStore.isEmprendedor || authStore.isAdmin)) {
    return authStore.isAuthenticated ? '/' : '/login'
  }

  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    return '/'
  }
})

router.afterEach(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
})

export default router