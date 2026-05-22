const express = require('express');
const router = express.Router();

const { auth, authorize, optionalAuth } = require('../middleware/auth');

const {
  createPublicacion,
  getPublicaciones,
  getPublicacionById,
  resolvePublicacion,
  deletePublicacion,
  validateCreatePublicacion,
  validateResolvePublicacion
} = require('../controllers/publicacionController');

router.get('/', optionalAuth, getPublicaciones);

router.get('/:id', optionalAuth, getPublicacionById);

router.post('/', auth, validateCreatePublicacion, createPublicacion);

router.put(
  '/:id/resolver',
  auth,
  authorize('admin'),
  validateResolvePublicacion,
  resolvePublicacion
);

router.delete('/:id', auth, deletePublicacion);

module.exports = router;