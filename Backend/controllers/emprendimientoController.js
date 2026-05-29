const { body, validationResult } = require('express-validator');
const Emprendimiento = require('../models/Emprendimiento');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendBusinessApproved, sendBusinessRejected, sendNewBusinessRequest } = require('../utils/EmailService');

const isAdmin = (user) => user && (user.id_rol === 1 || user.id_rol === 2);
const isOwner = (user, emp) => user && user.id_usuario === emp.id_usuario;

const createEmprendimiento = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const emprendimientoData = {
      ...req.body,
      id_usuario: req.user.id_usuario
    };

    const newEmprendimiento = await Emprendimiento.create(emprendimientoData);
    const fullEmprendimiento = await Emprendimiento.findById(newEmprendimiento.id_emprendimiento);

    logger.info(`Emprendimiento created: ${fullEmprendimiento.nombre}`, {
      userId: req.user.id_usuario,
      emprendimientoId: newEmprendimiento.id_emprendimiento
    });

    // Notificar al admin sobre la nueva solicitud
    try {
      await sendNewBusinessRequest(
        fullEmprendimiento.nombre,
        req.user.nombre,
        req.user.correo
      );
      logger.info(`New business request email sent for: ${fullEmprendimiento.nombre}`);
    } catch (emailErr) {
      logger.warn(`Failed to send new request email: ${emailErr.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Emprendimiento created successfully',
      data: fullEmprendimiento
    });
  } catch (error) {
    logger.error('Create emprendimiento error:', error);
    res.status(500).json({
      error: 'Failed to create emprendimiento',
      message: 'Internal server error'
    });
  }
};

const getEmprendimientos = async (req, res) => {
  try {
    const filters = {
      id_categoria: req.query.id_categoria,
      estado: req.query.estado === 'ALL' ? undefined : (req.query.estado || 'activo'),
      destacado: req.query.destacado === 'true' ? 1 : req.query.destacado === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const emprendimientos = await Emprendimiento.findAll(filters);
    const total = await Emprendimiento.count({
      id_categoria: filters.id_categoria,
      estado: filters.estado
    });

    res.json({
      success: true,
      data: emprendimientos,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    logger.error('Get emprendimientos error:', error);
    res.status(500).json({
      error: 'Failed to get emprendimientos',
      message: 'Internal server error'
    });
  }
};

const getEmprendimientoById = async (req, res) => {
  try {
    const { id } = req.params;
    const emprendimiento = await Emprendimiento.findById(id);

    if (!emprendimiento) {
      return res.status(404).json({
        error: 'Emprendimiento not found',
        message: `Emprendimiento with ID ${id} not found`
      });
    }

    if (emprendimiento.estado !== 'APROBADO' && !isAdmin(req.user) && !isOwner(req.user, emprendimiento)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this emprendimiento'
      });
    }

    // Increment views if not owner
    if (!req.user || emprendimiento.id_usuario !== req.user.id_usuario) {
      await Emprendimiento.incrementViews(id);
    }

    res.json({
      success: true,
      data: emprendimiento
    });
  } catch (error) {
    logger.error('Get emprendimiento by ID error:', error);
    res.status(500).json({
      error: 'Failed to get emprendimiento',
      message: 'Internal server error'
    });
  }
};

const updateEmprendimiento = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const emprendimiento = await Emprendimiento.findById(id);

    if (!emprendimiento) {
      return res.status(404).json({
        error: 'Emprendimiento not found',
        message: `Emprendimiento with ID ${id} not found`
      });
    }

    if (!isAdmin(req.user) && !isOwner(req.user, emprendimiento)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own emprendimientos'
      });
    }

    const updateData = req.body;

    // Auto-promote Visitante (4) → Emprendedor (3) when business is approved
    const estadoNorm = updateData.estado?.toLowerCase()
    if (estadoNorm === 'activo' || estadoNorm === 'aprobado') {
      const owner = await User.findById(emprendimiento.id_usuario);
      if (owner && owner.id_rol === 4) {
        await User.updateRole(emprendimiento.id_usuario, 3);
        logger.info(`User promoted to Emprendedor: ${owner.nombre_usuario || owner.correo}`);
      }
      // Send approval email if user has email
      if (owner && owner.correo) {
        try {
          await sendBusinessApproved(owner.correo, owner.nombre, emprendimiento.nombre);
          logger.info(`Approval email sent to: ${owner.correo}`);
        } catch (emailErr) {
          logger.warn(`Failed to send approval email: ${emailErr.message}`);
        }
      }
    }

    // Send rejection email
    if (updateData.estado === 'rechazado') {
      const owner = await User.findById(emprendimiento.id_usuario);
      if (owner) {
        try {
          await sendBusinessRejected(owner.correo, owner.nombre, emprendimiento.nombre);
          logger.info(`Rejection email sent to: ${owner.correo}`);
        } catch (emailErr) {
          logger.warn(`Failed to send rejection email: ${emailErr.message}`);
        }
      }
    }

    const updatedEmprendimiento = await Emprendimiento.update(id, updateData);

    logger.info(`Emprendimiento updated: ${emprendimiento.nombre}`, {
      userId: req.user.id_usuario,
      emprendimientoId: id
    });

    res.json({
      success: true,
      message: 'Emprendimiento updated successfully',
      data: updatedEmprendimiento
    });
  } catch (error) {
    logger.error('Update emprendimiento error:', error);
    res.status(500).json({
      error: 'Failed to update emprendimiento',
      message: error.message || 'Internal server error'
    });
  }
};

const deleteEmprendimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const emprendimiento = await Emprendimiento.findById(id);

    if (!emprendimiento) {
      return res.status(404).json({
        error: 'Emprendimiento not found',
        message: `Emprendimiento with ID ${id} not found`
      });
    }

    if (!isAdmin(req.user) && !isOwner(req.user, emprendimiento)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own emprendimientos'
      });
    }

    await Emprendimiento.delete(id);

    logger.info(`Emprendimiento deleted: ${emprendimiento.nombre}`, {
      userId: req.user.id_usuario,
      emprendimientoId: id
    });

    res.json({
      success: true,
      message: 'Emprendimiento deleted successfully'
    });
  } catch (error) {
    logger.error('Delete emprendimiento error:', error);
    res.status(500).json({
      error: 'Failed to delete emprendimiento',
      message: 'Internal server error'
    });
  }
};

const searchEmprendimientos = async (req, res) => {
  try {
    const { q: term, id_categoria, limit = 20, offset = 0 } = req.query;

    if (!term) {
      return res.status(400).json({
        error: 'Search term is required',
        message: 'Please provide a search term (q parameter)'
      });
    }

    const filters = {
      id_categoria,
      estado: 'APROBADO',
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await Emprendimiento.search(term, filters);

    res.json({
      success: true,
      data: results,
      search: {
        term,
        filters,
        count: results.length
      }
    });
  } catch (error) {
    logger.error('Search emprendimientos error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Internal server error'
    });
  }
};

const getMyEmprendimientos = async (req, res) => {
  try {
    const filters = {
      id_usuario: req.user.id_usuario,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    if (req.query.estado) {
      filters.estado = req.query.estado;
    }

    const emprendimientos = await Emprendimiento.findAll(filters);
    const total = await Emprendimiento.count({
      id_usuario: req.user.id_usuario,
      estado: filters.estado
    });

    res.json({
      success: true,
      data: emprendimientos,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    logger.error('Get my emprendimientos error:', error);
    res.status(500).json({
      error: 'Failed to get emprendimientos',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createEmprendimiento,
  getEmprendimientos,
  getEmprendimientoById,
  updateEmprendimiento,
  deleteEmprendimiento,
  searchEmprendimientos,
  getMyEmprendimientos,
  validateCreateEmprendimiento: [
    body('nombre')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre must be between 2 and 100 characters'),
    body('id_categoria')
      .isInt({ min: 1 })
      .withMessage('Categoría is required'),
    body('descripcion')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Descripción must be between 10 and 1000 characters'),
    body('telefono')
      .optional()
      .matches(/^[+]?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid phone number'),
    body('whatsapp')
      .optional()
      .matches(/^[+]?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid WhatsApp number'),
    body('latitud')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud must be between -90 and 90'),
    body('longitud')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud must be between -180 and 180'),
    body('horario')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Horario cannot exceed 200 characters'),
    body('estado')
      .optional()
      .isIn(['activo', 'inactivo', 'pendiente', 'rechazado', 'borrado', 'APROBADO'])
      .withMessage('Estado inválido'),
    body('departamento').optional().trim().isLength({ max: 100 }).withMessage('Departamento max 100 chars'),
    body('municipio').optional().trim().isLength({ max: 100 }).withMessage('Municipio max 100 chars'),
    body('localidad').optional().trim().isLength({ max: 150 }).withMessage('Localidad max 150 chars'),
    body('direccion').optional().trim().isLength({ max: 300 }).withMessage('Dirección max 300 chars'),
  ],
  validateUpdateEmprendimiento: [
    body('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nombre must be between 2 and 100 characters'),
    body('id_categoria')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Categoría must be a valid ID'),
    body('descripcion')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descripción cannot exceed 1000 characters'),
    body('telefono')
      .optional({ checkFalsy: true })
      .matches(/^[+]?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid phone number'),
    body('whatsapp')
      .optional({ checkFalsy: true })
      .matches(/^[+]?[\d\s\-\(\)]+$/)
      .withMessage('Please provide a valid WhatsApp number'),
    body('latitud')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud must be between -90 and 90'),
    body('longitud')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud must be between -180 and 180'),
    body('horario')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage('Horario cannot exceed 200 characters'),
    body('estado')
      .optional()
      .isIn(['activo', 'inactivo', 'pendiente', 'rechazado', 'borrado', 'APROBADO'])
      .withMessage('Estado inválido'),
    body('departamento').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('municipio').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('localidad').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
    body('direccion').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  ]
};