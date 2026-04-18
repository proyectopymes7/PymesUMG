const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Admin only routes
router.get('/', auth, authorize('admin'), async (req, res) => {
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

router.get('/:id', auth, authorize('admin'), async (req, res) => {
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

router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
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
