// Run against a production preview: BASE_URL=http://127.0.0.1:4173 node tests/affiliates-browser.mjs
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome')
const base = process.env.BASE_URL || 'http://127.0.0.1:4173'
const profile = mkdtempSync(join(tmpdir(), 'kaluz-afiliados-'))
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket, id = 0
const pending = new Map()
async function call(method, params = {}) {
  const request = ++id
  const result = new Promise((resolve, reject) => pending.set(request, { resolve, reject }))
  socket.send(JSON.stringify({ id: request, method, params }))
  return result
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100) }
  throw new Error(`Timeout: ${expression}`)
}
const click = text => evaluate(`[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null && b.textContent.trim()===${JSON.stringify(text)}).click()`)
async function setValue(selector, value) {
  await evaluate(`(()=>{const e=${selector}; if(!e) throw new Error('Campo no encontrado'); const prototype=e instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(e,${JSON.stringify(value)}); e.dispatchEvent(new Event(e instanceof HTMLSelectElement?'change':'input',{bubbles:true}))})()`)
}
const field = label => `[...document.querySelector('[role=dialog] form').querySelectorAll('label')].find(l=>l.textContent.startsWith(${JSON.stringify(label)})).querySelector('input')`
async function tap(expression) {
  const box = await evaluate(`(()=>{const e=${expression}; if(!e) throw new Error('Control no encontrado'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}})()`)
  assert.ok(box.width >= 44 && box.height >= 44, `Control táctil pequeño: ${JSON.stringify(box)}`)
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] })
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
try {
  const portFile = join(profile, 'DevToolsActivePort')
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await delay(100)
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${base}/admin/afiliados`)}`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result) } }
  await call('Runtime.enable'); await call('Page.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false })
  await waitFor("document.querySelector('h1')?.textContent==='Padrón de Afiliados'")
  assert.equal(await evaluate("document.querySelectorAll('tbody tr').length"), 6)
  await evaluate("window.confirm=()=>true")
  await evaluate("[...document.querySelectorAll('section[aria-labelledby=affiliate-requests-title] button')].find(b=>b.parentElement.parentElement.textContent.includes('SOL-1001')).click()")
  await waitFor("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1')||'[]').find(r=>r.id==='SOL-1001')?.status==='aprobada'")
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).filter(a=>a.identity==='45871932').length"), 1)
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='45871932').status"), 'activo')
  await setValue("document.querySelector('input[placeholder^=Buscar]')", 'carlos mendoza')
  await waitFor("document.querySelectorAll('tbody tr').length===1 && document.querySelector('tbody').innerText.includes('Carlos')")
  await click('Limpiar filtros')
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Situación de deuda')).querySelector('select')", 'moroso')
  await waitFor("document.querySelectorAll('tbody tr').length>0 && !document.querySelector('tbody').innerText.includes('María Fernanda')")
  await click('Limpiar filtros')
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Tipo de afiliación')).querySelector('select')", 'alquilado')
  await waitFor("document.querySelectorAll('tbody tr').length===1 && document.querySelector('tbody').innerText.includes('Jorge Luis')")
  await evaluate("window.__originalCreateURL=URL.createObjectURL; URL.createObjectURL=(blob)=>{window.__export=blob;return window.__originalCreateURL(blob)}")
  await click('Exportar CSV')
  assert.match(await evaluate('window.__export.text()'), /Jorge Luis/)
  assert.doesNotMatch(await evaluate('window.__export.text()'), /María Fernanda/)
  await click('Limpiar filtros')
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Estado')).querySelector('select')", 'suspendido')
  await waitFor("document.querySelectorAll('tbody tr').length===1 && document.querySelector('tbody').innerText.includes('Víctor')")
  await click('Limpiar filtros')
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Ingreso desde')).querySelector('input')", '2024-01-01')
  await waitFor("document.body.innerText.includes('No se encontraron afiliados')")
  await click('Limpiar filtros')
  await click('Registrar afiliado')
  await waitFor("!!document.querySelector('[role=dialog] form')")
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('[role=dialog]').innerText.includes('Revisa los campos')")
  for (const [label, value] of [['Nombre completo', 'Afiliado Prueba'], ['DNI', '12345678'], ['Teléfono', '987654321'], ['Correo electrónico', 'prueba@ejemplo.com'], ['Dirección', 'Av. Prueba 123'], ['Placa', 'ZZZ-123'], ['Marca', 'Toyota'], ['Modelo', 'Yaris'], ['Año', '2020'], ['Color', 'Azul'], ['Cuota mensual', '120.00']]) await setValue(field(label), value)
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('tbody').innerText.includes('Afiliado Prueba')")
  await click('Activar afiliado')
  await waitFor("document.body.innerText.includes('Estado actualizado.')")
  await click('Ver cuotas')
  await waitFor("document.body.innerText.includes('Agregar cuota')")
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Periodo')).querySelector('input')", '2022-01')
  await setValue("[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Vencimiento')).querySelector('input')", '2022-01-10')
  await click('Agregar cuota')
  await waitFor("document.body.innerText.includes('2022-01 · S/ 120.00')")
  await click('Registrar pago')
  await waitFor("document.body.innerText.includes('Pagada')")
  await call('Page.reload')
  await waitFor("document.querySelector('tbody')?.innerText.includes('Afiliado Prueba')")
  const saved = await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='12345678')")
  assert.equal(saved.status, 'activo'); assert.equal(saved.fees.length, 1); assert.ok(saved.fees[0].paidAt)
  assert.equal(await evaluate("(()=>{const data=JSON.parse(localStorage.getItem('kaluz.afiliados.v1')); const value=[...document.querySelectorAll('p')].find(p=>p.textContent==='Afiliados activos').nextElementSibling.textContent; return Number(value)===data.filter(a=>a.status==='activo').length})()"), true)
  await evaluate("[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('Afiliado Prueba')).querySelector('button').click()")
  await click('Editar ficha')
  await setValue(field('Dirección'), 'Av. Editada 456')
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.body.innerText.includes('Ficha actualizada.')")
  await call('Page.reload'); await waitFor("document.querySelector('tbody')?.innerText.includes('Afiliado Prueba')")
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='12345678').address"), 'Av. Editada 456')
  await evaluate("[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('Afiliado Prueba')).querySelector('button').click()")
  await click('Historial')
  await waitFor("document.body.innerText.includes('Ficha actualizada') && document.body.innerText.includes('Pago de cuota')")
  await click('Información')
  await click('Suspender')
  await waitFor("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='12345678').status==='suspendido'")
  await click('Activar')
  await waitFor("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='12345678').status==='activo'")
  await evaluate("[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('María Fernanda')).querySelector('button').click()")
  await click('Documentos')
  await waitFor("document.body.innerText.includes('SOL-1001')")
  await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent==='Ver solicitud').click()")
  await waitFor("location.pathname==='/admin/solicitudes' && document.querySelector('h1')?.textContent==='Solicitudes' && document.querySelector('input[placeholder^=Buscar]')?.value==='SOL-1001'")
  assert.equal(await evaluate("document.querySelector('input[placeholder^=Buscar]').value"), 'SOL-1001')
  await click('Nueva solicitud')
  await waitFor("!!document.querySelector('[role=dialog] form')")
  for (const [label, value] of [['Nombre completo', 'Solicitud Nueva'], ['Documento de identidad', '87654321'], ['Correo electrónico', 'solicitud@ejemplo.com'], ['Teléfono', '987654321'], ['Placa del vehículo', 'VVV-123']]) await setValue(field(label), value)
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1')).some(r=>r.identity==='87654321')")
  await call('Page.navigate', { url: `${base}/admin/afiliados` })
  await waitFor("document.querySelector('h1')?.textContent==='Padrón de Afiliados' && document.body.innerText.includes('Solicitud Nueva')")
  await evaluate("[...document.querySelectorAll('section[aria-labelledby=affiliate-requests-title] button')].find(b=>b.parentElement.parentElement.textContent.includes('87654321')).click()")
  await waitFor("document.querySelector('[role=dialog]')?.innerText.includes('Aprobar y registrar afiliado')")
  for (const [label, value] of [['Dirección', 'Av. Nueva 123'], ['Marca', 'Kia'], ['Modelo', 'Soluto'], ['Año', '2020'], ['Color', 'Blanco'], ['Cuota mensual', '100.00']]) await setValue(field(label), value)
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).some(a=>a.identity==='87654321')")
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1')).find(r=>r.identity==='87654321').status"), 'aprobada')
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).filter(a=>a.identity==='87654321').length"), 1)
  for (const width of [360, 390, 768, 1366]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1000 })
    await call('Page.navigate', { url: `${base}/admin/afiliados` })
    await waitFor("document.querySelector('h1')?.textContent==='Padrón de Afiliados'")
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Desbordamiento a ${width}px`)
    const screenshot = await call('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(tmpdir(), `kaluz-afiliados-${width}.png`), Buffer.from(screenshot.data, 'base64'))
    if (width < 1000) {
      if (width < 640) {
        await tap("document.querySelector('[aria-label=\"Mostrar u ocultar filtros\"]')")
        assert.equal(await evaluate("document.querySelector('[aria-label=\"Mostrar u ocultar filtros\"]').getAttribute('aria-expanded')"), 'true')
        await setValue("[...document.querySelector('#affiliate-filters').querySelectorAll('label')].find(l=>l.textContent.startsWith('Estado')).querySelector('select')", 'suspendido')
        await waitFor("document.body.innerText.includes('Víctor Huamán Soto') && ![...document.querySelectorAll('button')].some(b=>b.offsetParent!==null && b.textContent.includes('Afiliado Prueba'))")
        await tap("[...document.querySelector('#affiliate-filters').querySelectorAll('button')].find(b=>b.textContent.trim()==='Limpiar filtros')")
        await tap("document.querySelector('[aria-label=\"Mostrar u ocultar filtros\"]')")
      }
      await tap("document.querySelector('button[aria-label=\"Abrir menú\"]')")
      await waitFor("!!document.querySelector('[role=dialog][aria-label=\"Menú de administración\"]')")
      await delay(300)
      await tap("document.querySelector('[aria-label=\"Cerrar menú de administración\"]')")
      await waitFor("!document.querySelector('[role=dialog][aria-label=\"Menú de administración\"]')")
      await tap("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Afiliado Prueba') && b.offsetParent!==null)")
      await waitFor("!!document.querySelector('[role=dialog][aria-label=\"Ficha del afiliado\"]')")
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
      if (width === 360) {
        await tap("[...document.querySelector('[role=dialog]').querySelectorAll('button')].find(b=>b.textContent.trim()==='Cuotas')")
        await setValue("[...document.querySelector('[role=dialog]').querySelectorAll('label')].find(l=>l.textContent.startsWith('Periodo')).querySelector('input')", '2022-02')
        await setValue("[...document.querySelector('[role=dialog]').querySelectorAll('label')].find(l=>l.textContent.startsWith('Vencimiento')).querySelector('input')", '2022-02-10')
        await tap("[...document.querySelector('[role=dialog]').querySelectorAll('button')].find(b=>b.textContent.trim()==='Agregar cuota')")
        await waitFor("document.querySelector('[role=dialog]').innerText.includes('2022-02 · S/ 120.00')")
        await tap("[...document.querySelector('[role=dialog]').querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar pago')")
        assert.ok(await evaluate("JSON.parse(localStorage.getItem('kaluz.afiliados.v1')).find(a=>a.identity==='12345678').fees.find(f=>f.period==='2022-02').paidAt"))
      }
      await tap("document.querySelector('[role=dialog] [aria-label=\"Cerrar ficha\"]')")
      await tap("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Registrar afiliado')")
      await waitFor("!!document.querySelector('[role=dialog] form')")
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
      if (width === 390) { await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))"); await waitFor("!document.querySelector('[role=dialog] form')") }
      else await tap("document.querySelector('[role=dialog] [aria-label=\"Cerrar formulario\"]')")
    }
  }
  console.log('Escritorio, móvil, formularios, cuotas, relación y recarga verificados; capturas en el directorio temporal.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close') } catch {} socket.close() }
  browser.kill(); await delay(500)
  const rel = relative(resolve(tmpdir()), resolve(profile))
  if (rel.startsWith('kaluz-afiliados-') && !rel.includes('..')) { try { rmSync(profile, { recursive: true, force: true }) } catch {} }
}
