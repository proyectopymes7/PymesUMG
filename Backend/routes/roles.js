const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Rol = require('../models/Rol');

// Public routes (read-only)
router.get('/', async (req, res) => {
  try {
    const roles = await Rol.findAll();
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get roles',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rol = await Rol.findById(req.params.id);
    
    if (!rol) {
      return res.status(404).json({
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: rol
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get role',
      message: 'Internal server error'
    });
  }
});

// Admin only routes
router.post('/', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre || !descripcion) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Nombre and descripcion are required'
      });
    }

    const newRol = await Rol.create({ nombre, descripcion });
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRol
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create role',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre || !descripcion) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Nombre and descripcion are required'
      });
    }

    const updatedRol = await Rol.update(req.params.id, { nombre, descripcion });
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRol
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update role',
      message: 'Internal server error'
    });
  }
});

// Soft delete will be implemented later
// router.delete('/:id', auth, authorize('admin'), async (req, res) => {
//   try {
//     await Rol.delete(req.params.id);
//     
//     res.json({
//       success: true,
//       message: 'Role deleted successfully'
//     });
//   } catch (error) {
//     if (error.message.includes('Cannot delete role')) {
//       return res.status(400).json({
//         error: 'Cannot delete role',
//         message: error.message
//       });
//     }
//     
//     res.status(500).json({
//       error: 'Failed to delete role',
//       message: 'Internal server error'
//     });
//   }
// });

module.exports = router;
