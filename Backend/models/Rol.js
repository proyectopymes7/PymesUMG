const { executeQuery, sql } = require('../config/database');

class Rol {
  static async create(rolData) {
    const query = `
      INSERT INTO ROLES (nombre, descripcion)
      VALUES (@nombre, @descripcion);
      SELECT SCOPE_IDENTITY() as id_rol;
    `;
    
    const params = [
      { value: rolData.nombre, type: sql.VarChar },
      { value: rolData.descripcion, type: sql.VarChar }
    ];

    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM ROLES WHERE id_rol = @id_rol';
    const params = [{ value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    const query = 'SELECT * FROM ROLES ORDER BY nombre';
    
    try {
      return await executeQuery(query);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, rolData) {
    const query = `
      UPDATE ROLES 
      SET nombre = @nombre, descripcion = @descripcion
      WHERE id_rol = @id_rol;
    `;
    
    const params = [
      { value: rolData.nombre, type: sql.VarChar },
      { value: rolData.descripcion, type: sql.VarChar },
      { value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete will be implemented later
  // static async delete(id) {
  //   // Check if role is being used by users
  //   const checkQuery = 'SELECT COUNT(*) as count FROM USUARIOS WHERE id_rol = @id_rol';
  //   const checkParams = [{ value: id, type: sql.Int }];
  //   
  //   try {
  //     const result = await executeQuery(checkQuery, checkParams);
  //     if (result[0].count > 0) {
  //       throw new Error('Cannot delete role: it is being used by users');
  //     }
  //
  //     const deleteQuery = 'DELETE FROM ROLES WHERE id_rol = @id_rol';
  //     await executeQuery(deleteQuery, [{ value: id, type: sql.Int }]);
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}

module.exports = Rol;
