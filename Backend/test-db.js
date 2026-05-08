require('dotenv').config();
const { connectDB, sql } = require('./config/database');

async function testConnection() {
    console.log('--- Probando conexión a Azure SQL ---');
    console.log('Servidor:', process.env.DB_SERVER);
    console.log('Base de Datos:', process.env.DB_DATABASE);
    console.log('Usuario:', process.env.DB_USER);
    console.log('------------------------------------');

    try {
        const pool = await connectDB();
        console.log('✅ Conexión exitosa!');
        
        // Intentar una consulta simple
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('Versión de SQL Server:', result.recordset[0].version);
        
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al conectar:');
        console.error(err.message);
        if (err.message.includes('IP address')) {
            console.error('\nCONSEJO: Parece que tu IP no está autorizada en el Firewall de Azure.');
        }
        process.exit(1);
    }
}

testConnection();
