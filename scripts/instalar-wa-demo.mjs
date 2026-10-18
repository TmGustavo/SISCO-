// Inyecta SOLO dos líneas en el router existente, de forma idempotente.
import { readFileSync, writeFileSync } from 'node:fs'
const archivo = 'src/app/routes/index.tsx'
const original = readFileSync(archivo, 'utf8')
const importacion = "import { WhatsAppDemoPage } from '../../features/ai/WhatsAppDemoPage'"
const ruta = "  { path: 'demo-whatsapp', element: <WhatsAppDemoPage /> },"
if (!original.includes('const routes = [')) throw new Error('No encontré const routes = [; no modifiqué el proyecto.')
if (!original.includes("{ path: '*'")) throw new Error('No encontré la ruta comodín; no modifiqué el proyecto.')
const salto = original.includes('\r\n') ? '\r\n' : '\n'
let nuevo = original
if (!nuevo.includes(importacion)) nuevo = nuevo.replace('const routes = [', `${importacion}${salto}${salto}const routes = [`)
if (!nuevo.includes("path: 'demo-whatsapp'")) nuevo = nuevo.replace(/^([ \t]*)\{ path: '\*'/m, `${ruta}${salto}$1{ path: '*'`)
if (nuevo !== original) {
  writeFileSync(archivo, nuevo, 'utf8')
  console.log('Listo. Ruta /demo-whatsapp agregada sin borrar las rutas existentes.')
} else console.log('La ruta ya estaba agregada; no se modificó nada.')
