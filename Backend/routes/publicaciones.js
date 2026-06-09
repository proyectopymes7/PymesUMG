const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { executeQuery, sql } = require('../config/database');

// Protected routes
router.get('/', auth, async (req, res) => {
  try {
    const filters = {
      id_emprendimiento: req.query.id_emprendimiento,
      tipo_accion: req.query.tipo_accion,
      estado: req.query.estado,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    let query = `
      SELECT p.*, 
             e.nombre as emprendimiento_nombre,
             u.nombre as admin_nombre, u.apellido as admin_apellido
      FROM PUBLICACIONES p
      LEFT JOIN EMPRENDIMIENTOS e ON p.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN USUARIOS u ON p.id_admin = u.id_usuario
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND p.id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo_accion) {
      query += ` AND p.tipo_accion = @param${paramIndex}`;
      params.push({ value: filters.tipo_accion, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.estado) {
      query += ` AND p.estado = @param${paramIndex}`;
      params.push({ value: filters.estado, type: sql.VarChar });
      paramIndex++;
    }

    query += ` ORDER BY p.fecha_solicitud DESC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      params.push({ value: filters.offset, type: sql.Int });
      params.push({ value: filters.limit, type: sql.Int });
    }
    
    const publicaciones = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: publicaciones
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get publicaciones',
      message: 'Internal server error'
    });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             e.nombre as emprendimiento_nombre,
             u.nombre as admin_nombre, u.apellido as admin_apellido
      FROM PUBLICACIONES p
      LEFT JOIN EMPRENDIMIENTOS e ON p.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN USUARIOS u ON p.id_admin = u.id_usuario
      WHERE p.id_publicacion = @id_publicacion;
    `;
    
    const params = [{ value: req.params.id, type: sql.Int }];
    const result = await executeQuery(query, params);
    
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Publicacion not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get publicacion',
      message: 'Internal server error'
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { id_emprendimiento, tipo_accion } = req.body;
    
    if (!id_emprendimiento || !tipo_accion) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento and tipo_accion are required'
      });
    }

    const query = `
      INSERT INTO PUBLICACIONES (id_emprendimiento, tipo_accion, estado, fecha_solicitud)
      VALUES (@id_emprendimiento, @tipo_accion, 'pendiente', GETDATE());
      SELECT SCOPE_IDENTITY() as id_publicacion;
    `;
    
    const params = [
      { value: id_emprendimiento, type: sql.Int },
      { value: tipo_accion, type: sql.VarChar }
    ];
    
    const result = await executeQuery(query, params);
    
    res.status(201).json({
      success: true,
      message: 'Publicacion created successfully',
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create publicacion',
      message: 'Internal server error'
    });
  }
});

router.put('/:id/resolve', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { estado, ip_admin } = req.body;
    
    if (!estado || !['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        error: 'Invalid estado',
        message: 'Estado must be aprobado or rechazado'
      });
    }

    const query = `
      UPDATE PUBLICACIONES 
      SET estado = @estado, fecha_resolucion = GETDATE(), id_admin = @id_admin, ip_admin = @ip_admin
      WHERE id_publicacion = @id_publicacion;
    `;
    
    const params = [
      { value: estado, type: sql.VarChar },
      { value: req.user.id_usuario, type: sql.Int },
      { value: ip_admin || req.ip, type: sql.VarChar },
      { value: req.params.id, type: sql.Int }
    ];
    
    await executeQuery(query, params);
    
    res.json({
      success: true,
      message: `Publicacion ${estado} successfully`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to resolve publicacion',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
