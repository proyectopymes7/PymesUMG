import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.id_rol === 1,
    isUser: (state) => state.user?.id_rol === 2,
    userName: (state) => state.user ? `${state.user.nombre}` : '',
    userFullName: (state) => state.user ? `${state.user.nombre} ${state.user.apellido}` : '',
    userInitial: (state) => state.user?.nombre ? state.user.nombre.charAt(0).toUpperCase() : '?'
  },

  actions: {
    async loginWithGoogle(idToken) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/google', { idToken })
        const { user, token } = response.data.data
        
        this.user = user
        this.token = token
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        return true
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión con Google'
        return false
      } finally {
        this.loading = false
      }
    },

    async checkAuth() {
      if (!this.token) return false
      try {
        const response = await api.get('/auth/profile')
        this.user = response.data.data
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      } catch (err) {
        this.logout()
        return false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/' // Redirigir al inicio al cerrar sesión
    }
  }
})
