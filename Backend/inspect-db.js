require('dotenv').config();
const { connectDB, sql } = require('./config/database');

async function inspectDatabase() {
    console.log('--- Inspeccionando Base de Datos ---');
    
    try {
        const pool = await connectDB();
        console.log('✅ Conexión exitosa!\n');

        // 1. Listar tablas
        console.log('📋 Tablas encontradas:');
        const tablesResult = await pool.request().query(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA != 'sys'"
        );
        
        const tables = tablesResult.recordset;
        
        if (tables.length === 0) {
            console.log('No se encontraron tablas en la base de datos.');
        } else {
            for (const table of tables) {
                const tableName = table.TABLE_NAME;
                console.log(`\n🔹 Tabla: ${tableName}`);
                
                // 2. Listar columnas de la tabla
                const columnsResult = await pool.request()
                    .input('tableName', sql.NVarChar, tableName)
                    .query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName");
                
                const columns = columnsResult.recordset.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE}${c.IS_NULLABLE === 'YES' ? ', null' : ''})`).join(', ');
                console.log(`   Columnas: ${columns}`);
                
                // 3. Contar registros
                const countResult = await pool.request().query(`SELECT COUNT(*) as total FROM [${tableName}]`);
                console.log(`   Registros: ${countResult.recordset[0].total}`);
            }
        }

        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al inspeccionar:', err.message);
        process.exit(1);
    }
}

inspectDatabase();
