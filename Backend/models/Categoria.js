const { executeQuery, sql } = require('../config/database');

class Categoria {
  static async create(categoriaData) {
    const query = `
      INSERT INTO CATEGORIAS (id_categoria_padre, nombre, descripcion, activo)
      VALUES (@id_categoria_padre, @nombre, @descripcion, @activo);
      SELECT SCOPE_IDENTITY() as id_categoria;
    `;
    
    const params = [
      { value: categoriaData.id_categoria_padre || null, type: sql.Int },
      { value: categoriaData.nombre, type: sql.VarChar },
      { value: categoriaData.descripcion, type: sql.VarChar },
      { value: categoriaData.activo !== undefined ? categoriaData.activo : 1, type: sql.Bit }
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
      FROM CATEGORIAS c
      LEFT JOIN CATEGORIAS cp ON c.id_categoria_padre = cp.id_categoria
      WHERE c.id_categoria = @id_categoria;
    `;
    
    const params = [{ value: id, type: sql.Int }];
    
    try {
      const result = await executeQuery(query, params);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  static async findAll(activeOnly = false) {
    const query = activeOnly 
      ? 'SELECT * FROM CATEGORIAS WHERE activo = 1 ORDER BY nombre'
      : 'SELECT * FROM CATEGORIAS ORDER BY nombre';
    
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
        FROM CATEGORIAS
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
        FROM CATEGORIAS c
        INNER JOIN CategoryTree ct ON c.id_categoria_padre = ct.id_categoria
      )
      SELECT 
        ct.*,
        cp.nombre as nombre_padre
      FROM CategoryTree ct
      LEFT JOIN CATEGORIAS cp ON ct.id_categoria_padre = cp.id_categoria
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
      SELECT * FROM CATEGORIAS 
      WHERE id_categoria_padre = @id_categoria_padre 
      ORDER BY nombre;
    `;
    
    const params = [{ value: parentId, type: sql.Int }];
    
    try {
      return await executeQuery(query, params);
    } catch (error) {
      throw error;
    }
  }

  static async update(id, categoriaData) {
    const setClause = [];
    const params = [{ value: id, type: sql.Int }];

    Object.keys(categoriaData).forEach((key, index) => {
      if (categoriaData[key] !== undefined) {
        setClause.push(`${key} = @param${index}`);
        params.push({ value: categoriaData[key], type: key === 'activo' ? sql.Bit : sql.NVarChar });
      }
    });

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE CATEGORIAS 
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

  // Soft delete will be implemented later
  // static async delete(id) {
  //   // Check if category has children
  //   const checkChildrenQuery = 'SELECT COUNT(*) as count FROM CATEGORIAS WHERE id_categoria_padre = @id_categoria';
  //   const checkChildrenParams = [{ value: id, type: sql.Int }];
  //   
  //   try {
  //     const childrenResult = await executeQuery(checkChildrenQuery, checkChildrenParams);
  //     if (childrenResult[0].count > 0) {
  //       throw new Error('Cannot delete category: it has subcategories');
  //     }
  //
  //     // Check if category is being used by emprendimientos
  //     const checkEmprendimientosQuery = 'SELECT COUNT(*) as count FROM EMPRENDIMIENTOS WHERE id_categoria = @id_categoria';
  //     const emprendimientosResult = await executeQuery(checkEmprendimientosQuery, checkChildrenParams);
  //     if (emprendimientosResult[0].count > 0) {
  //       throw new Error('Cannot delete category: it is being used by emprendimientos');
  //     }
  //
  //     const deleteQuery = 'DELETE FROM CATEGORIAS WHERE id_categoria = @id_categoria';
  //     await executeQuery(deleteQuery, [{ value: id, type: sql.Int }]);
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM CATEGORIAS';
    
    try {
      const result = await executeQuery(query);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Categoria;
