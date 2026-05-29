const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { auth } = require('../middleware/auth');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/generate-description', auth, async (req, res) => {
  const { nombre, tipo = 'producto', nombre_negocio, categoria } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del producto es requerido' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Servicio de IA no configurado' });
  }

  try {
    const context = [
      nombre_negocio && `Negocio: ${nombre_negocio}`,
      categoria && `Categoría: ${categoria}`,
    ].filter(Boolean).join(' | ');

    const { ubicacion, horario } = req.body

    const isNegocio = tipo === 'negocio'
    const contextParts = [
      context,
      ubicacion && `Ubicación: ${ubicacion}`,
      horario && `Horario: ${horario}`
    ].filter(Boolean).join(' | ')

    const prompt = isNegocio
      ? `Eres un copywriter creativo especializado en negocios guatemaltecos. Escribe una descripción atractiva para este negocio:

Negocio: ${nombre}
${contextParts}

Reglas:
- 2 a 3 oraciones con calidez y personalidad
- Usa 1 emoji relevante integrado naturalmente en el texto
- Lenguaje cercano, en español guatemalteco amigable
- Destaca qué ofrece y para quién es ideal
- Evita frases vacías como "calidad garantizada" o "el mejor"
- NO uses guiones largos (—) ni em dash bajo ningún concepto
- Entre 120 y 250 caracteres

Responde ÚNICAMENTE con la descripción lista para usar, sin comillas ni explicaciones.`
      : `Eres un copywriter creativo especializado en negocios guatemaltecos. Escribe una descripción vibrante y llamativa para este ${tipo}:

${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${nombre}
${contextParts}

Reglas:
- 1 a 2 oraciones con personalidad y energía
- Usa 1 o 2 emojis relevantes que queden naturales en el texto (no al final como lista)
- Lenguaje cálido, cercano, en español guatemalteco amigable
- Menciona algo concreto que lo haga especial o apetecible
- Evita frases vacías como "calidad garantizada" o "el mejor"
- NO uses guiones largos (—) ni em dash bajo ningún concepto
- Entre 80 y 150 caracteres en total

Responde ÚNICAMENTE con la descripción lista para usar, sin comillas ni explicaciones.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });

    const descripcion = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    res.json({ success: true, descripcion });
  } catch (error) {
    console.error('AI generation error:', error.message);
    res.status(500).json({ error: 'Error al generar la descripción' });
  }
});

module.exports = router;
