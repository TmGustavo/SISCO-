import { requestStatuses, requestTypes } from './types.ts'
import type { FormErrors, RequestAction, RequestDocument, RequestFormValues, RequestRequirement, RequestStatus, RequestType, Solicitud } from './types.ts'

export const typeLabels: Record<RequestType, string> = {
  afiliacion: 'Afiliación', conductores: 'Conductores', alquileres: 'Alquileres', turismo: 'Turismo',
}

export const statusLabels: Record<RequestStatus, string> = {
  pendiente: 'Pendiente', en_revision: 'En revisión', aprobada: 'Aprobada', observada: 'Observada', rechazada: 'Rechazada',
}

export const referenceLabels: Record<RequestType, string> = {
  afiliacion: 'Placa del vehículo', conductores: 'Número de licencia', alquileres: 'Vehículo o servicio solicitado', turismo: 'Destino del viaje',
}

const templates: Record<RequestType, { documents: string[]; requirements: string[] }> = {
  afiliacion: { documents: ['Documento de identidad', 'Tarjeta de propiedad', 'SOAT vigente'], requirements: ['Datos de contacto verificados', 'Vehículo apto para afiliación'] },
  conductores: { documents: ['Documento de identidad', 'Licencia de conducir', 'Certificado de antecedentes'], requirements: ['Licencia vigente', 'Experiencia verificada'] },
  alquileres: { documents: ['Documento de identidad', 'Licencia de conducir'], requirements: ['Disponibilidad confirmada', 'Condiciones de alquiler revisadas'] },
  turismo: { documents: ['Documento de identidad', 'Datos de pasajeros'], requirements: ['Disponibilidad confirmada', 'Itinerario revisado'] },
}

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function newChecklist(type: RequestType): { documents: RequestDocument[]; requirements: RequestRequirement[] } {
  return {
    documents: templates[type].documents.map((name, index) => ({ id: `doc-${index}`, name, received: false })),
    requirements: templates[type].requirements.map((name, index) => ({ id: `req-${index}`, name, checked: false })),
  }
}

export function validateRequest(values: RequestFormValues): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim().length < 3) errors.name = 'Ingresa un nombre de al menos 3 caracteres.'
  if (!/^[a-zA-Z0-9-]{6,15}$/.test(values.identity.trim())) errors.identity = 'Ingresa un documento válido (6 a 15 letras o números).'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Ingresa un correo válido.'
  if (!/^[+\d\s()-]{7,20}$/.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7) errors.phone = 'Ingresa un teléfono válido.'
  if (values.reference.trim().length < 2) errors.reference = 'Completa este campo.'
  if (values.type === 'alquileres' || values.type === 'turismo') {
    const date = new Date(`${values.serviceDate}T12:00:00`)
    const [year, month, day] = values.serviceDate.split('-').map(Number)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.serviceDate) || Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) errors.serviceDate = 'Selecciona una fecha válida.'
  }
  return errors
}

export function createRequest(values: RequestFormValues, now = new Date()): Solicitud {
  const checklist = newChecklist(values.type)
  return {
    id: `SOL-${makeId().replaceAll('-', '').slice(0, 10).toUpperCase()}`, type: values.type, status: 'pendiente', name: values.name.trim(), identity: values.identity.trim(),
    email: values.email.trim(), phone: values.phone.trim(), reference: values.reference.trim(),
    serviceDate: values.serviceDate, description: values.description.trim(), createdAt: now.toISOString(), ...checklist,
    history: [{ id: makeId(), date: now.toISOString(), description: 'Solicitud registrada' }],
  }
}

const actions: Record<RequestAction, { status: RequestStatus; description: string }> = {
  revisar: { status: 'en_revision', description: 'Solicitud puesta en revisión' },
  aprobar: { status: 'aprobada', description: 'Solicitud aprobada' },
  observar: { status: 'observada', description: 'Solicitud observada' },
  rechazar: { status: 'rechazada', description: 'Solicitud rechazada' },
}

export function applyAction(request: Solicitud, action: RequestAction, note = '', now = new Date()): Solicitud {
  if ((action === 'observar' || action === 'rechazar') && !note.trim()) throw new Error('Escribe un motivo para continuar.')
  return { ...request, status: actions[action].status, history: [{ id: makeId(), date: now.toISOString(), description: actions[action].description, ...(note.trim() ? { note: note.trim() } : {}) }, ...request.history] }
}

export function getStats(requests: Solicitud[]) {
  return {
    total: requests.length,
    pending: requests.filter((item) => item.status === 'pendiente').length,
    review: requests.filter((item) => item.status === 'en_revision').length,
    approved: requests.filter((item) => item.status === 'aprobada').length,
    byType: Object.fromEntries(requestTypes.map((type) => [type, requests.filter((item) => item.type === type).length])) as Record<RequestType, number>,
  }
}

export function filterRequests(requests: Solicitud[], query: string, type: RequestType | 'todos', status: RequestStatus | 'todos'): Solicitud[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es')
  const needle = normalize(query.trim())
  return requests.filter((item) => (type === 'todos' || item.type === type) && (status === 'todos' || item.status === status) && (!needle || [item.name, item.identity, item.email, item.phone, item.reference, item.id].some((value) => normalize(value).includes(needle))))
}

export function isRequest(value: unknown): value is Solicitud {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const textFields = ['id', 'name', 'identity', 'email', 'phone', 'reference', 'serviceDate', 'description', 'createdAt']
  if (!textFields.every((field) => typeof item[field] === 'string') || !requestTypes.includes(item.type as RequestType) || !requestStatuses.includes(item.status as RequestStatus)) return false
  if (!Array.isArray(item.documents) || !Array.isArray(item.requirements) || !Array.isArray(item.history)) return false
  return item.documents.every((doc: unknown) => !!doc && typeof doc === 'object' && typeof (doc as RequestDocument).id === 'string' && typeof (doc as RequestDocument).name === 'string' && typeof (doc as RequestDocument).received === 'boolean' && ((doc as RequestDocument).fileName === undefined || typeof (doc as RequestDocument).fileName === 'string') && ((doc as RequestDocument).dataUrl === undefined || typeof (doc as RequestDocument).dataUrl === 'string')) &&
    item.requirements.every((requirement: unknown) => !!requirement && typeof requirement === 'object' && typeof (requirement as RequestRequirement).id === 'string' && typeof (requirement as RequestRequirement).name === 'string' && typeof (requirement as RequestRequirement).checked === 'boolean') &&
    item.history.every((entry: unknown) => !!entry && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string' && typeof (entry as { date?: unknown }).date === 'string' && typeof (entry as { description?: unknown }).description === 'string' && ((entry as { note?: unknown }).note === undefined || typeof (entry as { note?: unknown }).note === 'string'))
}
