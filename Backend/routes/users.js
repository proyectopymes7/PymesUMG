const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Super admin only routes
router.get('/', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const users = await User.findAll(limit, offset);
    const total = await User.count();

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    delete user.password_hash;
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { nombre, apellido, telefono, foto_perfil } = req.body;
    const updateData = {};
    if (nombre      !== undefined) updateData.nombre      = nombre;
    if (apellido    !== undefined) updateData.apellido    = apellido;
    if (telefono    !== undefined) updateData.telefono    = telefono;
    if (foto_perfil !== undefined) updateData.foto_perfil = foto_perfil;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedUser = await User.update(req.params.id, updateData);
    delete updatedUser.password_hash;
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', message: 'Internal server error' });
  }
});

router.put('/:id/role', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { id_rol } = req.body;
    if (![1, 2, 3, 4].includes(id_rol)) {
      return res.status(400).json({ error: 'Invalid role', message: 'id_rol must be 1, 2, 3, or 4' });
    }
    await User.updateRole(req.params.id, id_rol);
    const updatedUser = await User.findById(req.params.id);
    delete updatedUser.password_hash;
    res.json({ success: true, message: 'Role updated successfully', data: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role', message: 'Internal server error' });
  }
});

router.put('/:id/status', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be a boolean value'
      });
    }

    const updatedUser = await User.update(req.params.id, { activo });
    delete updatedUser.password_hash;

    res.json({
      success: true,
      message: `User ${activo ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update user status',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
