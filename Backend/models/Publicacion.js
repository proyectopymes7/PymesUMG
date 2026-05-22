const { executequery } = require('../config/database');

class Publicacion {

    static async create(data) {
        const query = `
            INSERT INTO PUBLICACIONES (
            id_emprendimiento,
            id_admin,
            tipo_accion,
            estado,
            fecha_solicitud,
            fecha resolucion,
            ip_admin
            )
            VALUES (
            @id_emprendimiento,
            @id_admin,
            @tipo_accion,
            @estado,
            GETDATE(),
            @fecha_resolucion,
            @ip_admin
            );

            SELECT SCOPE_IDENTITY() as id_publicacion;
        `;

        const params = [
            { value: data.id_emprendimiento, type: sql.Int },
            { value: data.id_admin || null, type: sql.Int },
            { value: data.tipo_accion, type: sql.NVarChar },
            { value: data.estado || 'pendiente', type: sql.NVarChar },
            { value: data.fecha_resolucion || null, type: sql.DateTime },
            { value: data.ip_admin || null, type: sql.NVarChar }
        ];

        const result = await executequery(query, params);

        return result[0];
    }

    static async findAll(filters = {}) {

        let query = `
            SELECT p.*,
                e.nombre as emprendimiento_nombre,
                a.nombre as admin_nombre,
                a.apellido as admin_apellido
            FROM PUBLICACIONES p
            LEFT JOIN EMPRENDIMIENTOS e 
             ON p.id_emprendimiento = e.id_emprendimient 
            LEFT JOIN USUARIOS u
                ON p.id_admin = u.id_usuario
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 0;
        
    if (filters.estado) {
      query += ` AND p.estado = @param${paramIndex}`;

      params.push({
        value: filters.estado,
        type: sql.VarChar
      });

      paramIndex++;
        }
    
        if (filters.tipo_accion) {
      query += ` AND p.tipo_accion = @param${paramIndex}`;

        params.push({
        value: filters.tipo_accion,
        type: sql.VarChar
      });

        paramIndex++;
        }
    
    query += ' ORDER BY p.fecha_solicitud DESC';

        const result = await executequery(query, params);
    }

    static async findById(id) {
        const query = `
            SELECT p.*,
                e.nombre as emprendimiento_nombre,
                u.nombre as admin_nombre,
                u.apellido as admin_apellido
            FROM PUBLICACIONES p
            LEFT JOIN EMPRENDIMIENTOS e 
            ON p.id_emprendimiento = e.id_emprendimiento
            LEFT JOIN USUARIOS u 
            ON p.id_admin = u.id_usuario
            WHERE p.id_publicacion = @id
        `;

        const params = [
            { value: id, type: sql.Int }
        ];

        const result = await executequery(query, params);
        return result[0];
    }

    static async resolve(id, data) {
        const query = `
            UPDATE PUBLICACIONES
            SET
             estado = @estado,
                id_admin = @id_admin,
                fecha_resolucion = GETDATE(),
                ip_admin = @ip_admin
            WHERE id_publicacion = @id_publicacion;
        `;
        const params = [
            { value: data.estado, type: sql.VarChar },
            { value: data.id_admin, type: sql.Int },
            { value: data.ip_admin, type: sql.NVarChar },
            { value: id, type: sql.Int }
        ];

        await executequery(query, params);

        return await this.findById(id);
    }

    static async delete(id) {

        const query = `
            DELETE FROM PUBLICACIONES
            WHERE id_publicacion = @id
        `;
        const params = [
            { value: id, type: sql.Int }
        ];

        return await executequery(query, params);
    }

      static async count(filters = {}) {

        let query = `
            SELECT COUNT(*) as total
            FROM PUBLICACIONES
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 0;

    if (filters.estado) {
      query += ` AND estado = @param${paramIndex}`;

      params.push({
        value: filters.estado,
        type: sql.VarChar
      });

      paramIndex++;
    }

    if (filters.tipo_accion) {
      query += ` AND tipo_accion = @param${paramIndex}`;

      params.push({
        value: filters.tipo_accion,
        type: sql.VarChar
      });

      paramIndex++;
    }

    const result = await executeQuery(query, params);

    return result[0].total;
  }
}

module.exports = Publicacion;

