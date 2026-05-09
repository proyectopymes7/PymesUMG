require('dotenv').config();
const { connectDB, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Leer los datos del mockData.js
// Como es un archivo .js con exports, lo leeremos como texto y limpiaremos un poco o usaremos require si es posible
// Pero require en un archivo que usa 'export' fallará en Node común sin ESM.
// Lo leeremos como texto y extraeremos la parte de 'businesses'.

async function uploadData() {
    console.log('--- Iniciando carga de Mock Data a la DB ---');
    
    try {
        const pool = await connectDB();
        console.log('✅ Conectado a la base de datos.');

        // Datos del Mock (extraídos del archivo)
        const mockFilePath = path.join(__dirname, '../../Frontend/src/data/mockData.js');
        const content = fs.readFileSync(mockFilePath, 'utf8');
        
        // Una forma rápida de obtener el array businesses sin lidiar con ESM/CJS
        // Buscamos donde empieza el array y donde termina (aproximado)
        const businessesMatch = content.match(/const businesses = (\[[\s\S]*?\])\s+const users/);
        if (!businessesMatch) {
            throw new Error('No se pudo extraer el array de businesses del archivo.');
        }
        
        // Limpiar el string para que sea JSON válido (reemplazar comillas simples por dobles, quitar comas finales, etc.)
        // O mejor, usar un evaluador simple (PELIGRO: Solo porque confiamos en el contenido)
        let businesses;
        eval('const businessesData = ' + businessesMatch[1] + '; businesses = businessesData;');

        console.log(`📦 Encontrados ${businesses.length} emprendimientos en el mock.`);

        // 1. Asegurar categorías básicas
        const categoryMap = {
            'Restaurantes': 12,
            'Salud': 6,
            'Servicios': 3,
            'Tecnología': 5,
            'Comercio': 2,
            'Belleza': 13 // Crearemos esta
        };

        // Crear categoría Belleza si no existe
        await pool.request().query("IF NOT EXISTS (SELECT 1 FROM Categorias WHERE nombre = 'Belleza') INSERT INTO Categorias (nombre, descripcion, activo) VALUES ('Belleza', 'Estética, salones y cuidado personal', 1)");
        const beautyRes = await pool.request().query("SELECT id_categoria FROM Categorias WHERE nombre = 'Belleza'");
        categoryMap['Belleza'] = beautyRes.recordset[0].id_categoria;

        // 2. Crear un usuario por defecto para los que no tengan uno válido en la DB
        const defaultUserId = 1; // Suponiendo que el admin es ID 1

        for (const biz of businesses) {
            console.log(`\n🔹 Procesando: ${biz.name}`);
            
            // Mapear estado
            const dbEstado = biz.estado === 'activo' ? 'APROBADO' : 'PENDIENTE';
            const catId = categoryMap[biz.category] || 3; // Default a servicios

            // Insertar Emprendimiento
            const bizQuery = `
                INSERT INTO Emprendimientos (
                    id_usuario, id_categoria, nombre, descripcion, direccion, 
                    logo_url, whatsapp, sitio_web, estado, destacado, vistas, fecha_registro, activo
                )
                OUTPUT INSERTED.id_emprendimiento
                VALUES (
                    @id_usuario, @id_categoria, @nombre, @descripcion, @direccion,
                    @logo_url, @whatsapp, @sitio_web, @estado, @destacado, @vistas, GETDATE(), 1
                )
            `;

            const bizParams = pool.request()
                .input('id_usuario', sql.Int, (biz.id_usuario && biz.id_usuario <= 8) ? biz.id_usuario : defaultUserId)
                .input('id_categoria', sql.Int, catId)
                .input('nombre', sql.VarChar, biz.name)
                .input('descripcion', sql.NVarChar, biz.description)
                .input('direccion', sql.VarChar, biz.location)
                .input('logo_url', sql.VarChar, biz.logo)
                .input('whatsapp', sql.VarChar, biz.socials.whatsapp.replace('https://wa.me/', ''))
                .input('sitio_web', sql.VarChar, biz.socials.website || null)
                .input('estado', sql.VarChar, dbEstado)
                .input('destacado', sql.Bit, biz.destacado ? 1 : 0)
                .input('vistas', sql.Int, biz.reviewCount * 10); // Simular vistas

            const bizResult = await bizParams.query(bizQuery);
            const newBizId = bizResult.recordset[0].id_emprendimiento;
            console.log(`   ✅ Emprendimiento creado con ID: ${newBizId}`);

            // Insertar Imagen de portada en ImagenesEmprendimiento
            if (biz.image) {
                await pool.request()
                    .input('id_emprendimiento', sql.Int, newBizId)
                    .input('url', sql.VarChar, biz.image)
                    .input('orden', sql.Int, 1)
                    .query("INSERT INTO ImagenesEmprendimiento (id_emprendimiento, url, orden) VALUES (@id_emprendimiento, @url, @orden)");
            }

            // Insertar Productos
            if (biz.products && biz.products.length > 0) {
                for (const prod of biz.products) {
                    const price = parseFloat(prod.price.replace('Q ', '').replace(',', ''));
                    await pool.request()
                        .input('id_emprendimiento', sql.Int, newBizId)
                        .input('nombre', sql.VarChar, prod.name)
                        .input('precio', sql.Decimal(10, 2), price)
                        .input('imagen_url', sql.VarChar, prod.image)
                        .input('disponible', sql.Bit, 1)
                        .input('tipo', sql.VarChar, 'producto')
                        .query("INSERT INTO ProductosServicios (id_emprendimiento, nombre, precio, imagen_url, disponible, tipo) VALUES (@id_emprendimiento, @nombre, @precio, @imagen_url, @disponible, @tipo)");
                }
                console.log(`   ✅ ${biz.products.length} productos insertados.`);
            }

            // Insertar Valoraciones/Reviews
            if (biz.reviews && biz.reviews.length > 0) {
                let reviewUserIdx = 0;
                const availableReviewers = [1, 2, 3, 4, 5]; // IDs que sabemos que existen

                for (const rev of biz.reviews) {
                    const reviewerId = availableReviewers[reviewUserIdx % availableReviewers.length];
                    reviewUserIdx++;
                    
                    await pool.request()
                        .input('id_emprendimiento', sql.Int, newBizId)
                        .input('id_usuario', sql.Int, reviewerId)
                        .input('nombre_display', sql.VarChar, rev.user)
                        .input('comentario', sql.NVarChar, rev.comment)
                        .input('fecha', sql.DateTime2, new Date())
                        .input('aprobado', sql.Bit, 1)
                        .query("INSERT INTO Valoraciones (id_emprendimiento, id_usuario, nombre_display, comentario, fecha, aprobado) VALUES (@id_emprendimiento, @id_usuario, @nombre_display, @comentario, @fecha, @aprobado)");
                    
                    // También agregar a Calificaciones
                    await pool.request()
                        .input('id_emprendimiento', sql.Int, newBizId)
                        .input('id_usuario', sql.Int, reviewerId)
                        .input('puntuacion', sql.TinyInt, rev.rating)
                        .input('fecha', sql.DateTime2, new Date())
                        .query("INSERT INTO Calificaciones (id_emprendimiento, id_usuario, puntuacion, fecha) VALUES (@id_emprendimiento, @id_usuario, @puntuacion, @fecha)");
                }
                console.log(`   ✅ ${biz.reviews.length} valoraciones y calificaciones insertadas.`);
            }
        }

        console.log('\n✨ ¡Proceso completado exitosamente!');
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la carga:', err);
        process.exit(1);
    }
}

uploadData();
