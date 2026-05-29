const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { auth } = require('../middleware/auth');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PEXELS_KEY = process.env.PEXELS_API_KEY;

// Genera keywords con OpenAI y busca fotos en Pexels
router.post('/suggest-images', auth, async (req, res) => {
  const { nombre, categoria, descripcion, municipio, departamento } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });

  if (!PEXELS_KEY) return res.status(503).json({ error: 'Servicio de imágenes no configurado' });

  try {
    // 1. OpenAI genera keywords de búsqueda en inglés
    const prompt = `Generate 3 short English search keywords (2-3 words each) for finding beautiful stock photos for this Guatemalan business:
Name: ${nombre}
Category: ${categoria || ''}
Description: ${descripcion || ''}
Location: ${municipio || ''}, ${departamento || ''}

Rules:
- Keywords should describe the type of business visually
- Use general terms that return beautiful photos
- No brand names
- Return ONLY a JSON array of 3 strings, nothing else. Example: ["cozy coffee shop", "artisan bakery", "local market"]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 60,
      messages: [{ role: 'user', content: prompt }]
    });

    let keywords = [];
    try {
      keywords = JSON.parse(completion.choices[0].message.content.trim());
    } catch {
      keywords = ['local business guatemala', categoria || 'small business', nombre.split(' ')[0]];
    }

    // 2. Buscar fotos en Pexels para cada keyword
    const results = await Promise.all(keywords.map(async (kw, idx) => {
      try {
        const r = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(kw)}&per_page=2&page=1&orientation=landscape`,
          { headers: { Authorization: PEXELS_KEY } }
        );
        const data = await r.json();
        return (data.photos || []).map(p => ({
          id: p.id,
          thumbnail: p.src.medium,
          original: p.src.large,
          keyword: kw,
          photographer: p.photographer
        }));
      } catch { return []; }
    }));

    const photos = results.flat().slice(0, 6);
    res.json({ success: true, keywords, photos });
  } catch (err) {
    console.error('Image suggestion error:', err.message);
    res.status(500).json({ error: 'Error al sugerir imágenes' });
  }
});

module.exports = router;
