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

const app = express();

// Security middleware
app.use(helmet());
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
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  console.log("http://localhost:3000/health");
});

module.exports = app;
