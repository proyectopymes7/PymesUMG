class HistorialCambiosModel {
    static async obtenerHistorial(filtros = {}) {
        const {
            id_emprendimiento,
            id_usuario,
            campo_modificado,
            pagina = 1,
            limite = 10
        } = filtros;

        const offset = (pagina - 1) * limite;

        let whereConditions = [];
        let params = [];

        if (id_emprendimiento) {
            whereConditions.push('hc.id_emprendimiento = @id_emprendimiento');
            params.push({
                name: 'id_emprendimiento',
                value: id_emprendimiento,
                type: sql.Int
            });
        }

        if (id_usuario) {
            whereConditions.push('hc.id_usuario = @id_usuario');
            params.push({
                name: 'id_usuario',
                value: id_usuario,
                type: sql.Int
            });
        }

        if (campo_modificado) {
            whereConditions.push('hc.campo_modificado LIKE @campo_modificado');
            params.push({
                name: 'campo_modificado',
                value: `%${campo_modificado}%`,
                type: sql.VarChar
            });
        }
        const whereClause = whereConditions.length
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const query = `
            SELECT
                hc.id_historial,
                hc.id_emprendimiento,
                hc.id_usuario,
                hc.campo_modificado,
                hc.valor_anterior,
                hc.valor_nuevo,
                hc.fecha_cambio,
                hc.ip_origen,
                u.nombre AS usuario_nombre,
                e.nombre_emprendimiento
            FROM HISTORIAL_CAMBIOS hc
            INNER JOIN USUARIOS u
                ON hc.id_usuario = u.id_usuario
            INNER JOIN EMPRENDIMIENTOS e
                ON hc.id_emprendimiento = e.id_emprendimiento
            ${whereClause}
            ORDER BY hc.fecha_cambio DESC
            OFFSET @offset ROWS
            FETCH NEXT @limite ROWS ONLY;
        `;

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM HISTORIAL_CAMBIOS hc
            ${whereClause}
        `;

        const queryParams = [
            ...params,
            {
                name: 'offset',
                value: offset,
                type: sql.Int
            },
            {
                name: 'limite',
                value: limite,
                type: sql.Int
            }
        ];

        const historial = await executeQuery(query, queryParams);
        const totalResult = await executeQuery(countQuery, params);

        return {
            registros: historial,
            total: totalResult[0].total,
            pagina,
            limite
        };
    }

    static async obtenerHistorialPorId(id_historial) {
        const query = `
            SELECT
                hc.id_historial,
                hc.id_emprendimiento,
                hc.id_usuario,
                hc.campo_modificado,
                hc.valor_anterior,
                hc.valor_nuevo,
                hc.fecha_cambio,
                hc.ip_origen,
                u.nombre AS usuario_nombre,
                e.nombre_emprendimiento
            FROM HISTORIAL_CAMBIOS hc
            INNER JOIN USUARIOS u
                ON hc.id_usuario = u.id_usuario
            INNER JOIN EMPRENDIMIENTOS e
                ON hc.id_emprendimiento = e.id_emprendimiento
            WHERE hc.id_historial = @id_historial
        `;

        const params = [
            {
                name: 'id_historial',
                value: id_historial,
                type: sql.Int
            }
        ];

        const result = await executeQuery(query, params);

        return result[0];
    }

    static async crearHistorial(data) {
        const query = `
            INSERT INTO HISTORIAL_CAMBIOS (
                id_emprendimiento,
                id_usuario,
                campo_modificado,
                valor_anterior,
                valor_nuevo,
                fecha_cambio,
                ip_origen
            )
            VALUES (
                @id_emprendimiento,
                @id_usuario,
                @campo_modificado,
                @valor_anterior,
                @valor_nuevo,
                GETDATE(),
                @ip_origen
            );

            SELECT SCOPE_IDENTITY() AS id_historial;
        `;

        const params = [
            {
                name: 'id_emprendimiento',
                value: data.id_emprendimiento,
                type: sql.Int
            },
            {
                name: 'id_usuario',
                value: data.id_usuario,
                type: sql.Int
            },
            {
                name: 'campo_modificado',
                value: data.campo_modificado,
                type: sql.VarChar
            },
            {
                name: 'valor_anterior',
                value: data.valor_anterior,
                type: sql.NVarChar
            },
            {
                name: 'valor_nuevo',
                value: data.valor_nuevo,
                type: sql.NVarChar
            },
            {
                name: 'ip_origen',
                value: data.ip_origen,
                type: sql.VarChar
            }
        ];

        const result = await executeQuery(query, params);

        return result[0];
    }

    static async eliminarHistorial(id_historial) {
        const query = `
            DELETE FROM HISTORIAL_CAMBIOS
            WHERE id_historial = @id_historial
        `;

        const params = [
            {
                name: 'id_historial',
                value: id_historial,
                type: sql.Int
            }
        ];

        return await executeQuery(query, params);
    }
}

module.exports = HistorialCambiosModel;