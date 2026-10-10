const { executeQuery, sql } = require('../../config/database');

// Solo negocios publicados son visibles para visitantes
const PUBLIC_FILTER = `LOWER(e.estado) IN ('activo', 'aprobado')`;

const BUSINESS_COLUMNS = `
  e.id_emprendimiento, e.nombre, e.descripcion, e.horario, e.whatsapp, e.telefono,
  e.municipio, e.departamento, e.localidad, e.direccion, e.latitud, e.longitud,
  e.logo_url, e.destacado, e.vistas, e.id_usuario, e.estado,
  e.instagram, e.facebook, e.website,
  c.nombre as categoria_nombre,
  (SELECT STRING_AGG(c2.nombre, ', ')
   FROM EmprendimientoCategorias ec JOIN Categorias c2 ON ec.id_categoria = c2.id_categoria
   WHERE ec.id_emprendimiento = e.id_emprendimiento) as categorias_nombres,
  (SELECT CAST(AVG(CAST(puntuacion AS FLOAT)) AS DECIMAL(3,1)) FROM CALIFICACIONES WHERE id_emprendimiento = e.id_emprendimiento) as rating_promedio,
  (SELECT COUNT(*) FROM CALIFICACIONES WHERE id_emprendimiento = e.id_emprendimiento) as total_resenas
`;

const truncate = (text, max) => {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

// Normaliza el número a formato internacional para wa.me (Guatemala = 502)
const normalizeWhatsapp = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.length === 8 ? `502${digits}` : digits;
};

const whatsappLink = (raw, mensaje) => {
  const number = normalizeWhatsapp(raw);
  if (!number) return null;
  return mensaje
    ? `https://wa.me/${number}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${number}`;
};

const mapsLink = (b) => {
  if (b.latitud && b.longitud) return `https://www.google.com/maps?q=${b.latitud},${b.longitud}`;
  const place = [b.direccion, b.municipio, b.departamento].filter(Boolean).join(', ');
  return place ? `https://www.google.com/maps/search/${encodeURIComponent(place)}` : null;
};

// Versión compacta que se le pasa al modelo (menos tokens)
const toModelBusiness = (b) => ({
  id: b.id_emprendimiento,
  nombre: b.nombre,
  categorias: b.categorias_nombres || b.categoria_nombre,
  descripcion: truncate(b.descripcion, 220),
  horario: b.horario || 'No especificado',
  ubicacion: [b.direccion, b.localidad, b.municipio].filter(Boolean).join(', ') || null,
  calificacion: b.rating_promedio ? `${b.rating_promedio}/5 (${b.total_resenas} reseñas)` : 'Sin reseñas',
  tiene_whatsapp: !!b.whatsapp,
  destacado: !!b.destacado
});

// Versión que se manda al frontend para pintar tarjetas
const toCard = (b) => ({
  id: b.id_emprendimiento,
  nombre: b.nombre,
  categoria: b.categorias_nombres || b.categoria_nombre || '',
  logo: b.logo_url,
  horario: b.horario || '',
  ubicacion: [b.municipio, b.departamento].filter(Boolean).join(', ') || b.direccion || '',
  rating: b.rating_promedio ? Number(b.rating_promedio) : null,
  total_resenas: b.total_resenas || 0,
  whatsapp: whatsappLink(b.whatsapp, `Hola ${b.nombre}, los encontré en el directorio PYMES Chiquimula y quisiera más información.`),
  maps: mapsLink(b)
});

const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'con', 'para', 'por',
  'que', 'algo', 'donde', 'dónde', 'busco', 'quiero', 'necesito', 'venda', 'vendan', 'hay', 'me', 'mi', 'a', 'al'
]);

// Convierte "pasteles de chocolate" en ["pastel", "chocolate"]: quita palabras vacías y plurales simples
const searchTerms = (texto) => {
  const words = String(texto || '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    .map(w => (w.endsWith('es') && w.length > 5 ? w.slice(0, -2) : w.endsWith('s') && w.length > 4 ? w.slice(0, -1) : w));
  const unique = [...new Set(words)].slice(0, 4);
  return unique.length ? unique : [String(texto || '').trim()].filter(Boolean);
};

// Comparación sin distinguir mayúsculas ni acentos ("cafe" encuentra "Café")
const AI = 'COLLATE Latin1_General_CI_AI';

const addTermParams = (texto, prefix, params) => searchTerms(texto).map((term, i) => {
  params.push({ name: `${prefix}${i}`, value: `%${term}%`, type: sql.NVarChar });
  return `@${prefix}${i}`;
});

const anyLike = (columns, paramNames) =>
  `(${paramNames.flatMap(p => columns.map(col => `${col} ${AI} LIKE ${p}`)).join(' OR ')})`;

async function searchBusinesses({ texto, categoria, limite = 6 }) {
  const params = [{ name: 'limite', value: Math.min(Number(limite) || 6, 10), type: sql.Int }];
  let where = PUBLIC_FILTER;

  if (texto) {
    const t = addTermParams(texto, 't', params);
    if (t.length) where += `
      AND (${anyLike(['e.nombre', 'e.descripcion', 'c.nombre', 'e.municipio', 'e.localidad', 'e.direccion', 'e.departamento'], t)}
        OR EXISTS (SELECT 1 FROM ProductosServicios p
                   WHERE p.id_emprendimiento = e.id_emprendimiento
                     AND ${anyLike(['p.nombre', 'p.descripcion'], t)})
        OR EXISTS (SELECT 1 FROM EmprendimientoCategorias ec JOIN Categorias c3 ON ec.id_categoria = c3.id_categoria
                   WHERE ec.id_emprendimiento = e.id_emprendimiento AND ${anyLike(['c3.nombre'], t)}))`;
  }

  if (categoria) {
    params.push({ name: 'categoria', value: `%${String(categoria).trim()}%`, type: sql.NVarChar });
    where += `
      AND (c.nombre ${AI} LIKE @categoria
        OR EXISTS (SELECT 1 FROM EmprendimientoCategorias ec JOIN Categorias c4 ON ec.id_categoria = c4.id_categoria
                   WHERE ec.id_emprendimiento = e.id_emprendimiento AND c4.nombre ${AI} LIKE @categoria))`;
  }

  const query = `
    SELECT TOP (@limite) ${BUSINESS_COLUMNS}
    FROM Emprendimientos e
    LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
    WHERE ${where}
    ORDER BY e.destacado DESC,
      ISNULL((SELECT AVG(CAST(puntuacion AS FLOAT)) FROM CALIFICACIONES WHERE id_emprendimiento = e.id_emprendimiento), 0) DESC,
      e.vistas DESC
  `;
  return executeQuery(query, params);
}

async function searchProducts({ texto, precio_max, limite = 10 }) {
  const params = [{ name: 'limite', value: Math.min(Number(limite) || 10, 15), type: sql.Int }];
  const t = addTermParams(texto, 't', params);
  let where = PUBLIC_FILTER;
  if (t.length) where += ` AND ${anyLike(['p.nombre', 'p.descripcion'], t)}`;
  if (precio_max) {
    params.push({ name: 'precio_max', value: Number(precio_max), type: sql.Decimal(10, 2) });
    where += ` AND p.precio <= @precio_max`;
  }

  const query = `
    SELECT TOP (@limite)
      p.id_producto, p.nombre, p.descripcion, p.precio, p.tipo, p.visibilidad_precio, p.disponible,
      e.id_emprendimiento, e.nombre as negocio
    FROM ProductosServicios p
    JOIN Emprendimientos e ON p.id_emprendimiento = e.id_emprendimiento
    WHERE ${where}
    ORDER BY p.disponible DESC, e.destacado DESC
  `;
  const rows = await executeQuery(query, params);
  return rows.map(toModelProduct);
}

const toModelProduct = (p) => ({
  id_negocio: p.id_emprendimiento,
  negocio: p.negocio,
  nombre: p.nombre,
  tipo: p.tipo,
  descripcion: truncate(p.descripcion, 150),
  precio: p.precio != null && (p.visibilidad_precio || 'VISIBLE').toUpperCase() === 'VISIBLE'
    ? `Q${Number(p.precio).toFixed(2)}`
    : 'Consultar precio',
  disponible: p.disponible === undefined ? true : !!p.disponible
});

async function getBusiness(id, { onlyPublic = true } = {}) {
  const query = `
    SELECT ${BUSINESS_COLUMNS}
    FROM Emprendimientos e
    LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
    WHERE e.id_emprendimiento = @id ${onlyPublic ? `AND ${PUBLIC_FILTER}` : ''}
  `;
  const rows = await executeQuery(query, [{ name: 'id', value: Number(id), type: sql.Int }]);
  return rows[0] || null;
}

async function getBusinessesByIds(ids) {
  const clean = [...new Set(ids.map(Number).filter(Number.isInteger))].slice(0, 6);
  if (clean.length === 0) return [];
  const params = clean.map((v, i) => ({ name: `id${i}`, value: v, type: sql.Int }));
  const query = `
    SELECT ${BUSINESS_COLUMNS}
    FROM Emprendimientos e
    LEFT JOIN Categorias c ON e.id_categoria = c.id_categoria
    WHERE ${PUBLIC_FILTER} AND e.id_emprendimiento IN (${params.map(p => `@${p.name}`).join(', ')})
  `;
  const rows = await executeQuery(query, params);
  // Respeta el orden en que el modelo los pidió
  return clean.map(id => rows.find(r => r.id_emprendimiento === id)).filter(Boolean);
}

async function getProducts(idEmprendimiento) {
  const rows = await executeQuery(`
    SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.tipo, p.visibilidad_precio, p.disponible,
      p.id_emprendimiento, NULL as negocio,
      (SELECT COUNT(*) FROM IMAGENES_PRODUCTO WHERE id_producto = p.id_producto) as total_imagenes
    FROM ProductosServicios p
    WHERE p.id_emprendimiento = @id
    ORDER BY p.nombre
  `, [{ name: 'id', value: Number(idEmprendimiento), type: sql.Int }]);
  return rows;
}

async function getReviews(idEmprendimiento, limit = 8) {
  return executeQuery(`
    SELECT TOP (@limit) c.puntuacion, c.comentario, c.fecha_calificacion, u.nombre as autor
    FROM CALIFICACIONES c
    LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_emprendimiento = @id
    ORDER BY c.fecha_calificacion DESC
  `, [
    { name: 'id', value: Number(idEmprendimiento), type: sql.Int },
    { name: 'limit', value: limit, type: sql.Int }
  ]);
}

async function listCategories() {
  const rows = await executeQuery(`
    SELECT c.nombre,
      (SELECT COUNT(DISTINCT e.id_emprendimiento) FROM Emprendimientos e
       LEFT JOIN EmprendimientoCategorias ec ON ec.id_emprendimiento = e.id_emprendimiento
       WHERE (e.id_categoria = c.id_categoria OR ec.id_categoria = c.id_categoria) AND ${PUBLIC_FILTER}) as negocios
    FROM Categorias c
    WHERE c.activo = 1
    ORDER BY c.nombre
  `);
  return rows.filter(r => r.negocios > 0);
}

async function getStatsSummary(idEmprendimiento, days = 30) {
  const rows = await executeQuery(`
    SELECT
      ISNULL(SUM(vistas_dia), 0) as vistas,
      ISNULL(SUM(clicks_whatsapp), 0) as clicks_whatsapp,
      ISNULL(SUM(clicks_maps), 0) as clicks_maps,
      ISNULL(SUM(total_busquedas), 0) as apariciones_en_busquedas,
      COUNT(*) as dias_con_datos
    FROM ESTADISTICAS_DIARIAS
    WHERE id_emprendimiento = @id AND fecha >= DATEADD(day, -@days, CAST(GETDATE() AS DATE))
  `, [
    { name: 'id', value: Number(idEmprendimiento), type: sql.Int },
    { name: 'days', value: days, type: sql.Int }
  ]);
  return rows[0];
}

async function getCategoryAverages(idEmprendimiento) {
  // Compara contra negocios publicados de la misma categoría principal
  const rows = await executeQuery(`
    SELECT
      COUNT(*) as negocios_en_categoria,
      AVG(CAST(e.vistas AS FLOAT)) as vistas_promedio,
      AVG(CAST((SELECT COUNT(*) FROM ProductosServicios p WHERE p.id_emprendimiento = e.id_emprendimiento) AS FLOAT)) as productos_promedio
    FROM Emprendimientos e
    WHERE ${PUBLIC_FILTER}
      AND e.id_categoria = (SELECT id_categoria FROM Emprendimientos WHERE id_emprendimiento = @id)
  `, [{ name: 'id', value: Number(idEmprendimiento), type: sql.Int }]);
  return rows[0];
}

// Registra búsquedas del chatbot en LOG_BUSQUEDAS (las de 0 resultados son demanda no cubierta)
async function logSearch(termino, resultados) {
  if (!termino) return;
  try {
    await executeQuery(`
      INSERT INTO LOG_BUSQUEDAS (termino, id_categoria_filtro, resultados, fecha)
      VALUES (@termino, NULL, @resultados, GETDATE())
    `, [
      { name: 'termino', value: `[chat] ${termino}`.slice(0, 200), type: sql.VarChar },
      { name: 'resultados', value: resultados, type: sql.Int }
    ]);
  } catch (err) {
    // El log nunca debe romper la conversación
  }
}

async function saveSuggestion({ id_emprendimiento, id_usuario, tipo_campo, texto_sugerido }) {
  const rows = await executeQuery(`
    INSERT INTO SUGERENCIAS_IA (id_emprendimiento, id_usuario, tipo_campo, texto_sugerido, aceptado, fecha_generacion)
    VALUES (@id_emprendimiento, @id_usuario, @tipo_campo, @texto_sugerido, 0, GETDATE());
    SELECT SCOPE_IDENTITY() as id_sugerencia;
  `, [
    { name: 'id_emprendimiento', value: id_emprendimiento, type: sql.Int },
    { name: 'id_usuario', value: id_usuario, type: sql.Int },
    { name: 'tipo_campo', value: tipo_campo, type: sql.VarChar },
    { name: 'texto_sugerido', value: texto_sugerido, type: sql.NVarChar }
  ]);
  return rows[0];
}

// Suma un clic de WhatsApp o Maps en las estadísticas del día
async function trackClick(idEmprendimiento, tipo) {
  const column = tipo === 'whatsapp' ? 'clicks_whatsapp' : 'clicks_maps';
  await executeQuery(`
    IF EXISTS (SELECT 1 FROM ESTADISTICAS_DIARIAS WHERE id_emprendimiento = @id AND fecha = CAST(GETDATE() AS DATE))
      UPDATE ESTADISTICAS_DIARIAS SET ${column} = ${column} + 1
      WHERE id_emprendimiento = @id AND fecha = CAST(GETDATE() AS DATE)
    ELSE
      INSERT INTO ESTADISTICAS_DIARIAS (id_emprendimiento, fecha, vistas_dia, clicks_whatsapp, clicks_maps, total_busquedas)
      VALUES (@id, CAST(GETDATE() AS DATE), 0, ${tipo === 'whatsapp' ? 1 : 0}, ${tipo === 'whatsapp' ? 0 : 1}, 0)
  `, [{ name: 'id', value: Number(idEmprendimiento), type: sql.Int }]);
}

module.exports = {
  searchBusinesses,
  searchProducts,
  getBusiness,
  getBusinessesByIds,
  getProducts,
  getReviews,
  listCategories,
  getStatsSummary,
  getCategoryAverages,
  logSearch,
  saveSuggestion,
  trackClick,
  toModelBusiness,
  toModelProduct,
  toCard,
  whatsappLink,
  mapsLink,
  truncate
};
