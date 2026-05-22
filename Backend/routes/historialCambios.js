const express = require('express');
const { body, param, query } = require('express-validator');

const router = express.Router();

const HistorialCambiosController = require('../controllers/historialCambiosController');

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.get(
    '/',
    auth,
    [
        query('pagina')
            .optional()
            .isInt({ min: 1 })
            .withMessage('La página debe ser un número válido'),

        query('limite')
            .optional()
            .isInt({ min: 1 })
            .withMessage('El límite debe ser un número válido'),

        query('id_emprendimiento')
            .optional()
            .isInt()
            .withMessage('El emprendimiento debe ser numérico'),

        query('id_usuario')
            .optional()
            .isInt()
            .withMessage('El usuario debe ser numérico'),

        query('campo_modificado')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Máximo 255 caracteres')
    ],
    HistorialCambiosController.obtenerHistorial
);

router.get(
    '/:id',
    auth,
    [
        param('id')
            .isInt()
            .withMessage('El ID debe ser numérico')
    ],
    HistorialCambiosController.obtenerHistorialPorId
);

router.post(
    '/',
    auth,
    [
        body('id_emprendimiento')
            .isInt()
            .withMessage('El emprendimiento es obligatorio'),

        body('campo_modificado')
            .notEmpty()
            .withMessage('El campo modificado es obligatorio')
            .isLength({ max: 255 })
            .withMessage('Máximo 255 caracteres'),

        body('valor_anterior')
            .optional({ nullable: true }),

        body('valor_nuevo')
            .optional({ nullable: true })
    ],
    HistorialCambiosController.crearHistorial
);

router.delete(
    '/:id',
    auth,
    authorize('admin'),
    [
        param('id')
            .isInt()
            .withMessage('El ID debe ser numérico')
    ],
    HistorialCambiosController.eliminarHistorial
);

module.exports = router;