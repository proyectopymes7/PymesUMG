const { body, validationResult } = require('express-validator');
const Calificacion = require('../models/Calificacion');
const logger = require('../utils/logger');

const createCalificacion = async (req, res) => {
    try {
        const errors = validationResult(req);   
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
    } catch (error) {
        logger.error('Error validando datos de calificación', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }

    try {
        const { id_emprendimiento, puntuacion, comentario } = req.body;
        const id_usuario = req.user.id_usuario;

        const existingRating = await Calificacion.findUserRating(id_usuario, id_emprendimiento);

        if (existingRating) {
            return res.status(400).json({
                 error: 'Ya calificado',
                 message: 'Ya has calificado este emprendimiento'
                });
        }

        const newRatingData = await Calificacion.create({
            id_usuario,
            id_emprendimiento,
            puntuacion,
            comentario
        });

        logger.info('Calificación creada', {
            userId: id_usuario,
            emprendimientoId: id_emprendimiento,
        });

        res.status(201).json({
            success: true,
            message: 'Calificación creada exitosamente',
            data: newRatingData
        });
    } catch (error) {
        logger.error('Error creando calificación:', { error });
        res.status(500).json({
             error: 'Falló al crear la calificación' 
        });
    }
};

const getCalificacionesByEmprendimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const calificaciones = await Calificacion.findByEmprendimiento(id);
        
        res.json({
            success: true,
            data: calificaciones,
            total: calificaciones.length
        });
    } catch (error) {
        logger.error('Error obteniendo calificaciones:', { error });
        res.status(500).json({
            error: 'Falló al obtener las calificaciones'
        });
    }
};

const deleteCalificacion = async (req, res) => {
    try {
        const { id } = req.params;

        await Calificacion.delete(id);

        res.json({
            success: true,
            message: 'Calificación eliminada exitosamente'
        });
    
    } catch (error) {
        logger.error('Error eliminando calificación:', { error });
        res.status(500).json({
            error: 'Falló al eliminar la calificación'
        });
    }
};

module.exports = {
    createCalificacion,
    getCalificacionesByEmprendimiento,
    deleteCalificacion,
    validateCreateCalificacion: [
        body('id_emprendimiento')
        .isInt({ min: 1 })
        .withMessage('ID de emprendimiento inválido'),

        body('puntuacion')
        .isInt({ min: 1, max: 5 })
        .withMessage('La puntuación debe ser un número entre 1 y 5'),
    ]
};