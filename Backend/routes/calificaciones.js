const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');

const {
    createCalificacion,
    getCalificacionesByEmprendimiento,
    deleteCalificacion,
    validateCreateCalificacion
} = require('../controllers/calificacionesController');

router.get('/emprendimiento/:id_emprendimiento', optionalAuth, getCalificacionesByEmprendimiento);

router.post('/', auth, validateCreateCalificacion, createCalificacion);

router.delete('/:id_calificacion', auth, deleteCalificacion);

module.exports = router;