// Run against `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const chromePath = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome')
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const profile = mkdtempSync(join(tmpdir(), 'kaluz-pwa-'))
const browser = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
let browserSocket
let id = 0
let onPageLoad
const pending = new Map()
async function call(method, params = {}) {
  const requestId = ++id
  const result = new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }))
  socket.send(JSON.stringify({ id: requestId, method, params }))
  return result
}
async function callBrowser(method, params = {}) {
  const requestId = ++id
  const result = new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }))
  browserSocket.send(JSON.stringify({ id: requestId, method, params }))
  return result
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
try {
  const portFile = join(profile, 'DevToolsActivePort')
  for (let attempt = 0; attempt < 100 && !existsSync(portFile); attempt++) await delay(100)
  const [port, browserPath] = readFileSync(portFile, 'utf8').trim().split('\n')
  const protocol = await (await fetch(`http://127.0.0.1:${port}/json/protocol`)).json()
  const pwaCommands = protocol.domains.find((domain) => domain.domain === 'PWA')?.commands || []
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/admin/solicitudes`)}`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((accept, reject) => { socket.onopen = accept; socket.onerror = reject })
  browserSocket = new WebSocket(`ws://127.0.0.1:${port}${browserPath}`)
  await new Promise((accept, reject) => { browserSocket.onopen = accept; browserSocket.onerror = reject })
  const onMessage = (event) => { const message = JSON.parse(event.data); if (message.method === 'Page.loadEventFired') onPageLoad?.(); if (message.id && pending.has(message.id)) { const entry = pending.get(message.id); pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result) } }
  socket.onmessage = onMessage
  browserSocket.onmessage = onMessage
  await call('Runtime.enable')
  await call('Page.enable')
  for (let attempt = 0; attempt < 100 && !await evaluate("document.body?.innerText.includes('Bandeja de solicitudes')"); attempt++) await delay(100)
  const sw = await evaluate("Promise.race([navigator.serviceWorker.ready.then(r => ({scope:r.scope, active:r.active?.scriptURL})), new Promise((_,reject)=>setTimeout(()=>reject(new Error('El service worker no se activó')),10000))])")
  const manifest = await call('Page.getAppManifest')
  const errors = await call('Page.getInstallabilityErrors')
  console.log('Service worker:', JSON.stringify(sw))
  console.log('Manifest:', manifest.data)
  console.log('Errores de instalación:', JSON.stringify(errors.installabilityErrors))
  assert.ok(sw.active?.endsWith('/sw.js'), 'El service worker no está activo')
  assert.equal(errors.installabilityErrors.length, 0, 'El navegador detectó problemas de instalación')
  assert.ok(pwaCommands.some((command) => command.name === 'install'), 'Chrome no permite probar la instalación')
  const manifestId = new URL(JSON.parse(manifest.data).start_url, manifest.url).href
  try {
    await callBrowser('PWA.install', { manifestId })
    console.log('Instalación PWA realizada en perfil temporal:', manifestId)
    try {
      if (pwaCommands.some((command) => command.name === 'getOsAppState')) {
        const state = await callBrowser('PWA.getOsAppState', { manifestId })
        console.log('Estado de la aplicación instalada:', JSON.stringify(state))
      }
    } finally {
      await callBrowser('PWA.uninstall', { manifestId })
      console.log('Aplicación desinstalada del perfil temporal')
    }
  } catch (error) {
    if (!String(error).includes("'PWA.install' wasn't found")) throw error
    console.log('NO VERIFICADO: Chrome oculto no expone PWA.install; probar instalación manual en un navegador con interfaz.')
  }
  const icons = await evaluate(`Promise.all(${JSON.stringify(JSON.parse(manifest.data).icons)}.map(async icon=>{const image=await createImageBitmap(await (await fetch(new URL(icon.src,${JSON.stringify(manifest.url)}))).blob()); return {width:image.width,height:image.height}}))`)
  assert.deepEqual(icons, [{ width: 192, height: 192 }, { width: 512, height: 512 }])
  const waitForLoad = () => new Promise((accept, reject) => { const timeout = setTimeout(() => reject(new Error('La página no terminó de cargar')), 10000); onPageLoad = () => { clearTimeout(timeout); onPageLoad = undefined; accept() } })
  let pageLoaded = waitForLoad()
  await call('Page.reload')
  await pageLoaded
  for (let attempt = 0; attempt < 100 && !await evaluate('!!navigator.serviceWorker.controller'); attempt++) await delay(100)
  assert.equal(await evaluate('!!navigator.serviceWorker.controller'), true, 'La página no está controlada por el service worker')
  await call('Network.enable')
  await call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  pageLoaded = waitForLoad()
  await call('Page.navigate', { url: `${baseUrl}/admin/solicitudes` })
  await pageLoaded
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate("document.body?.innerText.includes('Bandeja de solicitudes') && !navigator.onLine")) break
    await delay(100)
  }
  assert.equal(await evaluate("document.body?.innerText.includes('Bandeja de solicitudes') && !navigator.onLine"), true, 'La pantalla no cargó sin conexión')
  console.log('Manifest, iconos, service worker y carga sin conexión verificados.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { try { await call('Browser.close') } catch {} socket.close() }
  browserSocket?.close()
  browser.kill()
  await delay(500)
  const relativeProfile = relative(resolve(tmpdir()), resolve(profile))
  if (relativeProfile.startsWith('kaluz-pwa-') && !relativeProfile.includes('..')) { try { rmSync(profile, { recursive: true, force: true }) } catch {} }
}
