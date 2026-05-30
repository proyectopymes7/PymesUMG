const { body, validationResult } = require('express-validator');
const Calificacion = require('../models/Calificacion');
const Emprendimiento = require('../models/Emprendimiento');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendNewReview } = require('../utils/EmailService');

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

        logger.info('Calificación creada', { userId: id_usuario, emprendimientoId: id_emprendimiento });

        // Notificar al dueño del negocio por email
        try {
            logger.info(`[DEBUG-EMAIL] Iniciando envío de correo de reseña para emprendimiento: ${id_emprendimiento}`);
            const emp = await Emprendimiento.findById(id_emprendimiento);
            logger.info(`[DEBUG-EMAIL] Emprendimiento encontrado: ${emp ? emp.nombre : 'NO ENCONTRADO'}, ID Usuario Dueño: ${emp ? emp.id_usuario : 'N/A'}`);
            
            if (emp) {
                const owner = await User.findById(emp.id_usuario);
                logger.info(`[DEBUG-EMAIL] Dueño encontrado: ${owner ? owner.nombre : 'NO ENCONTRADO'}, Correo: ${owner ? owner.correo : 'N/A'}`);
                
                if (owner && owner.correo) {
                    logger.info(`[DEBUG-EMAIL] Llamando a sendNewReview con: correo=${owner.correo}, nombre=${owner.nombre}, negocio=${emp.nombre}, puntuacion=${puntuacion}`);
                    await sendNewReview(owner.correo, owner.nombre, emp.nombre, puntuacion, comentario);
                    logger.info('[DEBUG-EMAIL] Correo de reseña enviado exitosamente.');
                } else {
                    logger.info('[DEBUG-EMAIL] El dueño no tiene correo o no se encontró dueño válido.');
                }
            }
        } catch (emailErr) {
            logger.error(`[DEBUG-EMAIL] Error en bloque de correo: ${emailErr.message}`);
            logger.warn('No se pudo enviar email de reseña:', emailErr.message);
        }

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
        const id = req.params.id_emprendimiento || req.params.id;
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
        const id = req.params.id_calificacion || req.params.id;

        const review = await Calificacion.findById(id);
        if (!review) {
            return res.status(404).json({ error: 'Reseña no encontrada' });
        }

        const isAdmin = req.user.id_rol === 1 || req.user.id_rol === 2;
        if (!isAdmin && review.id_usuario !== req.user.id_usuario) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña' });
        }

        await Calificacion.delete(id);

        res.json({ success: true, message: 'Calificación eliminada exitosamente' });
    } catch (error) {
        logger.error('Error eliminando calificación:', { error });
        res.status(500).json({ error: 'Falló al eliminar la calificación' });
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