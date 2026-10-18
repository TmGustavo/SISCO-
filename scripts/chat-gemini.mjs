// Prueba Gemini real por terminal. Memoria local mientras dure esta ejecución.
// node --env-file=.env.gemini.local scripts/chat-gemini.mjs
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { analizarMensaje } from '../supabase/functions/_shared/kaluz-agent.mjs';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('Falta GEMINI_API_KEY en .env.gemini.local'); process.exit(1); }
const rl = createInterface({ input, output });
let historial = [];
let estadoPrevio = null;
console.log("\nKALUZ IA V2 — 'nuevo' reinicia la conversación; 'salir' termina.");
console.log('Solo datos ficticios. No pegues DNI, teléfonos ni documentos reales.\n');
try {
  while (true) {
    const mensaje = (await rl.question('TÚ: ')).trim();
    const comando = mensaje.toLowerCase();
    if (['salir','exit','quit'].includes(comando)) break;
    if (comando === 'nuevo') {
      historial = [];
      estadoPrevio = null;
      console.log('\nKALUZ: Iniciamos una conversación nueva.\n');
      continue;
    }
    if (!mensaje) continue;
    try {
      const resultado = await analizarMensaje({ mensaje, historial, estadoPrevio, apiKey });
      estadoPrevio = resultado; // MEMORIA: incluye los datos estructurados de todos los turnos.
      historial.push({ rol: 'usuario', texto: mensaje }, { rol: 'agente', texto: resultado.respuesta_usuario });
      historial = historial.slice(-12);
      console.log('\nKALUZ:', resultado.respuesta_usuario);
      console.log('JSON:', JSON.stringify(resultado, null, 2), '\n');
    } catch (e) {
      console.error('Error:', e?.message || String(e), '\n');
    }
  }
} finally { rl.close(); }
