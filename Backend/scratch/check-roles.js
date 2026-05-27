require('dotenv').config();
const { connectDB } = require('../config/database');

async function checkRoles() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Roles');
        console.log('Roles in DB:');
        console.log(result.recordset);
        
        const users = await pool.request().query('SELECT id_usuario, nombre, id_rol, correo FROM Usuarios');
        console.log('Users in DB:');
        console.log(users.recordset);

        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkRoles();
