const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { executeQuery, sql } = require('../config/database');

// Protected routes
router.get('/', auth, async (req, res) => {
  try {
    const filters = {
      id_emprendimiento: req.query.id_emprendimiento,
      id_usuario: req.query.id_usuario,
      tipo_campo: req.query.tipo_campo,
      aceptado: req.query.aceptado === 'true' ? 1 : req.query.aceptado === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    let query = `
      SELECT s.*, 
             e.nombre as emprendimiento_nombre,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM SUGERENCIAS_IA s
      LEFT JOIN EMPRENDIMIENTOS e ON s.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN USUARIOS u ON s.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND s.id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.id_usuario) {
      query += ` AND s.id_usuario = @param${paramIndex}`;
      params.push({ value: filters.id_usuario, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo_campo) {
      query += ` AND s.tipo_campo = @param${paramIndex}`;
      params.push({ value: filters.tipo_campo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.aceptado !== undefined) {
      query += ` AND s.aceptado = @param${paramIndex}`;
      params.push({ value: filters.aceptado, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY s.fecha_generacion DESC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      params.push({ value: filters.offset, type: sql.Int });
      params.push({ value: filters.limit, type: sql.Int });
    }
    
    const sugerencias = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: sugerencias
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get sugerencias',
      message: 'Internal server error'
    });
  }
});

router.get('/emprendimiento/:id_emprendimiento', auth, async (req, res) => {
  try {
    const filters = {
      tipo_campo: req.query.tipo_campo,
      aceptado: req.query.aceptado === 'true' ? 1 : req.query.aceptado === 'false' ? 0 : undefined,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    let query = `
      SELECT s.*, 
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM SUGERENCIAS_IA s
      LEFT JOIN USUARIOS u ON s.id_usuario = u.id_usuario
      WHERE s.id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ value: req.params.id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (filters.tipo_campo) {
      query += ` AND s.tipo_campo = @param${paramIndex}`;
      params.push({ value: filters.tipo_campo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.aceptado !== undefined) {
      query += ` AND s.aceptado = @param${paramIndex}`;
      params.push({ value: filters.aceptado, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY s.fecha_generacion DESC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      params.push({ value: filters.offset, type: sql.Int });
      params.push({ value: filters.limit, type: sql.Int });
    }
    
    const sugerencias = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: sugerencias
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get sugerencias',
      message: 'Internal server error'
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { id_emprendimiento, tipo_campo, texto_sugerido } = req.body;
    
    if (!id_emprendimiento || !tipo_campo || !texto_sugerido) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento, tipo_campo, and texto_sugerido are required'
      });
    }

    const query = `
      INSERT INTO SUGERENCIAS_IA 
      (id_emprendimiento, id_usuario, tipo_campo, texto_sugerido, aceptado, fecha_generacion)
      VALUES (@id_emprendimiento, @id_usuario, @tipo_campo, @texto_sugerido, 0, GETDATE());
      SELECT SCOPE_IDENTITY() as id_sugerencia;
    `;
    
    const params = [
      { value: id_emprendimiento, type: sql.Int },
      { value: req.user.id_usuario, type: sql.Int },
      { value: tipo_campo, type: sql.VarChar },
      { value: texto_sugerido, type: sql.NVarChar }
    ];
    
    const result = await executeQuery(query, params);
    
    res.status(201).json({
      success: true,
      message: 'Sugerencia created successfully',
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create sugerencia',
      message: 'Internal server error'
    });
  }
});

router.put('/:id/accept', auth, async (req, res) => {
  try {
    const query = `
      UPDATE SUGERENCIAS_IA 
      SET aceptado = 1
      WHERE id_sugerencia = @id_sugerencia;
    `;
    
    const params = [{ value: req.params.id, type: sql.Int }];
    
    await executeQuery(query, params);
    
    res.json({
      success: true,
      message: 'Sugerencia accepted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to accept sugerencia',
      message: 'Internal server error'
    });
  }
});

router.put('/:id/reject', auth, async (req, res) => {
  try {
    const query = `
      UPDATE SUGERENCIAS_IA 
      SET aceptado = 0
      WHERE id_sugerencia = @id_sugerencia;
    `;
    
    const params = [{ value: req.params.id, type: sql.Int }];
    
    await executeQuery(query, params);
    
    res.json({
      success: true,
      message: 'Sugerencia rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reject sugerencia',
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const query = 'DELETE FROM SUGERENCIAS_IA WHERE id_sugerencia = @id_sugerencia';
    const params = [{ value: req.params.id, type: sql.Int }];
    
    await executeQuery(query, params);
    
    res.json({
      success: true,
      message: 'Sugerencia deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete sugerencia',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
