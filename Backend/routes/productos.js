const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const ProductoServicio = require('../models/ProductoServicio');

// Public routes (read-only)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filters = {
      id_emprendimiento: req.query.id_emprendimiento,
      tipo: req.query.tipo,
      disponible: req.query.disponible === 'true' ? 1 : req.query.disponible === 'false' ? 0 : undefined,
      min_precio: req.query.min_precio,
      max_precio: req.query.max_precio,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const productos = await ProductoServicio.findAll(filters);
    const total = await ProductoServicio.count({
      id_emprendimiento: filters.id_emprendimiento,
      tipo: filters.tipo
    });

    res.json({
      success: true,
      data: productos,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get productos',
      message: 'Internal server error'
    });
  }
});

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q: term, id_emprendimiento, tipo, limit = 20, offset = 0 } = req.query;

    if (!term) {
      return res.status(400).json({
        error: 'Search term is required',
        message: 'Please provide a search term (q parameter)'
      });
    }

    const filters = {
      id_emprendimiento,
      tipo,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await ProductoServicio.search(term, filters);

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
    res.status(500).json({
      error: 'Search failed',
      message: 'Internal server error'
    });
  }
});

router.get('/emprendimiento/:id_emprendimiento', optionalAuth, async (req, res) => {
  try {
    const filters = {
      tipo: req.query.tipo,
      disponible: req.query.disponible === 'true' ? 1 : req.query.disponible === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const productos = await ProductoServicio.findByEmprendimiento(req.params.id_emprendimiento, filters);
    const total = await ProductoServicio.count({
      id_emprendimiento: req.params.id_emprendimiento,
      tipo: filters.tipo
    });

    res.json({
      success: true,
      data: productos,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get productos',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const producto = await ProductoServicio.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({
        error: 'Producto not found'
      });
    }

    res.json({
      success: true,
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get producto',
      message: 'Internal server error'
    });
  }
});

// Protected routes
router.post('/', auth, async (req, res) => {
  try {
    const { id_emprendimiento, nombre, precio, disponible, tipo, visibilidad_precio, descripcion } = req.body;

    if (!id_emprendimiento || !nombre) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento y nombre son requeridos'
      });
    }

    const newProducto = await ProductoServicio.create({
      id_emprendimiento,
      nombre,
      descripcion: descripcion || null,
      precio: precio !== undefined ? precio : null,
      disponible: disponible !== undefined ? disponible : 1,
      tipo: tipo || 'producto',
      visibilidad_precio: visibilidad_precio || 'VISIBLE'
    });
    
    res.status(201).json({
      success: true,
      message: 'Producto created successfully',
      data: newProducto
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create producto',
      message: 'Internal server error'
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = {};
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    const updatedProducto = await ProductoServicio.update(req.params.id, updateData);
    
    res.json({
      success: true,
      message: 'Producto updated successfully',
      data: updatedProducto
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update producto',
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const producto = await ProductoServicio.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto not found' });
    }
    await ProductoServicio.delete(req.params.id);
    res.json({ success: true, message: 'Producto deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete producto', message: 'Internal server error' });
  }
});

module.exports = router;
