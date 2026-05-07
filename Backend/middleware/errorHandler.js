const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack
  });

  // SQL Server error handling
  if (err.code === 'EREQUEST') {
    const message = 'Database operation failed';
    error = { message, statusCode: 500 };
  }

  // JWT error handling
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Duplicate key error
  if (err.number === 2627) {
    const message = 'Duplicate entry. This record already exists.';
    error = { message, statusCode: 409 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
