// Run against a local Vite server with: node tests/solicitudes-browser.mjs
// Set CHROME_PATH when Chrome is installed somewhere else.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const chromePath = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome')
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173'
const profile = mkdtempSync(join(tmpdir(), 'kaluz-solicitudes-'))
const browser = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
let peerSocket
let nextId = 0
let onPageLoad
const pending = new Map()

async function call(method, params = {}) {
  const id = ++nextId
  const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
  socket.send(JSON.stringify({ id, method, params }))
  return result
}
async function callPeer(method, params = {}) {
  const id = ++nextId
  const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
  peerSocket.send(JSON.stringify({ id, method, params }))
  return result
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description)
  return result.result.value
}
async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) { if (await evaluate(expression)) return; await delay(100) }
  throw new Error(`Timeout waiting for ${expression}`)
}
async function evaluatePeer(expression) {
  const result = await callPeer('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
async function waitForPeer(expression) {
  for (let attempt = 0; attempt < 100; attempt++) { if (await evaluatePeer(expression)) return; await delay(100) }
  throw new Error(`Timeout waiting for second tab: ${expression}`)
}
async function tap(expression) {
  const box = await evaluate(`(()=>{const el=${expression}; if(!el) throw new Error('Control no encontrado'); el.scrollIntoView({block:'center',inline:'center'}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}})()`)
  assert.ok(box.width >= 44 && box.height >= 44, `Control táctil demasiado pequeño: ${JSON.stringify(box)}`)
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] })
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

try {
  const portFile = join(profile, 'DevToolsActivePort')
  for (let attempt = 0; attempt < 100 && !existsSync(portFile); attempt++) await delay(100)
  const port = readFileSync(portFile, 'utf8').split('\n')[0]
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/admin/solicitudes`)}`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  const onMessage = (event) => { const message = JSON.parse(event.data); if (message.method === 'Page.loadEventFired' && event.currentTarget === socket) onPageLoad?.(); if (message.id && pending.has(message.id)) { const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result) } }
  socket.onmessage = onMessage
  await call('Runtime.enable')
  await call('Page.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1000, deviceScaleFactor: 1, mobile: false })
  await waitFor("document.body.innerText.includes('Bandeja de solicitudes')")
  assert.equal(await evaluate("document.querySelectorAll('tbody tr').length"), 8)
  const desktop = await call('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(tmpdir(), 'kaluz-solicitudes-desktop.png'), Buffer.from(desktop.data, 'base64'))

  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Turismo') && b.getAttribute('aria-pressed') !== null).click()")
  await waitFor("document.querySelectorAll('tbody tr').length === 2")
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Todas las solicitudes')).click()")
  // Use the native setter so React observes the change.
  await evaluate("(()=>{const i=document.querySelector('input[placeholder^=Buscar]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Carlos'); i.dispatchEvent(new Event('input',{bubbles:true}))})()")
  await waitFor("document.querySelectorAll('tbody tr').length === 1 && document.querySelector('tbody').innerText.includes('Carlos')")
  await evaluate("(()=>{const i=document.querySelector('input[placeholder^=Buscar]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'maria fernanda'); i.dispatchEvent(new Event('input',{bubbles:true}))})()")
  await waitFor("document.querySelectorAll('tbody tr').length === 1 && document.querySelector('tbody').innerText.includes('María Fernanda')")
  await evaluate("(()=>{const i=document.querySelector('input[placeholder^=Buscar]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true}))})()")
  await waitFor("document.querySelectorAll('tbody tr').length === 8")
  await evaluate("(()=>{const s=[...document.querySelectorAll('select')].find(e=>e.parentElement.textContent.includes('Filtrar por estado')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'rechazada'); s.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await waitFor("document.querySelectorAll('tbody tr').length === 1 && document.querySelector('tbody').innerText.includes('Rechazada')")
  await evaluate("(()=>{const s=[...document.querySelectorAll('select')].find(e=>e.parentElement.textContent.includes('Filtrar por estado')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'todos'); s.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await waitFor("document.querySelectorAll('tbody tr').length === 8")

  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Nueva solicitud')).click()")
  await waitFor("!!document.querySelector('[role=dialog] form')")
  for (const [type, label, hasDate] of [['conductores', 'Número de licencia', false], ['alquileres', 'Vehículo o servicio solicitado', true], ['turismo', 'Destino del viaje', true], ['afiliacion', 'Placa del vehículo', false]]) {
    await evaluate(`(()=>{const s=document.querySelector('[role=dialog] select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,${JSON.stringify(type)}); s.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await waitFor(`document.querySelector('[role=dialog]').innerText.includes(${JSON.stringify(label)})`)
    assert.equal(await evaluate("!!document.querySelector('[role=dialog] input[type=date]')"), hasDate)
  }
  await evaluate("document.querySelector('[role=dialog] button[type=submit]').click()")
  await waitFor("document.querySelector('[role=dialog]').innerText.includes('Ingresa un nombre')")
  await evaluate(`(()=>{const d=document.querySelector('[role=dialog]'); const fill=(label,value)=>{const l=[...d.querySelectorAll('label')].find(e=>e.textContent.startsWith(label)); const i=l.querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,value); i.dispatchEvent(new Event('input',{bubbles:true}))}; fill('Nombre completo','Prueba Solicitudes'); fill('Documento de identidad','12345678'); fill('Correo electrónico','prueba@ejemplo.com'); fill('Teléfono','987654321'); fill('Placa del vehículo','ABC-123'); d.querySelector('button[type=submit]').click()})()`)
  await waitFor("document.querySelector('tbody').innerText.includes('Prueba Solicitudes')")
  assert.equal(await evaluate("document.querySelectorAll('tbody tr').length"), 9)
  assert.equal(await evaluate("document.querySelector('aside[aria-label^=Detalle]').innerText.includes('Prueba Solicitudes')"), true)
  const peerTarget = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/admin/solicitudes`)}`, { method: 'PUT' })).json()
  peerSocket = new WebSocket(peerTarget.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { peerSocket.onopen = resolve; peerSocket.onerror = reject })
  peerSocket.onmessage = onMessage
  await callPeer('Runtime.enable')
  await waitForPeer("document.body?.innerText.includes('Prueba Solicitudes')")
  await evaluate("[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('Prueba Solicitudes')).querySelector('button').click()")
  await waitFor("document.querySelector('aside[aria-label^=Detalle]').innerText.includes('Prueba Solicitudes')")
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Revisar').click()")
  await waitFor("document.querySelector('tbody tr').innerText.includes('En revisión')")
  await waitForPeer("[...document.querySelectorAll('article')].find(a=>a.innerText.includes('Prueba Solicitudes'))?.innerText.includes('En revisión')")
  await evaluatePeer("[...document.querySelectorAll('article button')].find(b=>b.getAttribute('aria-label')?.includes('Prueba Solicitudes')).click()")
  await waitForPeer("!!document.querySelector('[role=dialog][aria-label^=Detalle]')")
  await evaluatePeer("[...document.querySelector('[role=dialog][aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Aprobar').click()")
  await waitFor("document.querySelector('tbody tr').innerText.includes('Aprobada')")
  peerSocket.close()
  await fetch(`http://127.0.0.1:${port}/json/close/${peerTarget.id}`)
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Observar').click()")
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Confirmar').click()")
  await waitFor("document.querySelector('aside[aria-label^=Detalle]').innerText.includes('Escribe un motivo')")
  await evaluate("(()=>{const i=document.querySelector('#action-note'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,'Falta documento'); i.dispatchEvent(new Event('input',{bubbles:true})); [...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Confirmar').click()})()")
  await waitFor("document.querySelector('tbody tr').innerText.includes('Observada')")
  await evaluate("document.querySelector('aside[aria-label^=Detalle] input[type=checkbox]').click()")
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('label')].find(l=>l.textContent.includes('Datos de contacto verificados')).querySelector('input').click()")
  await evaluate("(()=>{const i=document.querySelector('aside[aria-label^=Detalle] input[type=file]');const dt=new DataTransfer();dt.items.add(new File(['inválido'],'archivo.txt',{type:'text/plain'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await waitFor("document.querySelector('aside[aria-label^=Detalle] [role=alert]')?.textContent.includes('PDF, JPG o PNG')")
  await evaluate("(()=>{const i=document.querySelector('aside[aria-label^=Detalle] input[type=file]'); const dt=new DataTransfer(); dt.items.add(new File(['documento de prueba'], 'identidad.pdf', {type:'application/pdf'})); i.files=dt.files; i.dispatchEvent(new Event('change',{bubbles:true}))})()")
  await waitFor("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1'))[0].documents[0].dataUrl?.startsWith('data:application/pdf;base64,')")
  assert.equal(await evaluate("document.querySelector('aside[aria-label^=Detalle] a[download]')?.getAttribute('download')"), 'identidad.pdf')
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Aprobar').click()")
  await waitFor("document.querySelector('tbody tr').innerText.includes('Aprobada')")
  await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Rechazar').click()")
  await evaluate("(()=>{const i=document.querySelector('#action-note'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,'Datos incorrectos'); i.dispatchEvent(new Event('input',{bubbles:true})); [...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Confirmar').click()})()")
  await waitFor("document.querySelector('tbody tr').innerText.includes('Rechazada')")
  await delay(200)
  const reloadFinished = new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Reload timed out')), 10000); onPageLoad = () => { clearTimeout(timeout); onPageLoad = undefined; resolve() } })
  await call('Page.reload')
  await reloadFinished
  await waitFor("document.querySelector('tbody')?.innerText.includes('Prueba Solicitudes')")
  assert.equal(await evaluate("document.querySelector('tbody tr').innerText.includes('Rechazada')"), true)
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1'))[0].documents[0].received"), true)
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('kaluz.solicitudes.v1'))[0].requirements[0].checked"), true)
  await evaluate("document.querySelectorAll('tbody tr')[0].querySelector('input').click(); document.querySelectorAll('tbody tr')[1].querySelector('input').click()")
  await waitFor("document.body.innerText.includes('2 solicitudes seleccionadas')")
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent === 'Enviar a revisión').click()")
  await waitFor("[...document.querySelectorAll('tbody tr')].slice(0,2).every(r=>r.innerText.includes('En revisión'))")
  const statsMatch = await evaluate(`(()=>{const data=JSON.parse(localStorage.getItem('kaluz.solicitudes.v1')); const counts={'Pendientes':'pendiente','En revisión':'en_revision','Aprobadas':'aprobada','Observadas':'observada'}; const statuses=Object.entries(counts).every(([label,status])=>{const card=[...document.querySelectorAll('article')].find(a=>a.querySelector('p')?.textContent===label); return parseInt(card.querySelectorAll('p')[1].textContent,10) === data.filter(r=>r.status===status).length}); const categories={'Afiliación':'afiliacion','Conductores':'conductores','Alquileres':'alquileres','Turismo':'turismo'}; const types=Object.entries(categories).every(([label,type])=>{const button=[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.includes(label)); return Number(button.querySelectorAll('span span')[1].textContent)===data.filter(r=>r.type===type).length}); const all=[...document.querySelectorAll('button[aria-pressed]')].find(b=>b.textContent.includes('Todas las solicitudes')); return statuses && types && Number(all.querySelectorAll('span span')[1].textContent)===data.length})()`)
  assert.equal(statsMatch, true)

  for (const width of [360, 390, 768, 1366, 1500]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: width < 800 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 1024 })
    await call('Emulation.setTouchEmulationEnabled', { enabled: width < 1024 })
    await evaluate('window.scrollTo(0,0)')
    await delay(100)
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `Desbordamiento a ${width}px`)
    assert.equal(await evaluate("(()=>{const h=document.querySelector('h1').getBoundingClientRect();const banner=document.querySelector('h1').closest('.overflow-clip').getBoundingClientRect();return h.left>=banner.left && h.right<=banner.right})()"), true, `Título recortado a ${width}px`)
    if (width < 420) assert.equal(await evaluate("[...document.querySelectorAll('select')].every(e=>e.getBoundingClientRect().width>=200)"), true, `Filtros recortados a ${width}px`)
    if (width === 360) assert.equal(await evaluate("(()=>{const card=[...document.querySelectorAll('article')].find(a=>a.innerText.includes('Prueba Solicitudes'));const name=card.querySelector('p');const original=name.textContent;name.textContent='Nombre'.repeat(40);const fits=name.scrollWidth<=name.clientWidth+1 && document.documentElement.scrollWidth<=window.innerWidth;name.textContent=original;return fits})()"), true, 'Nombre largo desborda la tarjeta móvil')
    const screenshot = await call('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(tmpdir(), `kaluz-solicitudes-${width}.png`), Buffer.from(screenshot.data, 'base64'))
    if (width >= 1024) {
      assert.equal(await evaluate("!!document.querySelector('aside[aria-label^=Detalle]')"), true)
      assert.equal(await evaluate("[...document.querySelector('aside[aria-label^=Detalle]').querySelectorAll('button')].filter(b=>['Revisar','Aprobar','Observar','Rechazar'].includes(b.textContent)).every(b=>b.getBoundingClientRect().height>=44)"), true)
      continue
    }
    assert.equal(await evaluate("getComputedStyle(document.querySelector('#admin-navigation')).visibility"), 'hidden')
    await evaluate("document.querySelector('button[aria-label=\"Abrir menú\"]').focus()")
    await tap("document.querySelector('button[aria-label=\"Abrir menú\"]')")
    await waitFor("document.querySelector('button[aria-label=\"Cerrar menú\"]')?.getAttribute('aria-expanded') === 'true'")
    assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"), 'Cerrar menú de administración')
    await evaluate("(()=>{const menu=document.querySelector('#admin-navigation');menu.querySelector('a').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}))})()")
    assert.equal(await evaluate("document.activeElement.textContent.trim()"), 'GPS')
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))")
    await waitFor("document.querySelector('button[aria-label=\"Abrir menú\"]')?.getAttribute('aria-expanded') === 'false'")
    assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"), 'Abrir menú')
    await tap("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nueva solicitud'))")
    await waitFor("!!document.querySelector('[role=dialog] form')")
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)
    assert.equal(await evaluate("[...document.querySelectorAll('[role=dialog] input, [role=dialog] select')].every(e=>e.getBoundingClientRect().height>=44)"), true)
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}))")
    assert.equal(await evaluate("document.activeElement.textContent.trim()"), 'Registrar solicitud')
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))")
    await waitFor("!document.querySelector('[role=dialog]')")
    await tap("[...document.querySelectorAll('article button')].find(b=>b.getAttribute('aria-label')?.includes('Prueba Solicitudes'))")
    await waitFor("!!document.querySelector('[role=dialog][aria-label^=Detalle]')")
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)
    await tap("[...document.querySelector('[role=dialog][aria-label^=Detalle]').querySelectorAll('button')].find(b=>b.textContent === 'Observar')")
    await waitFor("document.activeElement?.id === 'action-note'")
    assert.equal(await evaluate("(()=>{const t=document.querySelector('#action-note').getBoundingClientRect(); const p=document.querySelector('#action-note').closest('.overflow-y-auto').getBoundingClientRect(); return t.top>=p.top && t.bottom<=p.bottom})()"), true, `Motivo fuera de la vista a ${width}px`)
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))")
    await waitFor("!document.querySelector('[role=dialog]')")
  }
  for (const [path, title] of [['dashboard', 'Dashboard'], ['afiliados', 'Padrón de Afiliados'], ['conductores', 'Gestión de Conductores'], ['vehiculos', 'Vehículos - Flota'], ['pagos', 'Gestión de Pagos y Cuotas'], ['documentos', 'Gestión de Documentos'], ['alquileres', 'Gestión de Alquileres'], ['gps', 'Seguimiento GPS']]) {
    await call('Page.navigate', { url: `${baseUrl}/admin/${path}` })
    await waitFor(`document.querySelector('h1')?.textContent === ${JSON.stringify(title)}`)
  }
  console.log('Flujos de escritorio y móvil verificados; capturas guardadas en el directorio temporal.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close') } catch {} socket.close() }
  peerSocket?.close()
  browser.kill()
  await delay(500)
  const relativeProfile = relative(resolve(tmpdir()), resolve(profile))
  if (relativeProfile.startsWith('kaluz-solicitudes-') && !relativeProfile.includes('..')) {
    try { rmSync(profile, { recursive: true, force: true }) } catch {}
  }
}
