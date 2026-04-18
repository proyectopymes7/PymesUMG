const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authRateLimiterMiddleware } = require('../middleware/rateLimiter');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require('../controllers/authController');

// Apply rate limiting to all auth routes
router.use(authRateLimiterMiddleware);

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateUpdateProfile, updateProfile);
router.put('/change-password', auth, validateChangePassword, changePassword);

module.exports = router;
