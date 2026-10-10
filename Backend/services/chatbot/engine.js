const OpenAI = require('openai');
const modes = require('./modes');
const logger = require('../../utils/logger');

let client;
const getClient = () => (client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

const MODEL = process.env.CHATBOT_MODEL || 'gpt-4o-mini';
const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 1000;

// Quita enlaces, URLs y números de teléfono que el modelo pudiera escribir: los datos de contacto
// solo se muestran en los botones, que el servidor arma con lo registrado en la base de datos
const cleanReply = (text) => text
  .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]*\)/gi, '$1')
  .replace(/\(?(?:https?:\/\/|www\.)[^\s)]+\)?/gi, '')
  .replace(/\(?n[uú]mero ficticio\)?/gi, '')
  .replace(/(?:\+?502[\s-]?)?\b\d{4}[\s-]?\d{4}\b/g, '')
  .replace(/[ \t]+([.,;:!?])/g, '$1')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/^[ \t]*[-•*][ \t]*$/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

// Solo aceptamos turnos user/assistant de texto desde el cliente
const sanitizeHistory = (messages) => (Array.isArray(messages) ? messages : [])
  .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
  .slice(-MAX_HISTORY)
  .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

async function runChat({ mode: modeName, messages, idEmprendimiento, user }) {
  const mode = modes[modeName];
  if (!mode) {
    const err = new Error('Modo de chat inválido');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const history = sanitizeHistory(messages);
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    const err = new Error('El último mensaje debe ser del usuario');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const ctx = await mode.buildContext({ idEmprendimiento, user });
  const state = { cards: [], actions: [], savedSuggestions: 0, seen: new Map() };

  const convo = [{ role: 'system', content: mode.systemPrompt(ctx) }, ...history];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const isLastRound = round === MAX_TOOL_ROUNDS;
    const response = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: modeName === 'coach' ? 900 : 500,
      temperature: 0.5,
      messages: convo,
      ...(mode.tools.length && !isLastRound ? { tools: mode.tools, tool_choice: 'auto' } : {})
    });

    const msg = response.choices[0].message;
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const reply = cleanReply(msg.content || '');
      if (mode.finalize) await mode.finalize(reply, state, ctx);
      return { reply, cards: state.cards, actions: state.actions };
    }

    convo.push(msg);
    for (const call of msg.tool_calls) {
      const handler = mode.handlers[call.function.name];
      let result;
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        result = handler ? await handler(args, state, ctx) : { error: 'Herramienta desconocida' };
      } catch (err) {
        logger.error(`Chatbot tool ${call.function.name} failed:`, err.message);
        result = { error: 'No se pudo completar la consulta' };
      }
      convo.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return { reply: 'Perdón, no pude completar la respuesta. ¿Puedes intentarlo de otra forma?', cards: state.cards, actions: state.actions };
}

module.exports = { runChat };
