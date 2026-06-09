const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const Valoracion = require('../models/Valoracion');

// Public routes (read-only)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filters = {
      id_emprendimiento: req.query.id_emprendimiento,
      aprobado: req.query.aprobado === 'true' ? 1 : req.query.aprobado === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const valoraciones = await Valoracion.findAll(filters);
    const total = await Valoracion.count({
      id_emprendimiento: filters.id_emprendimiento,
      aprobado: filters.aprobado
    });

    res.json({
      success: true,
      data: valoraciones,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get valoraciones',
      message: 'Internal server error'
    });
  }
});

router.get('/emprendimiento/:id_emprendimiento', optionalAuth, async (req, res) => {
  try {
    const filters = {
      aprobado: req.query.aprobado === 'true' ? 1 : req.query.aprobado === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const valoraciones = await Valoracion.findByEmprendimiento(req.params.id_emprendimiento, filters);
    const total = await Valoracion.count({
      id_emprendimiento: req.params.id_emprendimiento,
      aprobado: filters.aprobado
    });

    res.json({
      success: true,
      data: valoraciones,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get valoraciones',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const valoracion = await Valoracion.findById(req.params.id);
    
    if (!valoracion) {
      return res.status(404).json({
        error: 'Valoracion not found'
      });
    }

    res.json({
      success: true,
      data: valoracion
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get valoracion',
      message: 'Internal server error'
    });
  }
});

// Protected routes
router.post('/', auth, async (req, res) => {
  try {
    const { id_emprendimiento, nombre_display, comentario } = req.body;
    
    if (!id_emprendimiento || !nombre_display || !comentario) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento, nombre_display, and comentario are required'
      });
    }

    const newValoracion = await Valoracion.create({
      id_emprendimiento,
      id_usuario: req.user.id_usuario,
      nombre_display,
      comentario,
      aprobado: 0 // Pending approval by default
    });
    
    res.status(201).json({
      success: true,
      message: 'Valoracion created successfully and is pending approval',
      data: newValoracion
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create valoracion',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const valoracion = await Valoracion.findById(req.params.id);
    
    if (!valoracion) {
      return res.status(404).json({
        error: 'Valoracion not found'
      });
    }

    // Check permissions - users can only update their own valoraciones
    if (req.user.rol_nombre !== 'admin' && valoracion.id_usuario !== req.user.id_usuario) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own valoraciones'
      });
    }

    const updateData = {};
    
    if (req.body.nombre_display !== undefined) updateData.nombre_display = req.body.nombre_display;
    if (req.body.comentario !== undefined) updateData.comentario = req.body.comentario;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    const updatedValoracion = await Valoracion.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: 'Valoracion updated successfully',
      data: updatedValoracion
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update valoracion',
      message: 'Internal server error'
    });
  }
});

// Soft delete will be implemented later
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const valoracion = await Valoracion.findById(req.params.id);
//     
//     if (!valoracion) {
//       return res.status(404).json({
//         error: 'Valoracion not found'
//       });
//     }
//
//     // Check permissions - users can only delete their own valoraciones
//     if (req.user.rol_nombre !== 'admin' && valoracion.id_usuario !== req.user.id_usuario) {
//       return res.status(403).json({
//         error: 'Access denied',
//         message: 'You can only delete your own valoraciones'
//       });
//     }
//
//     await Valoracion.delete(req.params.id);
//     
//     res.json({
//       success: true,
//       message: 'Valoracion deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to delete valoracion',
//       message: 'Internal server error'
//     });
//   }
// });

// Admin only routes
router.put('/:id/approve', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const approvedValoracion = await Valoracion.approve(req.params.id);
    
    res.json({
      success: true,
      message: 'Valoracion approved successfully',
      data: approvedValoracion
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to approve valoracion',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
