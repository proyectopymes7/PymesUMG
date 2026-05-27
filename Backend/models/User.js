const { executeQuery, sql } = require('../config/database');

class User {
  static async create(userData) {
    const query = `
      INSERT INTO Usuarios (id_rol, nombre, apellido, correo, password_hash, activo, fecha_registro)
      VALUES (@id_rol, @nombre, @apellido, @correo, @password_hash, @activo, GETDATE());
      SELECT SCOPE_IDENTITY() as id_usuario;
    `;
    
    const params = [
      { name: 'id_rol', value: userData.id_rol, type: sql.Int },
      { name: 'nombre', value: userData.nombre, type: sql.NVarChar },
      { name: 'apellido', value: userData.apellido, type: sql.NVarChar },
      { name: 'correo', value: userData.correo, type: sql.VarChar },
      { name: 'password_hash', value: userData.password_hash, type: sql.VarChar },
      { name: 'activo', value: userData.activo || 1, type: sql.Bit }
    ];

    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM Usuarios u
      LEFT JOIN Roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = @id_usuario;
    `;
    
    const params = [{ name: 'id_usuario', value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = `
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM Usuarios u
      LEFT JOIN Roles r ON u.id_rol = r.id_rol
      WHERE u.correo = @correo;
    `;
    
    const params = [{ name: 'correo', value: email, type: sql.VarChar }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.activo, u.id_rol,
             u.fecha_registro, u.intentos_fallidos, u.bloqueado_hasta,
             r.nombre as rol_nombre
      FROM Usuarios u
      LEFT JOIN Roles r ON u.id_rol = r.id_rol
      ORDER BY u.fecha_registro DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    
    const params = [
      { name: 'offset', value: offset, type: sql.Int },
      { name: 'limit', value: limit, type: sql.Int }
    ];
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    const setClause = [];
    const params = [{ name: 'id_usuario', value: id, type: sql.Int }];

    Object.keys(userData).forEach((key, index) => {
      if (userData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ name: `param${index}`, value: userData[key], type: sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE Usuarios 
      SET ${setClause.join(', ')}
      WHERE id_usuario = @id_usuario;
    `;

    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async updateRole(id, roleId) {
    const query = `UPDATE Usuarios SET id_rol = @id_rol WHERE id_usuario = @id_usuario;`;
    const params = [
      { name: 'id_rol', value: roleId, type: sql.Int },
      { name: 'id_usuario', value: id, type: sql.Int }
    ];
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async updateFailedAttempts(id, attempts) {
    const query = `
      UPDATE Usuarios 
      SET intentos_fallidos = @intentos_fallidos
      WHERE id_usuario = @id_usuario;
    `;
    
    const params = [
      { name: 'intentos_fallidos', value: attempts, type: sql.Int },
      { name: 'id_usuario', value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async blockUser(id, blockUntil) {
    const query = `
      UPDATE Usuarios 
      SET bloqueado_hasta = @bloqueado_hasta, intentos_fallidos = 0
      WHERE id_usuario = @id_usuario;
    `;
    
    const params = [
      { name: 'bloqueado_hasta', value: blockUntil, type: sql.DateTime2 },
      { name: 'id_usuario', value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM Usuarios';
    
    try {
      const result = await executeQuery(query);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
