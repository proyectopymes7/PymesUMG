const { executeQuery, sql } = require('../config/database');

class User {
  static async create(userData) {
    const query = `
      INSERT INTO USUARIOS (id_rol, nombre, apellido, correo, password_hash, activo, fecha_registro)
      VALUES (@id_rol, @nombre, @apellido, @correo, @password_hash, @activo, GETDATE());
      SELECT SCOPE_IDENTITY() as id_usuario;
    `;
    
    const params = [
      { value: userData.id_rol, type: sql.Int },
      { value: userData.nombre, type: sql.NVarChar },
      { value: userData.apellido, type: sql.NVarChar },
      { value: userData.correo, type: sql.VarChar },
      { value: userData.password_hash, type: sql.VarChar },
      { value: userData.activo || 1, type: sql.Bit }
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
      FROM USUARIOS u
      LEFT JOIN ROLES r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = @id_usuario;
    `;
    
    const params = [{ value: id, type: sql.Int }];
    
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
      FROM USUARIOS u
      LEFT JOIN ROLES r ON u.id_rol = r.id_rol
      WHERE u.correo = @correo;
    `;
    
    const params = [{ value: email, type: sql.VarChar }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.activo, 
             u.fecha_registro, u.intentos_fallidos, u.bloqueado_hasta,
             r.nombre as rol_nombre
      FROM USUARIOS u
      LEFT JOIN ROLES r ON u.id_rol = r.id_rol
      ORDER BY u.fecha_registro DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;
    
    const params = [
      { value: offset, type: sql.Int },
      { value: limit, type: sql.Int }
    ];
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userData) {
    const setClause = [];
    const params = [{ value: id, type: sql.Int }];

    Object.keys(userData).forEach((key, index) => {
      if (userData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ value: userData[key], type: sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE USUARIOS 
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

  static async updateFailedAttempts(id, attempts) {
    const query = `
      UPDATE USUARIOS 
      SET intentos_fallidos = @intentos_fallidos
      WHERE id_usuario = @id_usuario;
    `;
    
    const params = [
      { value: attempts, type: sql.Int },
      { value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async blockUser(id, blockUntil) {
    const query = `
      UPDATE USUARIOS 
      SET bloqueado_hasta = @bloqueado_hasta, intentos_fallidos = 0
      WHERE id_usuario = @id_usuario;
    `;
    
    const params = [
      { value: blockUntil, type: sql.DateTime2 },
      { value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete will be implemented later
  // static async delete(id) {
  //   const query = 'DELETE FROM USUARIOS WHERE id_usuario = @id_usuario';
  //   const params = [{ value: id, type: sql.Int }];
  //   
  //   try {
  //     await executeQuery(query, params);
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM USUARIOS';
    
    try {
      const result = await executeQuery(query);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
