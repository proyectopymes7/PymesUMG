const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { executeQuery, sql } = require('../config/database');

// Public routes (read-only)
router.get('/emprendimiento/:id_emprendimiento', optionalAuth, async (req, res) => {
  try {
    const query = `
      SELECT * FROM IMAGENES_EMPRENDIMIENTO 
      WHERE id_emprendimiento = @id_emprendimiento 
      ORDER BY orden ASC;
    `;
    
    const params = [{ value: req.params.id_emprendimiento, type: sql.Int }];
    const imagenes = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: imagenes
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get imagenes',
      message: 'Internal server error'
    });
  }
});

router.get('/producto/:id_producto', optionalAuth, async (req, res) => {
  try {
    const query = `
      SELECT * FROM IMAGENES_PRODUCTO 
      WHERE id_producto = @id_producto 
      ORDER BY orden ASC;
    `;
    
    const params = [{ value: req.params.id_producto, type: sql.Int }];
    const imagenes = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: imagenes
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get imagenes',
      message: 'Internal server error'
    });
  }
});

// Protected routes
router.post('/emprendimiento', auth, async (req, res) => {
  try {
    const { id_emprendimiento, url, orden } = req.body;
    
    if (!id_emprendimiento || !url) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento and url are required'
      });
    }

    const query = `
      INSERT INTO IMAGENES_EMPRENDIMIENTO (id_emprendimiento, url, orden)
      VALUES (@id_emprendimiento, @url, @orden);
      SELECT SCOPE_IDENTITY() as id_imagen;
    `;
    
    const params = [
      { value: id_emprendimiento, type: sql.Int },
      { value: url, type: sql.VarChar },
      { value: orden || 0, type: sql.Int }
    ];
    
    const result = await executeQuery(query, params);
    
    res.status(201).json({
      success: true,
      message: 'Imagen created successfully',
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create imagen',
      message: 'Internal server error'
    });
  }
});

router.post('/producto', auth, async (req, res) => {
  try {
    const { id_producto, url, orden } = req.body;
    
    if (!id_producto || !url) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_producto and url are required'
      });
    }

    const query = `
      INSERT INTO IMAGENES_PRODUCTO (id_producto, url, orden)
      VALUES (@id_producto, @url, @orden);
      SELECT SCOPE_IDENTITY() as id_imagen_producto;
    `;
    
    const params = [
      { value: id_producto, type: sql.Int },
      { value: url, type: sql.VarChar },
      { value: orden || 0, type: sql.Int }
    ];
    
    const result = await executeQuery(query, params);
    
    res.status(201).json({
      success: true,
      message: 'Imagen created successfully',
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create imagen',
      message: 'Internal server error'
    });
  }
});

// Soft delete will be implemented later
// router.delete('/emprendimiento/:id', auth, async (req, res) => {
//   try {
//     const query = 'DELETE FROM IMAGENES_EMPRENDIMIENTO WHERE id_imagen = @id_imagen';
//     const params = [{ value: req.params.id, type: sql.Int }];
//     
//     await executeQuery(query, params);
//     
//     res.json({
//       success: true,
//       message: 'Imagen deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to delete imagen',
//       message: 'Internal server error'
//     });
//   }
// });

// router.delete('/producto/:id', auth, async (req, res) => {
//   try {
//     const query = 'DELETE FROM IMAGENES_PRODUCTO WHERE id_imagen_producto = @id_imagen_producto';
//     const params = [{ value: req.params.id, type: sql.Int }];
//     
//     await executeQuery(query, params);
//     
//     res.json({
//       success: true,
//       message: 'Imagen deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to delete imagen',
//       message: 'Internal server error'
//     });
//   }
// });

module.exports = router;
