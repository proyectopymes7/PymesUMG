import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),
  actions: {
    addToast(message, type = 'success', duration = 3000) {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, message, type })
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    },
    success(message, duration = 3000) {
      this.addToast(message, 'success', duration)
    },
    error(message, duration = 3000) {
      this.addToast(message, 'error', duration)
    },
    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    }
  }
})
