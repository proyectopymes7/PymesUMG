const { sql, executeQuery } = require("../config/database");

class EstadisticaDiaria {
    static async create(estadisticaData) {
        const query = `
            INSERT INTO ESTADISTICAS_DIARIAS 
            (id_emprendimiento, fecha, vistas_dia, clicks_whatsapp, clicks_maps, total_busquedas)
            VALUES (@id_emprendimiento, @fecha, @vistas_dia, @clicks_whatsapp, @clicks_maps, @total_busquedas);
            SELECT SCOPE_IDENTITY() as id_estadistica
        `;

        const params = [
            { value: estadisticaData.id_emprendimiento, type: sql.Int},
            { value: estadisticaData.fecha, type: sql.Date },
            { value: estadisticaData.vistas_dia || 0, type: sql.Int },
            { value: estadisticaData.clicks_whatsapp || 0, type: sql.Int },
            { value: estadisticaData.clicks_maps || 0, type: sql.Int },
            { value: estadisticaData.total_busquedas || 0, type: sql.Int }
        ];

        try{
            const result = await executeQuery(query, params);
            return result[0];
        } catch (error){
            throw error;
        }
    }

    static async findByEmprendimientoAndDate(id_emprendimiento, fecha) {
        const query = `
            SELECT * FROM ESTADISTICAS_DIARIAS 
            WHERE id_emprendimiento = @id_emprendimiento AND fecha = @fecha
        `;
    
        const params = [
            { value: id_emprendimiento, type: sql.Int },
            { value: fecha, type: sql.Date }
        ];

        try {
            const result = await executeQuery(query, params);
            return result[0];
        } catch (error) {
            throw error;
        }    
    }

    static async incrementStats(id_emprendimiento, fecha, stats){
        const query = `
                UPDATE ESTADISTICAS_DIARIAS
                SET 
                    vistas_dia = vistas_dia + @vistas_dia,
                    clicks_whatsapp = clicks_whatsapp + @clicks_whatsapp,
                    clicks_maps = clicks_maps + @clicks_maps,
                    total_busquedas = total_busquedas + @total_busquedas
                WHERE id_emprendimiento = @id_emprendimiento AND fecha = @fecha;
        `;

        const params = [
            { value: stats.vistas_dia || 0, type: sql.Int },
            { value: stats.clicks_whatsapp || 0, type: sql.Int },
            { value: stats.clicks_maps || 0, type: sql.Int },
            { value: stats.total_busquedas || 0, type: sql.Int },
            { value: id_emprendimiento, type: sql.Int },
            { value: fecha, type: sql.Date }
        ];

        try {
            await executeQuery(query, params);
            return await this.findByEmprendimientoAndDate(id_emprendimiento, fecha);
        } catch(error) {
            throw error;
        }

    }

}

module.exports = EstadisticaDiaria;
