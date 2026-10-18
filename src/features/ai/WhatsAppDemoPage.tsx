import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, Bot, CarFront, Check, CheckCheck, CheckCircle2, ClipboardCheck, Clock3, FileText, Info, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createRequest } from '../solicitudes/model.ts'
import { loadRequests, saveRequests } from '../solicitudes/storage.ts'
import { convertirABorrador, datosPendientes } from './waDemoMapper.ts'
import { esEstadoAgente } from './waDemoTypes.ts'
import type { EstadoAgente, MensajeDemo, TipoFlujo } from './waDemoTypes.ts'

/** Este endpoint solo funciona en la computadora de la demo. La clave de Gemini NUNCA va en React. */
const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:8789/api/ia' : ''
type Perfil = 'conductor' | 'cliente' | null
interface Opcion { titulo: string; tipo: Exclude<TipoFlujo, null>; prompt: string }

const CONDUCTOR: Opcion[] = [
  { titulo: 'Quiero trabajar como conductor', tipo: 'conductores', prompt: 'Soy una persona que quiere empezar a trabajar como conductor con Kaluz. Explícame con palabras fáciles cómo comenzar y guíame para preparar la postulación; una pregunta por vez.' },
  { titulo: 'Tengo un auto y quiero registrarlo', tipo: 'afiliacion', prompt: 'Soy propietario de un vehículo y quiero afiliarlo a Kaluz. Guíame de manera sencilla para preparar el borrador de afiliación; una pregunta por vez.' },
  { titulo: 'Necesito alquilar un vehículo', tipo: 'alquileres', prompt: 'Soy conductor y quisiera solicitar el alquiler de un vehículo para trabajar. Hazme las preguntas necesarias para preparar un borrador; no inventes precio ni disponibilidad.' },
  { titulo: '¿Qué papeles necesito?', tipo: 'requisitos', prompt: 'Soy conductor y no conozco las palabras técnicas. Ayúdame a saber qué documentos pedirán; primero pregúntame en palabras sencillas si quiero empezar a conducir, registrar mi auto o completar un trámite que ya inicié.' },
]
const CLIENTE: Opcion[] = [
  { titulo: 'Quiero hacer turismo', tipo: 'turismo', prompt: 'Soy cliente y quiero solicitar un paseo o servicio turístico con Kaluz. Ayúdame a preparar mi solicitud. Pregunta una cosa a la vez, sin inventar tarifas o disponibilidad.' },
  { titulo: 'Necesito un taxi', tipo: 'taxi', prompt: 'Soy cliente y necesito un taxi. Pregúntame de dónde salgo y a dónde quiero ir, sin prometer un vehículo ni inventar un precio.' },
  { titulo: 'Quiero alquilar un vehículo', tipo: 'alquileres', prompt: 'Soy cliente y quiero consultar el alquiler de un vehículo. Ayúdame a preparar mi solicitud, sin confirmar disponibilidad ni precio.' },
  { titulo: 'Tengo una pregunta', tipo: 'requisitos', prompt: 'Soy cliente y tengo una consulta sobre los servicios de Kaluz. Explícame todo con lenguaje sencillo, una pregunta por vez.' },
]

function flujoDetectado(estado: EstadoAgente): TipoFlujo {
  switch (estado.intencion) {
    case 'afiliacion': return 'afiliacion'
    case 'turismo': return 'turismo'
    case 'taxi': return 'taxi'
    case 'alquiler': return 'alquileres'
    case 'consulta_requisitos': return 'requisitos'
    default: return estado.tipo_usuario === 'conductor_nuevo' ? 'conductores' : null
  }
}

function sugerencias(flujo: TipoFlujo, estado: EstadoAgente | null): string[] {
  if (flujo === 'requisitos') return [
    'Quiero empezar a trabajar como conductor',
    'Tengo un auto y quiero registrarlo',
    'Ya estoy haciendo un trámite; ¿qué documentos llevo?',
  ]
  if (flujo === 'afiliacion') {
    if (!estado?.datos.vehiculo) return ['Tengo un Toyota Yaris', 'Quiero afiliar una camioneta']
    if (!estado?.datos.zonas.length) return ['Trabajaré en Huancayo y El Tambo']
  }
  if (flujo === 'conductores' && !estado?.datos.zonas.length) return ['Quiero trabajar en Huancayo y El Tambo']
  if (flujo === 'turismo') {
    if (!estado?.datos.destino) return ['Queremos visitar el Convento de Ocopa']
    if (!estado?.datos.pasajeros) return ['Viajamos cuatro personas']
  }
  if (flujo === 'taxi') return ['Quiero ir de Huancayo a El Tambo']
  return []
}


/** No se guarda por la respuesta de Gemini: exige consentimiento del usuario. */
function confirmaEnvio(texto: string, ultimoMensajeAgente: string): boolean {
  const t = texto.trim().toLocaleLowerCase('es')
  const pregunta = ultimoMensajeAgente.toLocaleLowerCase('es')
  if (/^(?:no\b|todav[ií]a no\b|mejor no\b|cancelar\b)/i.test(t) || /\bno\s+(?:la|lo|quiero|env[ií]es|env[ií]ar|registres|registrar|derives)\b/i.test(t)) return false
  if (/\b(?:env[ií]a(?:r|la|lo)?|mand[aá](?:r|la|lo)?|registra(?:r|la|lo)?|deriva(?:r|la|lo)?|presenta(?:r|la|lo)?)\b/i.test(t) &&
      /\b(?:solicitud|ficha|borrador|revisi[oó]n|asesor|administrador|kaluz)\b/i.test(t)) return true
  const afirmativo = /^(?:s[ií](?:\s|[,!.?]|$)|claro\b|de acuerdo\b|ok\b|dale\b|hazlo\b|adelante\b|por supuesto\b)/i.test(t)
  if (afirmativo && /\b(?:env[ií]a(?:r|la|lo)?|manda(?:r|la|lo)?|registra(?:r|la|lo)?|deriva(?:r|la|lo)?)\b/i.test(t)) return true
  const ofrecioEnvio = /(?:\bderiv\w*|\benvi\w*|\bregistr\w*|\bsolicitud\b|\bborrador\b|\basesor\b|\brevisi[oó]n\b)/i.test(pregunta) && /[¿?]/.test(pregunta)
  return afirmativo && ofrecioEnvio
}

/** Una consulta de requisitos puede terminar convirtiéndose en una afiliación real de demo. */
function resolverFlujo(actual: TipoFlujo, mensaje: string, salida: EstadoAgente, envioConfirmado = false): TipoFlujo {
  if (actual && actual !== 'requisitos') return actual
  if (/\bafili\w*|\bregistrar\s+(?:mi\s+)?(?:auto|veh[ií]culo|carro)\b/i.test(mensaje) || salida.intencion === 'afiliacion') return 'afiliacion'
  if (/\bpostul\w*\s+(?:como\s+)?conductor\b|\btrabajar\s+como\s+conductor\b/i.test(mensaje)) return 'conductores'
  if (actual === 'requisitos' && salida.tipo_usuario === 'conductor_nuevo' && salida.datos.vehiculo && salida.datos.zonas.length && (envioConfirmado || /\b(?:envi|deriv|registr|revis)\w*/i.test(mensaje))) return 'afiliacion'
  return actual ?? flujoDetectado(salida)
}

const confirmacionReal = (codigo: string) =>
  `¡Solicitud recibida! Código ${codigo}. Se guardó en la bandeja de Kaluz para revisión humana. Aún no está aprobada y nadie ha revisado documentos. (Registro local de demostración.)`

const hora = () => new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())

export function WhatsAppDemoPage() {
  const [perfil, setPerfil] = useState<Perfil>(null)
  const [flujo, setFlujo] = useState<TipoFlujo>(null)
  const [mensajes, setMensajes] = useState<MensajeDemo[]>([])
  const [estado, setEstado] = useState<EstadoAgente | null>(null)
  const [entrada, setEntrada] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [codigoGuardado, setCodigoGuardado] = useState('')
  const fin = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const ultimoCodigoRef = useRef('')

  useEffect(() => { fin.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [mensajes, enviando, perfil])

  function reiniciar() {
    if (enviando) return
    setPerfil(null); setFlujo(null); setMensajes([]); setEstado(null); setEntrada(''); setError(''); setCodigoGuardado(''); ultimoCodigoRef.current = ''
  }

  /** Solo devuelve un código tras un guardado efectivo. No llama a Gemini. */
  function guardarBorrador(ficha: EstadoAgente, tipo: TipoFlujo): string | null {
    if (ultimoCodigoRef.current) return ultimoCodigoRef.current
    const valores = convertirABorrador(ficha, tipo)
    if (!valores) return null
    try {
      const solicitud = createRequest(valores)
      const anteriores = loadRequests(window.localStorage).requests
      if (!saveRequests(window.localStorage, [solicitud, ...anteriores])) throw new Error('No se pudo guardar en este navegador.')
      ultimoCodigoRef.current = solicitud.id
      setCodigoGuardado(solicitud.id)
      setError('')
      return solicitud.id
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la solicitud.')
      return null
    }
  }

  async function enviar(valor: string, flujoElegido?: Exclude<TipoFlujo, null>, textoVisible?: string) {
    const mensaje = valor.trim()
    if (!mensaje || enviando || ultimoCodigoRef.current) return
    if (!API_URL) { setError('La IA local no está disponible en esta publicación. Debe conectarse un backend seguro.'); return }
    const previo = flujoElegido ? null : estado
    const historial = flujoElegido ? [] : mensajes.slice(-12)
    const ultimoAsistente = [...mensajes].reverse().find(m => m.rol === 'asistente')?.texto || ''
    const quiereEnviar = !flujoElegido && confirmaEnvio(mensaje, ultimoAsistente)
    const flujoActual = flujoElegido ?? flujo
    const visible = textoVisible || mensaje
    setError(''); setEntrada('')
    setMensajes(m => [...m, { rol: 'usuario', texto: visible }])
    if (flujoElegido) { setFlujo(flujoElegido); setEstado(null); setCodigoGuardado(''); ultimoCodigoRef.current = '' }

    // Si la ficha YA tiene datos mínimos y el usuario autoriza, guardar sin volver a
    // consultar a Gemini. Así la IA no puede fingir que se realizó una operación.
    if (quiereEnviar && previo) {
      const destino = resolverFlujo(flujoActual, mensaje, previo, quiereEnviar)
      if (convertirABorrador(previo, destino)) {
        setFlujo(destino)
        const codigo = guardarBorrador(previo, destino)
        setMensajes(m => [...m, { rol: 'asistente', texto: codigo ? confirmacionReal(codigo) : 'No pude guardar la solicitud. Inténtalo nuevamente o solicita ayuda al administrador.' }])
        return
      }
    }

    setEnviando(true)
    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, historial, estadoPrevio: previo }),
      })
      const cuerpo: unknown = await respuesta.json()
      if (!respuesta.ok) {
        const detalle = cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo ? String(cuerpo.error) : `Error HTTP ${respuesta.status}`
        throw new Error(detalle)
      }
      if (!esEstadoAgente(cuerpo)) throw new Error('La IA devolvió un formato inesperado.')
      const destino = flujoElegido ?? resolverFlujo(flujo, mensaje, cuerpo, quiereEnviar)
      setFlujo(destino)
      setEstado(cuerpo)
      if (quiereEnviar) {
        // Si el consentimiento vino junto con datos nuevos, primero se extrajeron
        // con Gemini y ahora sí intentamos guardar el borrador resultante.
        const codigo = guardarBorrador(cuerpo, destino)
        if (codigo) {
          setMensajes(m => [...m, { rol: 'asistente', texto: confirmacionReal(codigo) }])
        } else {
          const faltantes = datosPendientes(cuerpo, destino)
          const aviso = faltantes.length
            ? `Todavía no envié tu solicitud. Para hacerlo necesito: ${faltantes.join(', ')}. ¿Me ayudas con esos datos?`
            : 'Todavía no se guardó la solicitud. Si ya completaste los datos, comprueba si tu navegador permite guardar registros o intenta de nuevo.'
          setMensajes(m => [...m, { rol: 'asistente', texto: aviso }])
        }
      } else {
        const lista = convertirABorrador(cuerpo, destino)
        const suenaAConfirmacion = /(?:\bya\s+(?:envi|registr|deriv|recib)\w*|\bte\s+contactar[aá]\b|\btu\s+(?:solicitud|borrador)\s+est[aá]\s+listo\b)/i.test(cuerpo.respuesta_usuario)
        const respuestaSegura = suenaAConfirmacion
          ? (lista ? 'Tu borrador tiene los datos básicos, pero todavía no lo he enviado. ¿Quieres enviar tu solicitud para que el dueño de Kaluz la revise?' : 'Estamos preparando el borrador. Todavía no se ha enviado ninguna solicitud. ¿Quieres continuar completando los datos?')
          : cuerpo.respuesta_usuario
        setMensajes(m => [...m, { rol: 'asistente', texto: respuestaSegura }])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible comunicarse con la IA.')
      setMensajes(m => m.slice(0, -1))
      setEntrada(visible)
      if (flujoElegido) setFlujo(null)
    } finally { setEnviando(false) }
  }

  function elegir(opcion: Opcion) { if (!mensajes.length) void enviar(opcion.prompt, opcion.tipo, opcion.titulo) }
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); void enviar(entrada) }
  function teclado(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (entrada.trim()) void enviar(entrada) }
  }

  /** Alternativa accesible: el botón explícito sigue funcionando. */
  function guardar() {
    if (!estado || ultimoCodigoRef.current) return
    const codigo = guardarBorrador(estado, flujo)
    if (codigo) setMensajes(m => [...m, { rol: 'usuario', texto: 'Sí, enviar mi solicitud para revisión' }, { rol: 'asistente', texto: confirmacionReal(codigo) }])
  }

  const faltantes = datosPendientes(estado, flujo)
  const borrador = convertirABorrador(estado, flujo)
  const opciones = perfil === 'conductor' ? CONDUCTOR : CLIENTE
  const recomendados = mensajes.length > 0 && !codigoGuardado && !enviando ? sugerencias(flujo, estado) : []
  const fechaHora = hora()

  return <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[.12em] text-emerald-700">Prototipo interactivo · Hackathon</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#102f53] sm:text-3xl">De una conversación a una solicitud real de prueba</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Demostración del canal conversacional previsto para WhatsApp. La IA es Gemini real; la mensajería de WhatsApp y el almacenamiento central siguen simulados.</p>
      </div>
      <Link to="/admin/solicitudes" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"><ClipboardCheck size={18}/> Panel del dueño <ArrowRight size={16}/></Link>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,490px)_minmax(0,1fr)]">
      {/* Pantalla de teléfono: diseño inspirado en mensajería, sin representar la aplicación oficial de WhatsApp. */}
      <section aria-label="Simulador de conversación" className="mx-auto w-full max-w-[490px] overflow-hidden rounded-[28px] border-[5px] border-[#1b2d2c] bg-[#eae6dc] shadow-2xl">
        <div className="flex items-center justify-between bg-[#075e54] px-5 pt-2 text-[11px] font-semibold text-white/90"><span>{fechaHora}</span><span>Kaluz Digital · Demo</span></div>
        <div className="flex items-center justify-between gap-3 bg-[#075e54] px-3 py-3 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#dff9e8] text-[#075e54]"><MessageCircle size={23}/></span>
            <span className="min-w-0"><strong className="block truncate text-[15px]">Kaluz Digital | Asistente IA</strong><span className="block text-xs text-[#d2f0e4]">Simulación · Gemini conectado</span></span>
          </div>
          <button type="button" onClick={reiniciar} disabled={enviando} aria-label="Nueva conversación" title="Nueva conversación" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"><RotateCcw size={19}/></button>
        </div>
        <div className="flex h-[560px] flex-col overflow-y-auto px-3 py-4 sm:px-4"
          style={{ backgroundColor: '#e8e3d9', backgroundImage: 'radial-gradient(#d4cdc2 0.65px, transparent 0.65px)', backgroundSize: '18px 18px' }} aria-live="polite">
          <p className="mx-auto mb-4 rounded-lg bg-[#fff6d8] px-3 py-2 text-center text-[11px] leading-4 text-amber-900 shadow-sm">SIMULACIÓN, no WhatsApp oficial. Usa datos inventados. No compartas DNI, teléfono ni documentos.</p>
          <div className="mx-auto mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] text-slate-600">Hoy · Conversación de demostración</div>
          {mensajes.length === 0 && <div className="space-y-3">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 shadow-sm">
              ¡Hola! Soy el asistente de Kaluz. No necesitas saber de tecnología ni de trámites. Dime qué quieres hacer y te ayudaré paso a paso.
              <span className="mt-1 block text-right text-[10px] text-slate-400">{fechaHora}</span>
            </div>
            {!perfil ? <div className="grid grid-cols-2 gap-2">
              <button type="button" className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-2 text-sm font-bold text-[#086b59] shadow-sm hover:bg-emerald-50" onClick={() => setPerfil('conductor')}><CarFront size={19}/> Soy conductor</button>
              <button type="button" className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-2 text-sm font-bold text-[#086b59] shadow-sm hover:bg-emerald-50" onClick={() => setPerfil('cliente')}><UserRound size={19}/> Soy cliente</button>
            </div> : <div className="space-y-2">
              <button type="button" onClick={() => setPerfil(null)} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-white/85 px-3 text-xs font-semibold text-[#075e54]"><ArrowLeft size={14}/> Volver a elegir</button>
              <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm">¡Perfecto! ¿Qué te gustaría hacer?</div>
              <div className="grid gap-2">{opciones.map(op => <button key={op.titulo} type="button" disabled={enviando} onClick={() => elegir(op)} className="flex min-h-11 items-center justify-between rounded-xl border border-emerald-200 bg-[#f6fff8] px-3 py-2.5 text-left text-sm font-semibold text-[#086b59] shadow-sm hover:bg-[#e2f8ea] disabled:opacity-50">{op.titulo}<ArrowRight size={16}/></button>)}</div>
            </div>}
          </div>}

          <div className="space-y-3">{mensajes.map((m, i) => <div key={`${i}-${m.rol}`} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-sm leading-6 shadow-sm ${m.rol === 'usuario' ? 'rounded-tr-sm bg-[#d9fdd3] text-slate-900' : 'rounded-tl-sm bg-white text-slate-800'}`}>
              {m.texto}<span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">{fechaHora}{m.rol === 'usuario' ? <CheckCheck size={13} className="text-[#53a3ca]"/> : <Check size={11}/>}</span>
            </div>
          </div>)}</div>
          {enviando && <div role="status" className="mt-3 flex max-w-fit items-center gap-2 rounded-xl rounded-tl-sm bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"><Clock3 size={15}/> Kaluz IA está escribiendo...</div>}
          {recomendados.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{recomendados.map(s => <button key={s} type="button" onClick={() => void enviar(s)} className="rounded-full border border-[#94ceba] bg-white px-3 py-2 text-left text-xs font-semibold text-[#076450] shadow-sm hover:bg-emerald-50">{s}</button>)}</div>}
          {borrador && !codigoGuardado && <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-3 text-xs leading-5 shadow-sm"><p className="mb-2 font-bold text-[#075e54]">¡Ya tengo los datos básicos de tu solicitud!</p><p className="mb-3 text-slate-600">Puedes enviarla escribiendo «Sí, envíala» o pulsando el botón. Se guardará como pendiente para revisión humana.</p><button type="button" onClick={guardar} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#087e64] px-3 font-bold text-white hover:bg-[#075e54]"><Send size={15}/> Enviar mis datos a Kaluz</button></div>}
          {codigoGuardado && <Link to="/admin/solicitudes" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-[#075e54] shadow-sm"><ClipboardCheck size={16}/> Ver solicitud en el panel del dueño</Link>}
          <div ref={fin}/>
        </div>
        {error && <div role="alert" className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>}
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-slate-200 bg-[#f4f5f5] px-3 py-3">
          <label className="min-w-0 flex-1"><span className="sr-only">Escribe un mensaje</span><textarea ref={inputRef} rows={1} maxLength={1500} value={entrada} onChange={e => setEntrada(e.target.value)} onKeyDown={teclado} disabled={enviando || Boolean(codigoGuardado)} placeholder="Escribe tu mensaje..." className="max-h-28 min-h-11 w-full resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600 disabled:opacity-60" /></label>
          <button type="submit" aria-label="Enviar mensaje" disabled={!entrada.trim() || enviando || Boolean(codigoGuardado)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#00896b] text-white hover:bg-[#066f5b] disabled:opacity-40"><Send size={18}/></button>
        </form>
        <div className="bg-[#f4f5f5] pb-2 text-center text-[10px] text-slate-500">Chat simulado con IA real · No asociado a WhatsApp oficial</div>
      </section>

      <aside className="space-y-4" aria-label="Resultado de la inteligencia artificial">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#102f53]"><Sparkles size={20} className="text-[#087e64]"/> Lo que hace Gemini</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-slate-50 p-2"><MessageCircle className="mx-auto mb-2 text-[#087e64]" size={21}/><p>Conversa</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><Bot className="mx-auto mb-2 text-[#087e64]" size={21}/><p>Organiza datos</p></div>
            <div className="rounded-xl bg-slate-50 p-2"><ClipboardCheck className="mx-auto mb-2 text-[#087e64]" size={21}/><p>Prepara ficha</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-600">El usuario habla como acostumbra. El agente identifica el trámite y prepara el borrador; el dueño conserva la decisión final.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#102f53]"><FileText size={19}/> Ficha que recibe el dueño</h2>
          {!estado ? <p className="mt-3 text-sm text-slate-500">Inicia una conversación. Aquí aparecerán los datos extraídos por Gemini en tiempo real.</p> : <div className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500">Nombre</p><p className="font-semibold">{estado.datos.nombre || 'Por indicar'}</p></div><div><p className="text-xs text-slate-500">Servicio</p><p className="font-semibold capitalize">{flujo || estado.intencion}</p></div></div>
            <div className="border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Vehículo o destino</p><p className="font-semibold">{estado.datos.vehiculo || estado.datos.destino || 'Por indicar'}</p></div>
            <div><p className="text-xs text-slate-500">Zonas de trabajo</p><p>{estado.datos.zonas.join(', ') || 'Por indicar'}</p></div>
            <div><p className="text-xs text-slate-500">Disponibilidad / fecha</p><p>{[estado.datos.disponibilidad_dias, estado.datos.disponibilidad_turno, estado.datos.fecha].filter(Boolean).join(' · ') || 'Por indicar'}</p></div>
            <div><p className="text-xs text-slate-500">Resumen</p><p className="leading-5 text-slate-700">{estado.resumen}</p></div>
            {faltantes.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><Info size={14} className="mr-1 inline"/> Para completar: {faltantes.join(', ')}.</p>}
            {flujo === 'taxi' && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Taxi puede consultarse, pero el panel aún no tiene categoría propia para guardar su solicitud.</p>}
            {flujo === 'requisitos' && <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">Esta es una orientación; no crea trámite sin que el usuario lo solicite.</p>}
            {borrador && !codigoGuardado && <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 size={16} className="mr-1 inline"/> Datos mínimos completos. El usuario puede enviar el borrador desde el chat.</div>}
            {codigoGuardado && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 size={18}/> Guardado: {codigoGuardado}</p><p className="mt-1 text-xs text-emerald-900">Estado pendiente. Solo en este navegador de demostración.</p><Link className="mt-2 inline-block text-xs font-bold text-emerald-800 underline" to="/admin/solicitudes">Abrir solicitudes del dueño →</Link></div>}
          </div>}
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><h3 className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck size={17}/> Alcance de la demo</h3>La conversación sí utiliza Gemini cuando el servidor local está encendido. WhatsApp real y Supabase aún no están conectados. Las solicitudes se guardan en <code>localStorage</code> y únicamente serán visibles en el mismo origen de este navegador. No uses datos personales reales.</section>
      </aside>
    </div>
  </main>
}
