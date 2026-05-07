const { RateLimiterMemory } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

// General rate limiter
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900, // 15 minutes in seconds
});

// Auth endpoints stricter rate limiting
const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
});

// Search rate limiting
const searchRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 30,
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
