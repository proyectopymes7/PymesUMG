const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { executeQuery, connectDB, sql } = require('../config/database');
const upload = require('../middleware/upload');
const { subirImagen, eliminarImagen } = require('../config/storage');

// ─── GET: imágenes públicas ───────────────────────────────────────────────────

router.get('/emprendimiento/:id_emprendimiento', optionalAuth, async (req, res) => {
  try {
    const imagenes = await executeQuery(
      `SELECT * FROM IMAGENES_EMPRENDIMIENTO WHERE id_emprendimiento = @id ORDER BY orden ASC`,
      [{ name: 'id', value: req.params.id_emprendimiento, type: sql.Int }]
    );
    res.json({ success: true, data: imagenes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get imagenes', message: 'Internal server error' });
  }
});

router.get('/producto/:id_producto', optionalAuth, async (req, res) => {
  try {
    const imagenes = await executeQuery(
      `SELECT * FROM IMAGENES_PRODUCTO WHERE id_producto = @id ORDER BY orden ASC`,
      [{ name: 'id', value: req.params.id_producto, type: sql.Int }]
    );
    res.json({ success: true, data: imagenes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get imagenes', message: 'Internal server error' });
  }
});

// ─── POST: subir imagen genérica y devolver solo la URL ──────────────────────
// Body: multipart, campo "imagen". Query/body campo "tipo": logos | imagenes | perfiles

router.post('/upload', auth, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const tipo = req.body.tipo || 'imagenes';
    const containers = {
      logos:    process.env.AZURE_STORAGE_CONTAINER_LOGOS,
      imagenes: process.env.AZURE_STORAGE_CONTAINER_IMAGENES,
      perfiles: process.env.AZURE_STORAGE_CONTAINER_PERFILES || process.env.AZURE_STORAGE_CONTAINER_LOGOS
    };
    const container = containers[tipo] || process.env.AZURE_STORAGE_CONTAINER_IMAGENES;

    const url = await subirImagen(req.file.buffer, req.file.originalname, container);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: subir logo del emprendimiento ──────────────────────────────────────

router.post('/logo/:id_emprendimiento', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const url = await subirImagen(
      req.file.buffer,
      req.file.originalname,
      process.env.AZURE_STORAGE_CONTAINER_LOGOS
    );

    const pool = await connectDB();
    await pool.request()
      .input('id', sql.Int, req.params.id_emprendimiento)
      .input('url', sql.VarChar(500), url)
      .query(`UPDATE Emprendimientos SET logo_url = @url, fecha_actualizacion = GETDATE() WHERE id_emprendimiento = @id`);

    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: subir imagen a galería del emprendimiento ─────────────────────────

router.post('/galeria/:id_emprendimiento', auth, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const url = await subirImagen(
      req.file.buffer,
      req.file.originalname,
      process.env.AZURE_STORAGE_CONTAINER_IMAGENES
    );

    const pool = await connectDB();
    const result = await pool.request()
      .input('id_emprendimiento', sql.Int, req.params.id_emprendimiento)
      .input('url', sql.VarChar(500), url)
      .input('descripcion', sql.VarChar(200), req.body.descripcion || null)
      .input('orden', sql.Int, parseInt(req.body.orden) || 0)
      .query(`
        INSERT INTO IMAGENES_EMPRENDIMIENTO (id_emprendimiento, url, descripcion, orden)
        VALUES (@id_emprendimiento, @url, @descripcion, @orden);
        SELECT SCOPE_IDENTITY() AS id_imagen;
      `);

    res.json({ success: true, id_imagen: result.recordset[0].id_imagen, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: guardar URL de imagen de producto (desde sugerencias IA) ──────────

router.post('/producto/:id_producto/url', auth, async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'URL requerida' })

    const pool = await connectDB()
    const result = await pool.request()
      .input('id_producto', sql.Int, req.params.id_producto)
      .input('url', sql.VarChar(500), url)
      .input('orden', sql.Int, 0)
      .query(`
        INSERT INTO IMAGENES_PRODUCTO (id_producto, url, orden)
        VALUES (@id_producto, @url, @orden);
        SELECT SCOPE_IDENTITY() AS id_imagen_producto;
      `)

    res.json({ success: true, id_imagen_producto: result.recordset[0].id_imagen_producto, url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST: subir imagen de producto ──────────────────────────────────────────

router.post('/producto/:id_producto', auth, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const url = await subirImagen(
      req.file.buffer,
      req.file.originalname,
      process.env.AZURE_STORAGE_CONTAINER_IMAGENES
    );

    const pool = await connectDB();
    const result = await pool.request()
      .input('id_producto', sql.Int, req.params.id_producto)
      .input('url', sql.VarChar(500), url)
      .input('descripcion', sql.VarChar(200), req.body.descripcion || null)
      .input('orden', sql.Int, parseInt(req.body.orden) || 0)
      .query(`
        INSERT INTO IMAGENES_PRODUCTO (id_producto, url, descripcion, orden)
        VALUES (@id_producto, @url, @descripcion, @orden);
        SELECT SCOPE_IDENTITY() AS id_imagen_producto;
      `);

    res.json({ success: true, id_imagen_producto: result.recordset[0].id_imagen_producto, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE: eliminar imagen de galería ──────────────────────────────────────

router.delete('/galeria/:id_imagen', auth, async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id_imagen)
      .query(`SELECT url FROM IMAGENES_EMPRENDIMIENTO WHERE id_imagen = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    await eliminarImagen(result.recordset[0].url, process.env.AZURE_STORAGE_CONTAINER_IMAGENES);

    await pool.request()
      .input('id', sql.Int, req.params.id_imagen)
      .query(`DELETE FROM IMAGENES_EMPRENDIMIENTO WHERE id_imagen = @id`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE: eliminar imagen de producto ─────────────────────────────────────

router.delete('/producto/:id_imagen', auth, async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id_imagen)
      .query(`SELECT url FROM IMAGENES_PRODUCTO WHERE id_imagen_producto = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    await eliminarImagen(result.recordset[0].url, process.env.AZURE_STORAGE_CONTAINER_IMAGENES);

    await pool.request()
      .input('id', sql.Int, req.params.id_imagen)
      .query(`DELETE FROM IMAGENES_PRODUCTO WHERE id_imagen_producto = @id`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


module.exports = router;
