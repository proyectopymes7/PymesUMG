const {executeQuery, sql }= require('../config/database');

class LogBusqueda{

    static async create(logData){
        const query = `
            INSERT INTO LOG_BUSQUEDAS
            (termino, id_categoria_filtro, resultados, fecha)
            VALUES (@termino, @id_categoria_filtro, @resultados, @fecha);
            SELECT SCOPE_IDENTITY() as id_busqueda;
        `;

    const params = [
        { value: logData.termino, type: sql.VarChar },
        { value: logData.id_categoria_filtro || null, type: sql.Int },
        { value: logData.resultados || 0, type: sql.Int },
        { value: logData.fecha, type: sql.DateTime2 }
    ];

    try{
        const result = await executeQuery(query, params);
        return result[0];
    }catch (error) {
        throw error;
    }
    
    }

}

module.exports = LogBusqueda;