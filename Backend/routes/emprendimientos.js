const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { searchRateLimiterMiddleware } = require('../middleware/rateLimiter');
const {
  createEmprendimiento,
  getEmprendimientos,
  getEmprendimientoById,
  updateEmprendimiento,
  deleteEmprendimiento,
  searchEmprendimientos,
  getMyEmprendimientos,
  validateCreateEmprendimiento,
  validateUpdateEmprendimiento
} = require('../controllers/emprendimientoController');

// Public routes
router.get('/', optionalAuth, getEmprendimientos);
router.get('/search', searchRateLimiterMiddleware, optionalAuth, searchEmprendimientos);
router.get('/:id', optionalAuth, getEmprendimientoById);

// Protected routes
router.post('/', auth, validateCreateEmprendimiento, createEmprendimiento);
router.get('/my/emprendimientos', auth, getMyEmprendimientos);
router.put('/:id', auth, validateUpdateEmprendimiento, updateEmprendimiento);
router.delete('/:id', auth, authorize('superadministrador'), deleteEmprendimiento);

module.exports = router;
