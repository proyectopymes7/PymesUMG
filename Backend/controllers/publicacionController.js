const { body, validationResult } = require('express-validator');

const Publicacion = require('../models/Publicacion');

const logger = require('../utils/logger');

const createPublicacion = async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const publicacionData = {
      id_emprendimiento: req.body.id_emprendimiento,
      tipo_accion: req.body.tipo_accion,
      estado: 'pendiente'
    };

    const newPublicacion = await Publicacion.create(publicacionData);

    logger.info('Publicación creada', {
      userId: req.user.id_usuario,
      emprendimientoId: req.body.id_emprendimiento
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud creada correctamente',
      data: newPublicacion
    });

  } catch (error) {

    logger.error('Create publicacion error:', error);

    res.status(500).json({
      error: 'Failed to create publicacion'
    });
  }
};

const getPublicaciones = async (req, res) => {

  try {

    const filters = {
      estado: req.query.estado,
      tipo_accion: req.query.tipo_accion
    };

    const publicaciones = await Publicacion.findAll(filters);

    const total = await Publicacion.count(filters);

    res.json({
      success: true,
      data: publicaciones,
      total
    });

  } catch (error) {

    logger.error('Get publicaciones error:', error);

    res.status(500).json({
      error: 'Failed to get publicaciones'
    });
  }
};

const getPublicacionById = async (req, res) => {

  try {

    const { id } = req.params;

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({
        error: 'Publicacion not found'
      });
    }

    res.json({
      success: true,
      data: publicacion
    });

  } catch (error) {

    logger.error('Get publicacion error:', error);

    res.status(500).json({
      error: 'Failed to get publicacion'
    });
  }
};

const resolvePublicacion = async (req, res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const updated = await Publicacion.resolve(id, {
      id_admin: req.user.id_usuario,
      estado: req.body.estado,
      ip_admin: req.ip
    });

    logger.info('Publicación resuelta', {
      adminId: req.user.id_usuario,
      publicacionId: id
    });

    res.json({
      success: true,
      message: 'Publicación actualizada',
      data: updated
    });

  } catch (error) {

    logger.error('Resolve publicacion error:', error);

    res.status(500).json({
      error: 'Failed to resolve publicacion'
    });
  }
};

const deletePublicacion = async (req, res) => {

  try {

    const { id } = req.params;

    await Publicacion.delete(id);

    res.json({
      success: true,
      message: 'Publicación eliminada'
    });

  } catch (error) {

    logger.error('Delete publicacion error:', error);

    res.status(500).json({
      error: 'Failed to delete publicacion'
    });
  }
};

module.exports = {

  createPublicacion,

  getPublicaciones,

  getPublicacionById,

  resolvePublicacion,

  deletePublicacion,

  validateCreatePublicacion: [

    body('id_emprendimiento')
      .isInt({ min: 1 })
      .withMessage('ID de emprendimiento inválido'),

    body('tipo_accion')
      .isIn(['alta', 'modificacion', 'baja'])
      .withMessage('Tipo de acción inválido')
  ],

  validateResolvePublicacion: [

    body('estado')
      .isIn(['aprobado', 'rechazado'])
      .withMessage('Estado inválido')
  ]
};