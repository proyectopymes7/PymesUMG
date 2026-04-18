const { executeQuery, sql } = require('../config/database');

class Valoracion {
  static async create(valoracionData) {
    const query = `
      INSERT INTO VALORACIONES (
        id_emprendimiento, id_usuario, nombre_display, comentario, fecha, aprobado
      )
      VALUES (
        @id_emprendimiento, @id_usuario, @nombre_display, @comentario, GETDATE(), @aprobado
      );
      SELECT SCOPE_IDENTITY() as id_valoracion;
    `;
    
    const params = [
      { value: valoracionData.id_emprendimiento, type: sql.Int },
      { value: valoracionData.id_usuario, type: sql.Int },
      { value: valoracionData.nombre_display, type: sql.VarChar },
      { value: valoracionData.comentario, type: sql.NVarChar },
      { value: valoracionData.aprobado || 0, type: sql.Bit }
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
      SELECT v.*, 
             e.nombre as emprendimiento_nombre,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM VALORACIONES v
      LEFT JOIN EMPRENDIMIENTOS e ON v.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN USUARIOS u ON v.id_usuario = u.id_usuario
      WHERE v.id_valoracion = @id_valoracion;
    `;
    
    const params = [{ value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmprendimiento(id_emprendimiento, filters = {}) {
    let query = `
      SELECT v.*, 
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM VALORACIONES v
      LEFT JOIN USUARIOS u ON v.id_usuario = u.id_usuario
      WHERE v.id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ value: id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (filters.aprobado !== undefined) {
      query += ` AND v.aprobado = @param${paramIndex}`;
      params.push({ value: filters.aprobado, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY v.fecha DESC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const offset = filters.offset || 0;
      params.push({ value: offset, type: sql.Int });
      params.push({ value: filters.limit, type: sql.Int });
    }
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT v.*, 
             e.nombre as emprendimiento_nombre,
             u.nombre as usuario_nombre, u.apellido as usuario_apellido
      FROM VALORACIONES v
      LEFT JOIN EMPRENDIMIENTOS e ON v.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN USUARIOS u ON v.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND v.id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.aprobado !== undefined) {
      query += ` AND v.aprobado = @param${paramIndex}`;
      params.push({ value: filters.aprobado, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY v.fecha DESC`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const offset = filters.offset || 0;
      params.push({ value: offset, type: sql.Int });
      params.push({ value: filters.limit, type: sql.Int });
    }
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, valoracionData) {
    const setClause = [];
    const params = [{ value: id, type: sql.Int }];

    Object.keys(valoracionData).forEach((key, index) => {
      if (valoracionData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ value: valoracionData[key], type: sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE VALORACIONES 
      SET ${setClause.join(', ')}
      WHERE id_valoracion = @id_valoracion;
    `;

    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async approve(id) {
    const query = `
      UPDATE VALORACIONES 
      SET aprobado = 1
      WHERE id_valoracion = @id_valoracion;
    `;
    
    const params = [{ value: id, type: sql.Int }];
    
    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete will be implemented later
  // static async delete(id) {
  //   const query = 'DELETE FROM VALORACIONES WHERE id_valoracion = @id_valoracion';
  //   const params = [{ value: id, type: sql.Int }];
  //   
  //   try {
  //     await executeQuery(query, params);
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM VALORACIONES WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.aprobado !== undefined) {
      query += ` AND aprobado = @param${paramIndex}`;
      params.push({ value: filters.aprobado, type: sql.Bit });
      paramIndex++;
    }
    
    try {
      const result = await executeQuery(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Valoracion;
