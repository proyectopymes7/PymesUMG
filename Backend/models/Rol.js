const { executeQuery, sql } = require('../config/database');

class Rol {
  static async create(rolData) {
    const query = `
      INSERT INTO Roles (nombre, descripcion)
      VALUES (@nombre, @descripcion);
      SELECT SCOPE_IDENTITY() as id_rol;
    `;
    
    const params = [
      { name: 'nombre', value: rolData.nombre, type: sql.VarChar },
      { name: 'descripcion', value: rolData.descripcion, type: sql.VarChar }
    ];

    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM Roles WHERE id_rol = @id_rol';
    const params = [{ name: 'id_rol', value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    const query = 'SELECT * FROM Roles ORDER BY nombre';
    
    try {
      return await executeQuery(query);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, rolData) {
    const query = `
      UPDATE Roles 
      SET nombre = @nombre, descripcion = @descripcion
      WHERE id_rol = @id_rol;
    `;
    
    const params = [
      { name: 'nombre', value: rolData.nombre, type: sql.VarChar },
      { name: 'descripcion', value: rolData.descripcion, type: sql.VarChar },
      { name: 'id_rol', value: id, type: sql.Int }
    ];
    
    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Rol;
