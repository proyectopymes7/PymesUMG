const { executeQuery, sql } = require('../config/database');

class Emprendimiento {
  static async create(emprendimientoData) {
    const query = `
      INSERT INTO Emprendimientos (
        id_usuario, id_categoria, nombre, descripcion, telefono, whatsapp,
        latitud, longitud, horario, vistas, destacado, estado,
        departamento, municipio, localidad, direccion, fecha_registro
      )
      VALUES (
        @id_usuario, @id_categoria, @nombre, @descripcion, @telefono, @whatsapp,
        @latitud, @longitud, @horario, @vistas, @destacado, @estado,
        @departamento, @municipio, @localidad, @direccion, GETDATE()
      );
      SELECT SCOPE_IDENTITY() as id_emprendimiento;
    `;
    
    const params = [
      { name: 'id_usuario', value: emprendimientoData.id_usuario, type: sql.Int },
      { name: 'id_categoria', value: emprendimientoData.id_categoria, type: sql.Int },
      { name: 'nombre', value: emprendimientoData.nombre, type: sql.VarChar },
      { name: 'descripcion', value: emprendimientoData.descripcion, type: sql.NVarChar },
      { name: 'telefono', value: emprendimientoData.telefono, type: sql.VarChar },
      { name: 'whatsapp', value: emprendimientoData.whatsapp, type: sql.VarChar },
      { name: 'latitud', value: emprendimientoData.latitud, type: sql.Decimal },
      { name: 'longitud', value: emprendimientoData.longitud, type: sql.Decimal },
      { name: 'horario', value: emprendimientoData.horario, type: sql.VarChar },
      { name: 'vistas',       value: emprendimientoData.vistas || 0,                    type: sql.Int },
      { name: 'destacado',    value: emprendimientoData.destacado || 0,                 type: sql.Bit },
      { name: 'estado',       value: emprendimientoData.estado || 'PENDIENTE',          type: sql.VarChar },
      { name: 'departamento', value: emprendimientoData.departamento || null,           type: sql.NVarChar },
      { name: 'municipio',    value: emprendimientoData.municipio || null,              type: sql.NVarChar },
      { name: 'localidad',    value: emprendimientoData.localidad || null,              type: sql.NVarChar },
      { name: 'direccion',    value: emprendimientoData.direccion || null,              type: sql.NVarChar },
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
      SELECT e.*, 
             u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             c.nombre as categoria_nombre,
             (SELECT COUNT(*) FROM ProductosServicios WHERE id_emprendimiento = @id_emprendimiento) as total_productos,
             (SELECT COUNT(*) FROM ImagenesEmprendimiento WHERE id_emprendimiento = @id_emprendimiento) as total_imagenes,
             (SELECT AVG(puntuacion) FROM Calificaciones WHERE id_emprendimiento = @id_emprendimiento) as rating_promedio
      FROM Emprendimientos e
      LEFT JOIN Usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
      WHERE e.id_emprendimiento = @id_emprendimiento;
    `;
    
    const params = [{ name: 'id_emprendimiento', value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT e.*, 
             u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             c.nombre as categoria_nombre,
             (SELECT COUNT(*) FROM ProductosServicios WHERE id_emprendimiento = e.id_emprendimiento) as total_productos,
             (SELECT COUNT(*) FROM ImagenesEmprendimiento WHERE id_emprendimiento = e.id_emprendimiento) as total_imagenes,
             (SELECT AVG(puntuacion) FROM Calificaciones WHERE id_emprendimiento = e.id_emprendimiento) as rating_promedio
      FROM Emprendimientos e
      LEFT JOIN Usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 0;

    if (filters.id_categoria) {
      query += ` AND e.id_categoria = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_categoria, type: sql.Int });
      paramIndex++;
    }

    if (filters.estado) {
      query += ` AND e.estado = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.estado, type: sql.VarChar });
      paramIndex++;
    }

    if (filters.destacado !== undefined) {
      query += ` AND e.destacado = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.destacado, type: sql.Bit });
      paramIndex++;
    }

    if (filters.id_usuario) {
      query += ` AND e.id_usuario = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_usuario, type: sql.Int });
      paramIndex++;
    }

    query += ` ORDER BY e.fecha_registro DESC`;

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
      SELECT e.*, 
             u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             c.nombre as categoria_nombre,
             (SELECT COUNT(*) FROM ProductosServicios WHERE id_emprendimiento = e.id_emprendimiento) as total_productos,
             (SELECT COUNT(*) FROM ImagenesEmprendimiento WHERE id_emprendimiento = e.id_emprendimiento) as total_imagenes,
             (SELECT AVG(puntuacion) FROM Calificaciones WHERE id_emprendimiento = e.id_emprendimiento) as rating_promedio
      FROM Emprendimientos e
      LEFT JOIN Usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
      WHERE (e.nombre LIKE @term OR e.descripcion LIKE @term)
    `;
    
    const params = [{ name: 'term', value: `%${term}%`, type: sql.NVarChar }];
    let paramIndex = 1;

    if (filters.id_categoria) {
      query += ` AND e.id_categoria = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_categoria, type: sql.Int });
      paramIndex++;
    }

    if (filters.estado) {
      query += ` AND e.estado = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.estado, type: sql.VarChar });
      paramIndex++;
    }

    query += ` ORDER BY e.destacado DESC, e.vistas DESC`;

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

  static async update(id, emprendimientoData) {
    const setClause = [];
    const params = [{ name: 'id_emprendimiento', value: id, type: sql.Int }];

    Object.keys(emprendimientoData).forEach((key, index) => {
      if (emprendimientoData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ name: `param${index}`, value: emprendimientoData[key], type: sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE Emprendimientos 
      SET ${setClause.join(', ')}
      WHERE id_emprendimiento = @id_emprendimiento;
    `;

    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async incrementViews(id) {
    const query = `
      UPDATE Emprendimientos 
      SET vistas = vistas + 1
      WHERE id_emprendimiento = @id_emprendimiento;
    `;
    
    const params = [{ name: 'id_emprendimiento', value: id, type: sql.Int }];
    
    try {
      await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM Emprendimientos WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (filters.id_categoria) {
      query += ` AND id_categoria = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.id_categoria, type: sql.Int });
      paramIndex++;
    }

    if (filters.estado) {
      query += ` AND estado = @param${paramIndex}`;
      params.push({ name: `param${paramIndex}`, value: filters.estado, type: sql.VarChar });
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

module.exports = Emprendimiento;
