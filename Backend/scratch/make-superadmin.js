require('dotenv').config();
const { connectDB } = require('../config/database');

async function makeSuperAdmin() {
  const correo = 'rudytest@gmail.com';
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('correo', correo)
      .query(`UPDATE Usuarios SET id_rol = 1 WHERE correo = @correo;
              SELECT id_usuario, nombre, correo, id_rol FROM Usuarios WHERE correo = @correo`);
    const user = result.recordset[0];
    if (user) {
      console.log(`✓ ${user.nombre} (${user.correo}) → id_rol: ${user.id_rol} (SuperAdministrador)`);
    } else {
      console.log('Usuario no encontrado:', correo);
    }
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

makeSuperAdmin();
