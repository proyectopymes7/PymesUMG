const express = require('express');
const router = express.Router();
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { optionalAuth } = require('../middleware/auth');
const { runChat } = require('../services/chatbot/engine');
const { trackClick } = require('../services/chatbot/data');
const logger = require('../utils/logger');

const isProd = process.env.NODE_ENV === 'production';

// Límite propio para el chat: cada mensaje cuesta tokens
const chatLimiter = new RateLimiterMemory({ points: isProd ? 15 : 100, duration: 60 });
const chatDailyLimiter = new RateLimiterMemory({ points: isProd ? 150 : 2000, duration: 60 * 60 * 24 });
const trackLimiter = new RateLimiterMemory({ points: 30, duration: 60 });

const limit = (...limiters) => async (req, res, next) => {
  const key = req.user ? `u${req.user.id_usuario}` : req.ip;
  try {
    for (const l of limiters) await l.consume(key);
    next();
  } catch (rej) {
    const secs = Math.round((rej.msBeforeNext || 1000) / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({ error: 'Too many requests', message: 'Enviaste muchos mensajes. Espera un momento e intenta de nuevo.' });
  }
};

router.post('/', optionalAuth, limit(chatLimiter, chatDailyLimiter), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Servicio de IA no configurado' });
  }

  const { mode = 'directorio', messages, id_emprendimiento } = req.body;

  if ((mode === 'negocio' || mode === 'coach') && !Number.isInteger(Number(id_emprendimiento))) {
    return res.status(400).json({ error: 'id_emprendimiento es requerido' });
  }
  if (mode === 'coach' && !req.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    const result = await runChat({ mode, messages, idEmprendimiento: Number(id_emprendimiento), user: req.user });
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.expose) {
      return res.status(error.status).json({ error: error.message });
    }
    logger.error('Chatbot error:', error.message);
    res.status(500).json({ error: 'El asistente no está disponible en este momento' });
  }
});

// Clics en WhatsApp/Maps desde el chat → ESTADISTICAS_DIARIAS
router.post('/track', limit(trackLimiter), async (req, res) => {
  const { id_emprendimiento, tipo } = req.body;
  if (!Number.isInteger(Number(id_emprendimiento)) || !['whatsapp', 'maps'].includes(tipo)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  try {
    await trackClick(Number(id_emprendimiento), tipo);
    res.json({ success: true });
  } catch (error) {
    logger.error('Chat track error:', error.message);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
});

module.exports = router;
