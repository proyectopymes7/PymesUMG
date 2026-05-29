const { executeQuery, sql } = require('../config/database');

class Emprendimiento {
  static async create(emprendimientoData) {
    const query = `
      INSERT INTO Emprendimientos (
        id_usuario, id_categoria, nombre, descripcion, telefono, whatsapp,
        latitud, longitud, horario, vistas, destacado, estado,
        departamento, municipio, localidad, direccion,
        instagram, facebook, website, fecha_registro
      )
      VALUES (
        @id_usuario, @id_categoria, @nombre, @descripcion, @telefono, @whatsapp,
        @latitud, @longitud, @horario, @vistas, @destacado, @estado,
        @departamento, @municipio, @localidad, @direccion,
        @instagram, @facebook, @website, GETDATE()
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
      { name: 'estado',       value: emprendimientoData.estado || 'pendiente',          type: sql.VarChar },
      { name: 'departamento', value: emprendimientoData.departamento || null,           type: sql.NVarChar },
      { name: 'municipio',    value: emprendimientoData.municipio || null,              type: sql.NVarChar },
      { name: 'localidad',    value: emprendimientoData.localidad || null,              type: sql.NVarChar },
      { name: 'direccion',    value: emprendimientoData.direccion || null,              type: sql.NVarChar },
      { name: 'instagram',   value: emprendimientoData.instagram || null,              type: sql.NVarChar },
      { name: 'facebook',    value: emprendimientoData.facebook || null,               type: sql.NVarChar },
      { name: 'website',     value: emprendimientoData.website || null,                type: sql.NVarChar },
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
             (SELECT STRING_AGG(c2.nombre, ', ')
              FROM EmprendimientoCategorias ec JOIN Categorias c2 ON ec.id_categoria = c2.id_categoria
              WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_nombres,
             (SELECT STRING_AGG(CAST(ec.id_categoria AS VARCHAR(10)), ',')
              FROM EmprendimientoCategorias ec
              WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_ids,
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
             (SELECT STRING_AGG(c2.nombre, ', ')
              FROM EmprendimientoCategorias ec JOIN Categorias c2 ON ec.id_categoria = c2.id_categoria
              WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_nombres,
             (SELECT STRING_AGG(CAST(ec.id_categoria AS VARCHAR(10)), ',')
              FROM EmprendimientoCategorias ec
              WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_ids,
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
      if (Array.isArray(filters.estado)) {
        const placeholders = filters.estado.map((_, i) => `@est${i}`).join(', ');
        query += ` AND e.estado IN (${placeholders})`;
        filters.estado.forEach((s, i) => {
          params.push({ name: `est${i}`, value: s, type: sql.VarChar });
        });
      } else {
        query += ` AND e.estado = @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: filters.estado, type: sql.VarChar });
        paramIndex++;
      }
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
    const ALLOWED = new Set([
      'id_categoria', 'nombre', 'descripcion', 'telefono', 'whatsapp',
      'latitud', 'longitud', 'horario', 'vistas', 'destacado', 'estado',
      'departamento', 'municipio', 'localidad', 'direccion', 'logo_url',
      'instagram', 'facebook', 'website'
    ]);
    const TYPE_MAP = {
      id_categoria: sql.Int,
      vistas:       sql.Int,
      destacado:    sql.Bit,
      latitud:      sql.Float,
      longitud:     sql.Float,
    };
    const { categorias, ...rest } = emprendimientoData;
    const setClause = [];
    const params = [{ name: 'id_emprendimiento', value: id, type: sql.Int }];
    let paramIdx = 0;

    Object.keys(rest).forEach((key) => {
      if (rest[key] !== undefined && ALLOWED.has(key)) {
        setClause.push(`${key} = @upd${paramIdx}`);
        params.push({ name: `upd${paramIdx}`, value: rest[key], type: TYPE_MAP[key] || sql.NVarChar });
        paramIdx++;
      }
    });

    // Ensure junction table exists (idempotent)
    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmprendimientoCategorias')
      CREATE TABLE EmprendimientoCategorias (
        id_emprendimiento INT NOT NULL REFERENCES Emprendimientos(id_emprendimiento) ON DELETE CASCADE,
        id_categoria      INT NOT NULL REFERENCES Categorias(id_categoria) ON DELETE CASCADE,
        PRIMARY KEY (id_emprendimiento, id_categoria)
      );
    `;

    try {
      await executeQuery(createTableQuery, []);
    } catch (_) { /* ignore if already exists or FK issues */ }

    try {
      if (setClause.length > 0) {
        const query = `UPDATE Emprendimientos SET ${setClause.join(', ')} WHERE id_emprendimiento = @id_emprendimiento;`;
        await executeQuery(query, params);
      }

      if (Array.isArray(categorias) && categorias.length > 0) {
        try {
          await executeQuery(
            'DELETE FROM EmprendimientoCategorias WHERE id_emprendimiento = @id',
            [{ name: 'id', value: id, type: sql.Int }]
          );
          for (const catId of categorias.slice(0, 3)) {
            await executeQuery(
              'INSERT INTO EmprendimientoCategorias (id_emprendimiento, id_categoria) VALUES (@id_emp, @id_cat)',
              [
                { name: 'id_emp', value: id,            type: sql.Int },
                { name: 'id_cat', value: Number(catId), type: sql.Int }
              ]
            );
          }
        } catch (catError) {
          // Categories update failed but main data was saved — log and continue
          console.error('Warning: categories update failed:', catError.message);
        }
      }

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

  static async delete(id) {
    const query = `DELETE FROM Emprendimientos WHERE id_emprendimiento = @id_emprendimiento;`;
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
      if (Array.isArray(filters.estado)) {
        const placeholders = filters.estado.map((_, i) => `@est${i}`).join(', ');
        query += ` AND estado IN (${placeholders})`;
        filters.estado.forEach((s, i) => {
          params.push({ name: `est${i}`, value: s, type: sql.VarChar });
        });
      } else {
        query += ` AND estado = @param${paramIndex}`;
        params.push({ name: `param${paramIndex}`, value: filters.estado, type: sql.VarChar });
        paramIndex++;
      }
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
