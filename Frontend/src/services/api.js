import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://85.239.230.135/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para añadir el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
