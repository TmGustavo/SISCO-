// API de desarrollo exclusivamente LOCAL, no apta para desplegar públicamente.
// Se comunica con el Gemini V2 ya existente sin exponer GEMINI_API_KEY al navegador.
import { createServer } from 'node:http'
import { analizarMensaje } from '../supabase/functions/_shared/kaluz-agent.mjs'

const clave = process.env.GEMINI_API_KEY
const puerto = 8789
const host = '127.0.0.1'
if (!clave) { console.error('Falta GEMINI_API_KEY: ejecuta con --env-file=.env.gemini.local'); process.exit(1) }

function json(res, codigo, objeto, origin = '') {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  })
  res.end(JSON.stringify(objeto))
}
const servidor = createServer(async (req, res) => {
  const origin = String(req.headers.origin || '')
  const permitido = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ? origin : ''
  if (origin && !permitido) return json(res, 403, { error: 'Origen no autorizado' })
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...(permitido ? { 'Access-Control-Allow-Origin': permitido, Vary: 'Origin' } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }
  if (req.method === 'GET' && req.url === '/api/salud') return json(res, 200, { ok: true, servicio: 'Kaluz WA DEMO' }, permitido)
  if (req.method !== 'POST' || req.url !== '/api/ia') return json(res, 404, { error: 'Ruta inexistente' }, permitido)
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'Se requiere JSON' }, permitido)
  let payload
  try {
    const trozos = []
    let tamano = 0
    for await (const t of req) {
      tamano += t.length
      if (tamano > 32000) return json(res, 413, { error: 'Solicitud demasiado grande' }, permitido)
      trozos.push(t)
    }
    payload = JSON.parse(Buffer.concat(trozos).toString('utf8'))
  } catch { return json(res, 400, { error: 'JSON inválido' }, permitido) }
  if (typeof payload?.mensaje !== 'string' || !payload.mensaje.trim() || payload.mensaje.length > 1500) return json(res, 400, { error: 'Mensaje inválido (1-1500 caracteres)' }, permitido)
  const historial = Array.isArray(payload.historial) ? payload.historial.slice(-12).map(m => ({
    rol: m?.rol === 'asistente' ? 'asistente' : 'usuario',
    texto: typeof m?.texto === 'string' ? m.texto.slice(0, 1500) : '',
  })) : []
  const anterior = payload.estadoPrevio && typeof payload.estadoPrevio === 'object' && !Array.isArray(payload.estadoPrevio)
    ? payload.estadoPrevio : null
  try {
    const resultado = await analizarMensaje({ mensaje: payload.mensaje, historial, estadoPrevio: anterior, apiKey: clave })
    return json(res, 200, resultado, permitido)
  } catch (e) {
    // No registrar mensajes ni claves en el log.
    console.error('Gemini DEMO:', (e instanceof Error ? e.message : String(e)).replace(/AIza[\w-]+/g, '[CLAVE OCULTA]'))
    return json(res, 502, { error: 'Gemini no respondió. Revisa la terminal del servidor y la cuota/modelo.' }, permitido)
  }
})
servidor.listen(puerto, host, () => {
  console.log(`SIMULADOR API: http://${host}:${puerto}/api/salud`)
  console.log('No cierres esta terminal. Clave de Gemini protegida en Node.')
})
