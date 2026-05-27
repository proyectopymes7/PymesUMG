const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

const isProd = process.env.NODE_ENV === 'production';

// General rate limiter
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProd ? 100 : 1000),
  duration: 60, // 1 minuto fijo para evitar bloqueos largos en desarrollo local
});

// Auth endpoints stricter rate limiting
const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: isProd ? 5 : 100, // 5 attempts in prod, 100 in dev
  duration: isProd ? 900 : 60, // 15 minutes in prod, 1 minute in dev
});

// Search rate limiting
const searchRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: isProd ? 30 : 300,
  duration: 60, // per minute
});

const rateLimitMiddleware = (limiter) => {
  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        path: req.path,
        method: req.method,
        remainingPoints: rejRes.remainingPoints
      });

      res.set('Retry-After', String(secs));
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
        retryAfter: secs
      });
    }
  };
};

// General rate limiting middleware
const rateLimiterMiddleware = rateLimitMiddleware(rateLimiter);

// Auth-specific rate limiting
const authRateLimiterMiddleware = rateLimitMiddleware(authRateLimiter);

// Search-specific rate limiting
const searchRateLimiterMiddleware = rateLimitMiddleware(searchRateLimiter);

module.exports = {
  rateLimiterMiddleware,
  authRateLimiterMiddleware,
  searchRateLimiterMiddleware
};
