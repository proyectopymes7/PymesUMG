const sql = require('mssql');
const logger = require('../utils/logger');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: false,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    pool = await sql.connect(config);
    logger.info('Connected to Azure SQL database');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const executeQuery = async (query, params = []) => {
  try {
    const connection = await connectDB();
    const request = connection.request();
    
    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param.value, param.type);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    logger.error('Query execution failed:', error);
    throw error;
  }
};

const executeStoredProcedure = async (procedureName, params = {}) => {
  try {
    const connection = await connectDB();
    const request = connection.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key].value, params[key].type);
    });

    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    logger.error(`Stored procedure ${procedureName} execution failed:`, error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (pool) {
      await pool.close();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', disconnectDB);
process.on('SIGTERM', disconnectDB);

module.exports = {
  connectDB,
  executeQuery,
  executeStoredProcedure,
  disconnectDB,
  sql
};
