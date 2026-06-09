const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Categoria = require('../models/Categoria');

// Public routes (read-only)
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const categories = await Categoria.findAll(activeOnly);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get categories',
      message: 'Internal server error'
    });
  }
});

router.get('/tree', async (req, res) => {
  try {
    const tree = await Categoria.findTree();
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get category tree',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Categoria.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get category',
      message: 'Internal server error'
    });
  }
});

router.get('/:id/subcategories', async (req, res) => {
  try {
    const subcategories = await Categoria.findSubcategories(req.params.id);
    
    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get subcategories',
      message: 'Internal server error'
    });
  }
});

// Admin only routes
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { nombre, descripcion, id_categoria_padre, activo } = req.body;
    
    if (!nombre) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Nombre is required'
      });
    }

    const newCategory = await Categoria.create({
      nombre,
      descripcion,
      id_categoria_padre,
      activo
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create category',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.id_categoria_padre !== undefined) updateData.id_categoria_padre = req.body.id_categoria_padre;
    if (req.body.activo !== undefined) updateData.activo = req.body.activo;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    const updatedCategory = await Categoria.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update category',
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', auth, authorize('superadministrador'), async (req, res) => {
  try {
    await Categoria.update(req.params.id, { activo: false });
    res.json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate category', message: 'Internal server error' });
  }
});

module.exports = router;
