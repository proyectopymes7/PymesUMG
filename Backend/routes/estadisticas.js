const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { executeQuery, sql } = require('../config/database');

// Public routes (read-only)
router.get('/emprendimiento/:id_emprendimiento', optionalAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT * FROM ESTADISTICAS_DIARIAS 
      WHERE id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ value: req.params.id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND fecha >= @param${paramIndex}`;
      params.push({ value: startDate, type: sql.Date });
      paramIndex++;
    }

    if (endDate) {
      query += ` AND fecha <= @param${paramIndex}`;
      params.push({ value: endDate, type: sql.Date });
      paramIndex++;
    }

    query += ` ORDER BY fecha DESC`;
    
    const estadisticas = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get estadisticas',
      message: 'Internal server error'
    });
  }
});

router.get('/emprendimiento/:id_emprendimiento/summary', optionalAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        SUM(vistas_dia) as total_vistas,
        SUM(clicks_whatsapp) as total_clicks_whatsapp,
        SUM(clicks_maps) as total_clicks_maps,
        SUM(total_busquedas) as total_busquedas,
        COUNT(*) as dias_registrados,
        AVG(vistas_dia) as promedio_vistas_diarias
      FROM ESTADISTICAS_DIARIAS 
      WHERE id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ value: req.params.id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND fecha >= @param${paramIndex}`;
      params.push({ value: startDate, type: sql.Date });
      paramIndex++;
    }

    if (endDate) {
      query += ` AND fecha <= @param${paramIndex}`;
      params.push({ value: endDate, type: sql.Date });
      paramIndex++;
    }
    
    const result = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get estadisticas summary',
      message: 'Internal server error'
    });
  }
});

// Protected routes
router.post('/daily', auth, async (req, res) => {
  try {
    const { id_emprendimiento, vistas_dia, clicks_whatsapp, clicks_maps, total_busquedas, fecha } = req.body;
    
    if (!id_emprendimiento || !fecha) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'id_emprendimiento and fecha are required'
      });
    }

    // Check if record already exists for this date
    const checkQuery = `
      SELECT id_estadistica FROM ESTADISTICAS_DIARIAS 
      WHERE id_emprendimiento = @id_emprendimiento AND fecha = @fecha;
    `;
    
    const checkParams = [
      { value: id_emprendimiento, type: sql.Int },
      { value: fecha, type: sql.Date }
    ];
    
    const existingRecord = await executeQuery(checkQuery, checkParams);
    
    if (existingRecord.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE ESTADISTICAS_DIARIAS 
        SET vistas_dia = @vistas_dia, clicks_whatsapp = @clicks_whatsapp, 
            clicks_maps = @clicks_maps, total_busquedas = @total_busquedas
        WHERE id_emprendimiento = @id_emprendimiento AND fecha = @fecha;
      `;
      
      const updateParams = [
        { value: vistas_dia || 0, type: sql.Int },
        { value: clicks_whatsapp || 0, type: sql.Int },
        { value: clicks_maps || 0, type: sql.Int },
        { value: total_busquedas || 0, type: sql.Int },
        { value: id_emprendimiento, type: sql.Int },
        { value: fecha, type: sql.Date }
      ];
      
      await executeQuery(updateQuery, updateParams);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO ESTADISTICAS_DIARIAS 
        (id_emprendimiento, fecha, vistas_dia, clicks_whatsapp, clicks_maps, total_busquedas)
        VALUES (@id_emprendimiento, @fecha, @vistas_dia, @clicks_whatsapp, @clicks_maps, @total_busquedas);
      `;
      
      const insertParams = [
        { value: id_emprendimiento, type: sql.Int },
        { value: fecha, type: sql.Date },
        { value: vistas_dia || 0, type: sql.Int },
        { value: clicks_whatsapp || 0, type: sql.Int },
        { value: clicks_maps || 0, type: sql.Int },
        { value: total_busquedas || 0, type: sql.Int }
      ];
      
      await executeQuery(insertQuery, insertParams);
    }
    
    res.json({
      success: true,
      message: 'Estadisticas updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update estadisticas',
      message: 'Internal server error'
    });
  }
});

// Admin only routes
router.get('/dashboard', auth, authorize('superadministrador'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_emprendimientos,
        SUM(vistas_dia) as total_vistas,
        SUM(clicks_whatsapp) as total_clicks_whatsapp,
        SUM(clicks_maps) as total_clicks_maps,
        SUM(total_busquedas) as total_busquedas
      FROM ESTADISTICAS_DIARIAS
    `;
    
    const params = [];
    let paramIndex = 0;

    if (startDate) {
      query += ` WHERE fecha >= @param${paramIndex}`;
      params.push({ value: startDate, type: sql.Date });
      paramIndex++;
    }

    if (endDate) {
      query += `${paramIndex === 0 ? ' WHERE' : ' AND'} fecha <= @param${paramIndex}`;
      params.push({ value: endDate, type: sql.Date });
      paramIndex++;
    }
    
    const result = await executeQuery(query, params);
    
    // Get top emprendimientos by views
    const topQuery = `
      SELECT TOP 10 
        e.id_emprendimiento, e.nombre,
        SUM(ed.vistas_dia) as total_vistas
      FROM ESTADISTICAS_DIARIAS ed
      JOIN EMPRENDIMIENTOS e ON ed.id_emprendimiento = e.id_emprendimiento
      ${startDate || endDate ? 'WHERE' : ''}
      ${startDate ? `ed.fecha >= @param${paramIndex}` : ''}
      ${startDate && endDate ? 'AND' : ''}
      ${endDate ? `ed.fecha <= @param${paramIndex + 1}` : ''}
      GROUP BY e.id_emprendimiento, e.nombre
      ORDER BY total_vistas DESC;
    `;
    
    const topParams = [];
    if (startDate) topParams.push({ value: startDate, type: sql.Date });
    if (endDate) topParams.push({ value: endDate, type: sql.Date });
    
    const topEmprendimientos = await executeQuery(topQuery, topParams);
    
    res.json({
      success: true,
      data: {
        summary: result[0],
        topEmprendimientos
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
