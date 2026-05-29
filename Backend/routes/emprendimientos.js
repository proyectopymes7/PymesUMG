const express = require('express');
const router = express.Router();
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { searchRateLimiterMiddleware } = require('../middleware/rateLimiter');
const {
  createEmprendimiento,
  getEmprendimientos,
  getEmprendimientoById,
  updateEmprendimiento,
  deleteEmprendimiento,
  searchEmprendimientos,
  getMyEmprendimientos,
  validateCreateEmprendimiento,
  validateUpdateEmprendimiento
} = require('../controllers/emprendimientoController');

// Public routes
router.get('/', optionalAuth, getEmprendimientos);
router.get('/search', searchRateLimiterMiddleware, optionalAuth, searchEmprendimientos);
// Rutas específicas ANTES de /:id para que no sean capturadas por el parámetro dinámico
router.get('/my/emprendimientos', auth, getMyEmprendimientos);
router.get('/nearby/list', optionalAuth, async (req, res) => {
  const { lat, lng, radio = 15, limit = 20 } = req.query
  if (!lat || !lng) return res.status(400).json({ error: 'lat y lng son requeridos' })

  const { executeQuery, sql } = require('../config/database')
  try {
    // Subquery para poder filtrar con WHERE en lugar de HAVING (requerido en SQL Server)
    const query = `
      SELECT TOP (@limit) sub.*
      FROM (
        SELECT e.*,
          c.nombre as categoria_nombre,
          (SELECT STRING_AGG(c2.nombre, ', ')
           FROM EmprendimientoCategorias ec JOIN Categorias c2 ON ec.id_categoria = c2.id_categoria
           WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_nombres,
          (SELECT STRING_AGG(CAST(ec.id_categoria AS VARCHAR(10)), ',')
           FROM EmprendimientoCategorias ec
           WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_ids,
          (SELECT AVG(puntuacion) FROM CALIFICACIONES WHERE id_emprendimiento = e.id_emprendimiento) as rating_promedio,
          ROUND(
            6371 * 2 * ASIN(SQRT(
              POWER(SIN((RADIANS(e.latitud) - RADIANS(@lat)) / 2), 2) +
              COS(RADIANS(@lat)) * COS(RADIANS(e.latitud)) *
              POWER(SIN((RADIANS(e.longitud) - RADIANS(@lng)) / 2), 2)
            )), 2
          ) AS distancia_km
        FROM Emprendimientos e
        LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
        WHERE LOWER(e.estado) IN ('activo', 'aprobado')
          AND e.latitud IS NOT NULL
          AND e.longitud IS NOT NULL
      ) AS sub
      WHERE sub.distancia_km <= @radio
      ORDER BY sub.distancia_km ASC
    `
    const params = [
      { name: 'lat',   value: parseFloat(lat),  type: sql.Float },
      { name: 'lng',   value: parseFloat(lng),  type: sql.Float },
      { name: 'radio', value: parseFloat(radio), type: sql.Float },
      { name: 'limit', value: parseInt(limit),  type: sql.Int }
    ]
    const result = await executeQuery(query, params)
    res.json({ success: true, data: result })
  } catch (err) {
    console.error('Nearby error:', err.message)
    res.status(500).json({ error: 'Error al buscar negocios cercanos' })
  }
});
router.get('/:id', optionalAuth, getEmprendimientoById);

// Protected routes
router.post('/', auth, validateCreateEmprendimiento, createEmprendimiento);
router.put('/:id', auth, validateUpdateEmprendimiento, updateEmprendimiento);
router.delete('/:id', auth, authorize('superadministrador'), deleteEmprendimiento);

module.exports = router;
