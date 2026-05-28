import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => {
    let user = null
    try {
      const userStr = localStorage.getItem('user')
      user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('Error parsing user from localStorage:', e)
      localStorage.removeItem('user')
    }
    return {
      user,
      token: localStorage.getItem('token') || null,
      loading: false,
      error: null
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    isSuperAdmin: (state) => state.user?.id_rol === 1,
    isAdmin: (state) => state.user?.id_rol === 1 || state.user?.id_rol === 2,
    isEmprendedor: (state) => state.user?.id_rol === 3,
    isVisitante: (state) => state.user?.id_rol === 4,
    hasAdminPanel: (state) => state.user?.id_rol === 1 || state.user?.id_rol === 2,
    userName: (state) => state.user ? `${state.user.nombre}` : '',
    userFullName: (state) => state.user ? `${state.user.nombre} ${state.user.apellido}` : '',
    userInitial: (state) => state.user?.nombre ? state.user.nombre.charAt(0).toUpperCase() : '?'
  },

  actions: {
    async loginWithEmail(correo, password) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/login', { correo, password })
        const { user, token } = response.data.data

        this.user = user
        this.token = token

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        return true
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión'
        return false
      } finally {
        this.loading = false
      }
    },

    async register(nombre, apellido, correo, password) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/register', { nombre, apellido, correo, password })
        const { user, token } = response.data.data

        this.user = user
        this.token = token

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        return true
      } catch (err) {
        if (err.response?.data?.details) {
          this.error = err.response.data.details[0].msg
        } else {
          this.error = err.response?.data?.message || 'Error al registrarse'
        }
        return false
      } finally {
        this.loading = false
      }
    },

    async loginWithGoogle(accessToken) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/google', { access_token: accessToken })
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