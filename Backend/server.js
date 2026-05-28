const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const categoriesRoutes = require('./routes/categories');
const emprendimientosRoutes = require('./routes/emprendimientos');
const productosRoutes = require('./routes/productos');
const imagenesRoutes = require('./routes/imagenes');
const publicacionesRoutes = require('./routes/publicaciones');
const estadisticasRoutes = require('./routes/estadisticas');
const valoracionesRoutes = require('./routes/valoraciones');
const sugerenciasRoutes = require('./routes/sugerencias');

const errorHandler = require('./middleware/errorHandler');
const { rateLimiterMiddleware } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginOpenerPolicy: false
}))
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiterMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PYMES Chiquimula Backend',
    version: '1.0.0'
  });
});

app.get('/api/test-users', async (req, res) => {
  const pool = await connectDB()
  const result = await pool.request().query('SELECT id_usuario, nombre, correo, id_rol FROM Usuarios')
  res.json(result.recordset)
})

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT @@VERSION as version');

    res.status(200).json({
      status: 'success',
      message: 'Conexión exitosa a Azure SQL',
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER,
      sqlVersion: result.recordset[0].version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Fallo la conexión a la base de datos',
      error: error.message,
      tip: error.message.includes('IP address') ? 'Tu IP no está autorizada en el Firewall de Azure.' : 'Verifica las credenciales en el archivo .env',
      timestamp: new Date().toISOString()
    });
  }
});

// ── Temporal: migración categorías múltiples ──────────────
app.get('/api/migrate-categories', async (req, res) => {
  try {
    const pool = await connectDB();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmprendimientoCategorias')
      CREATE TABLE EmprendimientoCategorias (
        id_emprendimiento INT NOT NULL,
        id_categoria      INT NOT NULL,
        PRIMARY KEY (id_emprendimiento, id_categoria),
        FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria)      REFERENCES Categorias(id_categoria)           ON DELETE CASCADE
      )
    `);
    await pool.request().query(`
      INSERT INTO EmprendimientoCategorias (id_emprendimiento, id_categoria)
      SELECT e.id_emprendimiento, e.id_categoria
      FROM Emprendimientos e
      WHERE e.id_categoria IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM EmprendimientoCategorias ec
          WHERE ec.id_emprendimiento = e.id_emprendimiento
        )
    `);
    const r = await pool.request().query('SELECT COUNT(*) as total FROM EmprendimientoCategorias');
    res.json({ success: true, total: r.recordset[0].total });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/emprendimientos', emprendimientosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/imagenes', imagenesRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/valoraciones', valoracionesRoutes);
app.use('/api/sugerencias', sugerenciasRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  console.log("http://localhost:3000/health");

  // Ensure EmprendimientoCategorias junction table exists
  try {
    const pool = await connectDB();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmprendimientoCategorias')
      CREATE TABLE EmprendimientoCategorias (
        id_emprendimiento INT NOT NULL,
        id_categoria      INT NOT NULL,
        PRIMARY KEY (id_emprendimiento, id_categoria),
        FOREIGN KEY (id_emprendimiento) REFERENCES Emprendimientos(id_emprendimiento) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria)      REFERENCES Categorias(id_categoria)           ON DELETE CASCADE
      )
    `);
    logger.info('EmprendimientoCategorias table ready');
  } catch (err) {
    logger.error('Failed to ensure EmprendimientoCategorias table:', err.message);
  }

  // Add foto_perfil column to Usuarios if it doesn't exist
  try {
    const pool = await connectDB();
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns
        WHERE object_id = OBJECT_ID('Usuarios') AND name = 'foto_perfil'
      )
      ALTER TABLE Usuarios ADD foto_perfil NVARCHAR(500) NULL
    `);
    logger.info('foto_perfil column ready');
  } catch (err) {
    logger.error('Failed to add foto_perfil column:', err.message);
  }

  // Drop any CHECK constraint on estado so ACTIVO/INACTIVO are accepted
  try {
    const pool = await connectDB();
    await pool.request().query(`
      DECLARE @cn NVARCHAR(256)
      SELECT @cn = cc.name
      FROM sys.check_constraints cc
      JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
      WHERE cc.parent_object_id = OBJECT_ID('Emprendimientos') AND c.name = 'estado'
      IF @cn IS NOT NULL
        EXEC('ALTER TABLE Emprendimientos DROP CONSTRAINT [' + @cn + ']')
    `);
    logger.info('Estado constraint check done');
  } catch (err) {
    logger.error('Failed to drop estado constraint:', err.message);
  }
});

module.exports = app;
