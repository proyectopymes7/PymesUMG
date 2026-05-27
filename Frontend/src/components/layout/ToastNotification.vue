<script setup>
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        :class="[
          'px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 w-80 pointer-events-auto',
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-fiery-red text-white shadow-fiery-red/20'
        ]"
      >
        <div v-if="toast.type === 'success'" class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div v-else class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
        <p class="text-sm font-bold tracking-tight">{{ toast.message }}</p>
        <button @click="toastStore.removeToast(toast.id)" class="ml-auto opacity-60 hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
</style>
