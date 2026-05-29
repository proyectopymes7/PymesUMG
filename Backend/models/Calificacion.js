const {executeQuery, sql} = require('../config/database');

class Calificacion {
    static async create(calificacionData) {
        const query = `
            INSERT INTO CALIFICACIONES (id_usuario, id_emprendimiento, puntuacion, comentario, fecha_calificacion)
            VALUES (@id_usuario, @id_emprendimiento, @puntuacion, @comentario, GETDATE());
            SELECT SCOPE_IDENTITY() as id_calificacion;
        `;
        const params = [
            { name: 'id_usuario',        value: calificacionData.id_usuario,        type: sql.Int },
            { name: 'id_emprendimiento', value: calificacionData.id_emprendimiento, type: sql.Int },
            { name: 'puntuacion',        value: calificacionData.puntuacion,        type: sql.Int },
            { name: 'comentario',        value: calificacionData.comentario || null, type: sql.NVarChar },
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    static async findByEmprendimiento(id_emprendimiento) {
        const query = `
            SELECT c.*,
                u.nombre as usuario_nombre, u.apellido as usuario_apellido, u.foto_perfil as usuario_foto
            FROM CALIFICACIONES c
            LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
            WHERE c.id_emprendimiento = @id_emprendimiento
            ORDER BY c.fecha_calificacion DESC
        `;

        const params = [{ name: 'id_emprendimiento', value: id_emprendimiento, type: sql.Int }];
        const result = await executeQuery(query, params);
        return result;
    }

    static async delete(id){
        const query = `
        DELETE FROM CALIFICACIONES
        WHERE id_calificacion = @id_calificacion
        `;
        const params = [{ name: 'id_calificacion', value: id, type: sql.Int }];
        await executeQuery(query, params);
    }

    static async findUserRating(id_usuario, id_emprendimiento) {
     const query = `
        SELECT *
        FROM CALIFICACIONES
        WHERE id_usuario = @id_usuario AND id_emprendimiento = @id_emprendimiento
     `;

     const params = [
        { name: 'id_usuario',        value: id_usuario,        type: sql.Int },
        { name: 'id_emprendimiento', value: id_emprendimiento, type: sql.Int }
     ];
     const result = await executeQuery(query, params);
     return result[0];
    }
}

module.exports = Calificacion;