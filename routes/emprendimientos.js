const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { searchRateLimiterMiddleware } = require('../middleware/rateLimiter');
const {
  createEmprendimiento,
  getEmprendimientos,
  getEmprendimientoById,
  updateEmprendimiento,
  // deleteEmprendimiento, // Soft delete will be implemented later
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
// router.delete('/:id', auth, deleteEmprendimiento); // Soft delete will be implemented later

// Admin only routes
// router.delete('/:id/admin', auth, authorize('admin'), deleteEmprendimiento); // Soft delete will be implemented later

module.exports = router;
