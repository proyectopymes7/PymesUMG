const { executeQuery, sql } = require('../config/database');

class Categoria {
  static async create(categoriaData) {
    const query = `
      INSERT INTO Categorias (id_categoria_padre, nombre, descripcion, activo)
      VALUES (@id_categoria_padre, @nombre, @descripcion, @activo);
      SELECT SCOPE_IDENTITY() as id_categoria;
    `;
    
    const params = [
      { name: 'id_categoria_padre', value: categoriaData.id_categoria_padre || null, type: sql.Int },
      { name: 'nombre', value: categoriaData.nombre, type: sql.VarChar },
      { name: 'descripcion', value: categoriaData.descripcion || null, type: sql.VarChar },
      { name: 'activo', value: categoriaData.activo !== undefined ? categoriaData.activo : 1, type: sql.Bit }
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
      SELECT c.*, 
             cp.nombre as nombre_padre
      FROM Categorias c
      LEFT JOIN Categorias cp ON c.id_categoria_padre = cp.id_categoria
      WHERE c.id_categoria = @id_categoria;
    `;
    
    const params = [{ name: 'id_categoria', value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(activeOnly = false) {
    const query = activeOnly 
      ? 'SELECT * FROM Categorias WHERE activo = 1 ORDER BY nombre'
      : 'SELECT * FROM Categorias ORDER BY nombre';
    
    try {
      return await executeQuery(query);
    } catch (error) {
      throw error;
    }
  }

  static async findTree() {
    const query = `
      WITH CategoryTree AS (
        SELECT 
          id_categoria,
          id_categoria_padre,
          nombre,
          descripcion,
          activo,
          0 as level,
          CAST(id_categoria AS VARCHAR(100)) as path
        FROM Categorias
        WHERE id_categoria_padre IS NULL
        
        UNION ALL
        
        SELECT 
          c.id_categoria,
          c.id_categoria_padre,
          c.nombre,
          c.descripcion,
          c.activo,
          ct.level + 1,
          CAST(ct.path + '/' + CAST(c.id_categoria AS VARCHAR(10)) AS VARCHAR(100))
        FROM Categorias c
        INNER JOIN CategoryTree ct ON c.id_categoria_padre = ct.id_categoria
      )
      SELECT 
        ct.*,
        cp.nombre as nombre_padre
      FROM CategoryTree ct
      LEFT JOIN Categorias cp ON ct.id_categoria_padre = cp.id_categoria
      ORDER BY ct.path;
    `;
    
    try {
      return await executeQuery(query);
    } catch (error) {
      throw error;
    }
  }

  static async findSubcategories(parentId) {
    const query = `
      SELECT * FROM Categorias 
      WHERE id_categoria_padre = @id_categoria_padre 
      ORDER BY nombre;
    `;
    
    const params = [{ name: 'id_categoria_padre', value: parentId, type: sql.Int }];
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, categoriaData) {
    const setClause = [];
    const params = [{ name: 'id_categoria', value: id, type: sql.Int }];

    Object.keys(categoriaData).forEach((key, index) => {
      if (categoriaData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ name: `param${index}`, value: categoriaData[key], type: key === 'activo' ? sql.Bit : sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE Categorias 
      SET ${setClause.join(', ')}
      WHERE id_categoria = @id_categoria;
    `;

    try {
      await executeQuery(query, params);
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM Categorias';
    
    try {
      const result = await executeQuery(query);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Categoria;
