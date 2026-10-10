import api from './api'

export const sendChatMessage = async ({ mode, messages, businessId }) => {
  const response = await api.post('/chat', {
    mode,
    messages: messages.map(({ role, content }) => ({ role, content })),
    id_emprendimiento: businessId ?? undefined
  })
  return response.data
}

// Registra clics de WhatsApp/Maps hechos desde el chat (no bloquea la navegación)
export const trackChatClick = (businessId, tipo) => {
  api.post('/chat/track', { id_emprendimiento: businessId, tipo }).catch(() => {})
}
