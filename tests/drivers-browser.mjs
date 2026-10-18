// Run against the production preview with node tests/drivers-browser.mjs.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome')
const base = process.env.BASE_URL || 'http://127.0.0.1:4173'
const profile = mkdtempSync(join(tmpdir(), 'kaluz-conductores-'))
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket, id = 0
const pending = new Map()
async function call(method, params = {}) { const request = ++id; const result = new Promise((resolve, reject) => pending.set(request, { resolve, reject })); socket.send(JSON.stringify({ id: request, method, params })); return result }
async function evaluate(expression) { const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value }
async function waitFor(expression) { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100) } throw new Error(`Timeout: ${expression}`) }
const click = text => evaluate(`[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null && b.textContent.trim()===${JSON.stringify(text)}).click()`)
async function setValue(selector, value) { await evaluate(`(()=>{const e=${selector}; if(!e) throw new Error('Campo no encontrado'); const p=e instanceof HTMLSelectElement?HTMLSelectElement.prototype:e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)}); e.dispatchEvent(new Event(e instanceof HTMLSelectElement?'change':'input',{bubbles:true}))})()`) }
const field = label => `[...document.querySelector('[role=dialog] form').querySelectorAll('label')].find(l=>l.textContent.startsWith(${JSON.stringify(label)})).querySelector('input')`
const select = label => `[...document.querySelector('[role=dialog] form').querySelectorAll('label')].find(l=>l.textContent.startsWith(${JSON.stringify(label)})).querySelector('select')`
async function tap(expression) { const box = await evaluate(`(()=>{const e=${expression}; if(!e) throw new Error('Control no encontrado'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}})()`); assert.ok(box.width >= 44 && box.height >= 44, JSON.stringify(box)); await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] }); await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
try {
  const portFile = join(profile, 'DevToolsActivePort'); for (let i = 0; i < 100 && !existsSync(portFile); i++) await delay(100)
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${base}/admin/conductores`)}`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  socket.onmessage = event => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result) } }
  await call('Runtime.enable'); await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false })
  await waitFor("document.querySelector('h1')?.textContent==='Gestión de Conductores'")
  assert.equal(await evaluate("document.querySelectorAll('tbody tr').length"), 3)
  await evaluate('window.confirm=()=>true'); await click('Aprobar postulación')
  await waitFor("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1')||'[]').find(r=>r.id==='SOL-1002')?.status==='aprobada'")
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.conductores.v1')).find(d=>d.requestId==='SOL-1002').status"), 'activo')
  await click('Registrar conductor'); await waitFor("!!document.querySelector('[role=dialog] form')")
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('[role=dialog]').innerText.includes('Revisa los campos')")
  await setValue("document.querySelector('[role=dialog] textarea')", 'Nombre: Conductor Prueba\nDNI: 12345678\nTeléfono: 987654321\nCorreo: prueba@ejemplo.com\nLicencia: Q12345678\nCategoría: A-IIb\nExperiencia: 4')
  await click('Generar borrador simulado')
  await waitFor("document.querySelector('[role=dialog]').innerText.includes('Borrador simulado')")
  assert.equal(await evaluate(`${field('Nombre completo')}.value`), 'Conductor Prueba')
  for (const [label, value] of [['Dirección', 'Av. Prueba 123'], ['Fecha de emisión', '2023-01-01'], ['Fecha de vencimiento', '2030-01-01']]) await setValue(field(label), value)
  await setValue(select('Vehículo asignado'), 'WAR-732')
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('[role=dialog]').innerText.includes('ya está asignado')")
  await setValue(select('Vehículo asignado'), 'KAL-001')
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('tbody')?.innerText.includes('Conductor Prueba')")
  await call('Page.reload'); await waitFor("document.querySelector('tbody')?.innerText.includes('Conductor Prueba')")
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.conductores.v1')).find(d=>d.identity==='12345678').vehiclePlate"), 'KAL-001')
  await setValue("document.querySelector('input[placeholder^=Buscar]')", 'conductor prueba')
  await waitFor("document.querySelectorAll('tbody tr').length===1")
  await evaluate("document.querySelector('tbody tr button').click()")
  await click('Vehículo'); await waitFor("document.body.innerText.includes('KAL-001') && document.body.innerText.includes('Kaluz')")
  await click('Información'); await click('Editar ficha'); await setValue(field('Dirección'), 'Av. Editada 456'); await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("JSON.parse(localStorage.getItem('kaluz.conductores.v1')).find(d=>d.identity==='12345678').address==='Av. Editada 456'")
  for (const width of [360, 390, 768, 1366]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1000 }); await call('Page.navigate', { url: `${base}/admin/conductores` })
    await waitFor("document.querySelector('h1')?.textContent==='Gestión de Conductores'")
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true, `Desbordamiento ${width}`)
    if (width < 1000) {
      await tap("[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null && b.textContent.includes('Conductor Prueba'))")
      await waitFor("!!document.querySelector('[role=dialog][aria-label=\"Ficha del conductor\"]')")
      await tap("[...document.querySelector('[role=dialog]').querySelectorAll('button')].find(b=>b.textContent.trim()==='Editar ficha')")
      await waitFor("!!document.querySelector('[role=dialog] form')")
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true)
      await setValue(select('Disponibilidad'), 'ocupado')
      await tap("document.querySelector('[role=dialog] button[type=submit]')")
      await waitFor("JSON.parse(localStorage.getItem('kaluz.conductores.v1')).find(d=>d.identity==='12345678').availability==='ocupado'")
    }
  }
  console.log('Conductores: borrador, validaciones, asignación, aprobación, persistencia y tamaños verificados.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close') } catch {} socket.close() }
  browser.kill(); await delay(500); const rel = relative(resolve(tmpdir()), resolve(profile)); if (rel.startsWith('kaluz-conductores-') && !rel.includes('..')) { try { rmSync(profile, { recursive: true, force: true }) } catch {} }
}
