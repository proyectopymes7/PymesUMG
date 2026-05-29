const { executeQuery, sql } = require('../config/database');

class ProductoServicio {
  static async create(productoData) {
    const query = `
      INSERT INTO ProductosServicios (
        id_emprendimiento, nombre, descripcion, precio, disponible, tipo, visibilidad_precio
      )
      VALUES (
        @id_emprendimiento, @nombre, @descripcion, @precio, @disponible, @tipo, @visibilidad_precio
      );
      SELECT SCOPE_IDENTITY() as id_producto;
    `;

    const params = [
      { name: 'id_emprendimiento', value: productoData.id_emprendimiento, type: sql.Int },
      { name: 'nombre',            value: productoData.nombre, type: sql.VarChar },
      { name: 'descripcion',       value: productoData.descripcion || null, type: sql.NVarChar },
      { name: 'precio',            value: productoData.precio !== undefined ? productoData.precio : null, type: sql.Decimal },
      { name: 'disponible',        value: productoData.disponible !== undefined ? productoData.disponible : 1, type: sql.Bit },
      { name: 'tipo',              value: productoData.tipo || 'producto', type: sql.VarChar },
      { name: 'visibilidad_precio',value: productoData.visibilidad_precio || 'VISIBLE', type: sql.VarChar }
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
      FROM ProductosServicios ps
      LEFT JOIN Emprendimientos e ON ps.id_emprendimiento = e.id_emprendimiento
      WHERE ps.id_producto = @id_producto;
    `;
    
    const params = [{ name: 'id_producto', value: id, type: sql.Int }];
    
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
             (SELECT TOP 1 url FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto ORDER BY id_imagen_producto ASC) as imagen_url,
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto) as total_imagenes
      FROM ProductosServicios ps
      WHERE ps.id_emprendimiento = @id_emprendimiento
    `;
    
    const params = [{ name: 'id_emprendimiento', value: id_emprendimiento, type: sql.Int }];
    let paramIndex = 1;

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.disponible !== undefined) {
      query += ` AND ps.disponible = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.disponible, type: sql.Bit });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const offset = filters.offset || 0;
      params.push({ name: 'offset', value: offset, type: sql.Int });
      params.push({ name: 'limit', value: filters.limit, type: sql.Int });
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
      FROM ProductosServicios ps
      LEFT JOIN Emprendimientos e ON ps.id_emprendimiento = e.id_emprendimiento
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND ps.id_emprendimiento = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.disponible !== undefined) {
      query += ` AND ps.disponible = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.disponible, type: sql.Bit });
      paramIndex++;
    }

    if (filters.min_precio) {
      query += ` AND ps.precio >= @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.min_precio, type: sql.Decimal });
      paramIndex++;
    }

    if (filters.max_precio) {
      query += ` AND ps.precio <= @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.max_precio, type: sql.Decimal });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const offset = filters.offset || 0;
      params.push({ name: 'offset', value: offset, type: sql.Int });
      params.push({ name: 'limit', value: filters.limit, type: sql.Int });
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
             e.logo_url as emprendimiento_logo,
             e.municipio as emprendimiento_municipio,
             e.departamento as emprendimiento_departamento,
             e.id_emprendimiento as emprendimiento_id,
             c.nombre as categoria_nombre,
             (SELECT TOP 1 url FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto ORDER BY id_imagen_producto ASC) as imagen_url,
             (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = ps.id_producto) as total_imagenes
      FROM ProductosServicios ps
      LEFT JOIN Emprendimientos e ON ps.id_emprendimiento = e.id_emprendimiento
      LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
      WHERE (ps.nombre LIKE @term OR ps.descripcion LIKE @term)
        AND LOWER(e.estado) IN ('activo', 'aprobado')
        AND ps.disponible = 1
    `;
    
    const params = [{ name: 'term', value: term ? `%${term}%` : '%', type: sql.NVarChar }];
    let paramIndex = 1;

    if (filters.id_emprendimiento) {
      query += ` AND ps.id_emprendimiento = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND ps.tipo = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.tipo, type: sql.VarChar });
      paramIndex++;
    }

    query += ` ORDER BY ps.nombre`;

    if (filters.limit) {
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      const offset = filters.offset || 0;
      params.push({ name: 'offset', value: offset, type: sql.Int });
      params.push({ name: 'limit', value: filters.limit, type: sql.Int });
    }
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, productoData) {
    const setClause = [];
    const params = [{ name: 'id_producto', value: id, type: sql.Int }];

    const typeFor = (key) => {
      if (key === 'precio') return sql.Decimal;
      if (key === 'disponible') return sql.Bit;
      if (key === 'id_emprendimiento') return sql.Int;
      return sql.NVarChar;
    };

    Object.keys(productoData).forEach((key, index) => {
      const val = productoData[key];
      if (val !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ name: `param${index}`, value: val === '' ? null : val, type: typeFor(key) });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE ProductosServicios 
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

  static async delete(id) {
    const query = `DELETE FROM ProductosServicios WHERE id_producto = @id_producto`;
    const params = [{ name: 'id_producto', value: id, type: sql.Int }];
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM ProductosServicios WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.id_emprendimiento) {
      query += ` AND id_emprendimiento = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_emprendimiento, type: sql.Int });
      paramIndex++;
    }

    if (filters.tipo) {
      query += ` AND tipo = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.tipo, type: sql.VarChar });
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
