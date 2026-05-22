const { validationResult } = require('express-validator');

const HistorialCambiosModel = require('../models/historialCambiosModel');
const logger = require('../utils/logger');

class HistorialCambiosController {
    static async obtenerHistorial(req, res) {
        try {
            const {
                id_emprendimiento,
                id_usuario,
                campo_modificado,
                pagina,
                limite
            } = req.query;

            const historial = await HistorialCambiosModel.obtenerHistorial({
                id_emprendimiento,
                id_usuario,
                campo_modificado,
                pagina: parseInt(pagina) || 1,
                limite: parseInt(limite) || 10
            });

            return res.json({
                success: true,
                data: historial
            });
        } catch (error) {
            logger.error('Error obteniendo historial de cambios', error);

            return res.status(500).json({
                error: 'Error obteniendo historial',
                message: error.message
            });
        }
    }

    static async obtenerHistorialPorId(req, res) {
        try {
            const { id } = req.params;

            const historial = await HistorialCambiosModel.obtenerHistorialPorId(id);

            if (!historial) {
                return res.status(404).json({
                    error: 'Historial no encontrado',
                    message: 'No existe un registro con ese ID'
                });
            }

            return res.json({
                success: true,
                data: historial
            });
        } catch (error) {
            logger.error('Error obteniendo historial por ID', error);

            return res.status(500).json({
                error: 'Error obteniendo historial',
                message: error.message
            });
        }
    }

    static async crearHistorial(req, res) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Errores de validación',
                    message: errors.array()
                });
            }

            const {
                id_emprendimiento,
                campo_modificado,
                valor_anterior,
                valor_nuevo
            } = req.body;

            const historialData = {
                id_emprendimiento,
                id_usuario: req.user.id_usuario,
                campo_modificado,
                valor_anterior,
                valor_nuevo,
                ip_origen: req.ip
            };

            const historial = await HistorialCambiosModel.crearHistorial(historialData);

            logger.info(`Historial creado ID ${historial.id_historial}`);

            return res.status(201).json({
                success: true,
                data: historial
            });
        } catch (error) {
            logger.error('Error creando historial', error);

            return res.status(500).json({
                error: 'Error creando historial',
                message: error.message
            });
        }
    }

    static async eliminarHistorial(req, res) {
        try {
            const { id } = req.params;

            const historial = await HistorialCambiosModel.obtenerHistorialPorId(id);

            if (!historial) {
                return res.status(404).json({
                    error: 'Historial no encontrado',
                    message: 'No existe un registro con ese ID'
                });
            }

            await HistorialCambiosModel.eliminarHistorial(id);

            logger.info(`Historial eliminado ID ${id}`);

            return res.json({
                success: true,
                data: {
                    message: 'Historial eliminado correctamente'
                }
            });
        } catch (error) {
            logger.error('Error eliminando historial', error);

            return res.status(500).json({
                error: 'Error eliminando historial',
                message: error.message
            });
        }
    }
}

module.exports = HistorialCambiosController;