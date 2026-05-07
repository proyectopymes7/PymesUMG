const { executeQuery, sql } = require('../config/database');

class ProductoServicio {
  static async create(productoData) {
    const query = `
      INSERT INTO PRODUCTOS_SERVICIOS (
        id_emprendimiento, nombre, precio, disponible, tipo, visibilidad_precio
      )
      VALUES (
        @id_emprendimiento, @nombre, @precio, @disponible, @tipo, @visibilidad_precio
      );
      SELECT SCOPE_IDENTITY() as id_producto;
    `;
    
    const params = [
      { value: productoData.id_emprendimiento, type: sql.Int },
      { value: productoData.nombre, type: sql.VarChar },
      { value: productoData.precio, type: sql.Decimal },
      { value: productoData.disponible !== undefined ? productoData.disponible : 1, type: sql.Bit },
      { value: productoData.tipo || 'producto', type: sql.VarChar },
      { value: productoData.visibilidad_precio || 'publico', type: sql.VarChar }
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
      SELECT ps.*, 
             e.nombre as emprendimiento_nombre,
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = @id_producto) as total_imagenes
      FROM PRODUCTOS_SERVICIOS ps
      LEFT JOIN EMPRENDIMIENTOS e ON ps.id_emprendimiento = e.id_emprendimiento
      WHERE ps.id_producto = @id_producto;
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
      SELECT ps.*, 
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto) as total_imagenes
      FROM PRODUCTOS_SERVICIOS ps
      WHERE ps.id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ value: id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.disponible !== undefined) {
      query += ` AND ps.disponible = @param${paramIndex}`;
      params.push({ value: filters.disponible, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

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
      SELECT ps.*, 
             e.nombre as emprendimiento_nombre,
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto) as total_imagenes
      FROM PRODUCTOS_SERVICIOS ps
      LEFT JOIN EMPRENDIMIENTOS e ON ps.id_emprendimiento = e.id_emprendimiento
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND ps.id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.disponible !== undefined) {
      query += ` AND ps.disponible = @param${paramIndex}`;
      params.push({ value: filters.disponible, type: sql.Bit });
      paramIndex++;
    }

    if (filters.min_precio) {
      query += ` AND ps.precio >= @param${paramIndex}`;
      params.push({ value: filters.min_precio, type: sql.Decimal });
      paramIndex++;
    }

    if (filters.max_precio) {
      query += ` AND ps.precio <= @param${paramIndex}`;
      params.push({ value: filters.max_precio, type: sql.Decimal });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

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

  static async search(term, filters = {}) {
    let query = `
      SELECT ps.*, 
             e.nombre as emprendimiento_nombre,
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto) as total_imagenes
      FROM PRODUCTOS_SERVICIOS ps
      LEFT JOIN EMPRENDIMIENTOS e ON ps.id_emprendimiento = e.id_emprendimiento
      WHERE ps.nombre LIKE @term
    `;
    
    const params = [{ value: `%${term}%`, type: sql.NVarChar }];
    let paramIndex = 1;

    if (filters.id_emprendimiento) {
      query += ` AND ps.id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

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

  static async update(id, productoData) {
    const setClause = [];
    const params = [{ value: id, type: sql.Int }];

    Object.keys(productoData).forEach((key, index) => {
      if (productoData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ value: productoData[key], type: sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE PRODUCTOS_SERVICIOS 
      SET ${setClause.join(', ')}
      WHERE id_producto = @id_producto;
    `;

    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete will be implemented later
  // static async delete(id) {
  //   const query = 'DELETE FROM PRODUCTOS_SERVICIOS WHERE id_producto = @id_producto';
  //   const params = [{ value: id, type: sql.Int }];
  //   
  //   try {
  //     await executeQuery(query, params);
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM PRODUCTOS_SERVICIOS WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND id_emprendimiento = @param${paramIndex}`;
      params.push({ value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND tipo = @param${paramIndex}`;
      params.push({ value: filters.tipo, type: sql.VarChar });
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

module.exports = ProductoServicio;
