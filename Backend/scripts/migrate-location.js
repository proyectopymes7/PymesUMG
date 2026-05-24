require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { executeQuery } = require('../config/database');

async function migrate() {
  console.log('Agregando columnas de ubicación a Emprendimientos...');

  // Agregar solo si no existen
  const checks = [
    { col: 'departamento', sql: `ALTER TABLE Emprendimientos ADD departamento NVARCHAR(100) NULL` },
    { col: 'municipio',    sql: `ALTER TABLE Emprendimientos ADD municipio    NVARCHAR(100) NULL` },
    { col: 'localidad',    sql: `ALTER TABLE Emprendimientos ADD localidad    NVARCHAR(150) NULL` },
    { col: 'direccion',    sql: `ALTER TABLE Emprendimientos ADD direccion    NVARCHAR(300) NULL` },
  ];

  for (const { col, sql } of checks) {
    const exists = await executeQuery(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Emprendimientos' AND COLUMN_NAME = '${col}'
    `);
    if (exists.length === 0) {
      await executeQuery(sql);
      console.log(`  ✓ Columna '${col}' agregada`);
    } else {
      console.log(`  · Columna '${col}' ya existe`);
    }
  }

  console.log('Migración completada.');
  process.exit(0);
}

migrate().catch(err => { console.error('Error en migración:', err); process.exit(1); });
