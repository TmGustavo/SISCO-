import { createRequest, isRequest } from './model.ts'
import type { RequestFormValues, RequestStatus, Solicitud } from './types.ts'

export const STORAGE_KEY = 'kaluz.solicitudes.v1'

const examples: Array<RequestFormValues & { status: RequestStatus; daysAgo: number }> = [
  { type: 'afiliacion', name: 'María Fernanda Rojas', identity: '45871932', email: 'maria.rojas@ejemplo.com', phone: '987 654 321', reference: 'ABC-123', serviceDate: '', description: 'Solicitud de afiliación de vehículo.', status: 'pendiente', daysAgo: 0 },
  { type: 'conductores', name: 'José Luis Pérez', identity: '42786190', email: 'jose.perez@ejemplo.com', phone: '986 245 781', reference: 'Q42786190', serviceDate: '', description: 'Postulación como conductor.', status: 'en_revision', daysAgo: 1 },
  { type: 'alquileres', name: 'Ana Lucía Torres', identity: '71903524', email: 'ana.torres@ejemplo.com', phone: '975 431 820', reference: 'Camioneta para viaje', serviceDate: '2027-01-20', description: 'Alquiler por tres días.', status: 'pendiente', daysAgo: 2 },
  { type: 'turismo', name: 'Carlos Mendoza', identity: '40316285', email: 'carlos.mendoza@ejemplo.com', phone: '991 320 547', reference: 'Valle Sagrado', serviceDate: '2027-02-15', description: 'Viaje para cuatro pasajeros.', status: 'aprobada', daysAgo: 3 },
  { type: 'afiliacion', name: 'Rosa Elena Quispe', identity: '46832195', email: 'rosa.quispe@ejemplo.com', phone: '989 225 630', reference: 'BDF-452', serviceDate: '', description: 'Afiliación de unidad.', status: 'observada', daysAgo: 4 },
  { type: 'conductores', name: 'Miguel Ángel Vega', identity: '41563208', email: 'miguel.vega@ejemplo.com', phone: '972 407 113', reference: 'Q41563208', serviceDate: '', description: 'Postulación para servicios turísticos.', status: 'pendiente', daysAgo: 5 },
  { type: 'turismo', name: 'Lucía Fernández', identity: '70634215', email: 'lucia.fernandez@ejemplo.com', phone: '984 239 167', reference: 'Cusco', serviceDate: '2027-03-10', description: 'Consulta para viaje familiar.', status: 'en_revision', daysAgo: 6 },
  { type: 'alquileres', name: 'Diego Ramírez', identity: '45209671', email: 'diego.ramirez@ejemplo.com', phone: '976 208 014', reference: 'Miniván', serviceDate: '2027-02-02', description: 'Alquiler de unidad para traslado.', status: 'rechazada', daysAgo: 7 },
]

export function seedRequests(now = new Date()): Solicitud[] {
  return examples.map(({ status, daysAgo, ...values }, index) => {
    const date = new Date(now.getTime() - daysAgo * 86_400_000)
    const request = createRequest(values, date)
    return { ...request, id: `SOL-${String(1001 + index)}`, status, documents: request.documents.map((doc, docIndex) => ({ ...doc, received: docIndex === 0 || (status === 'aprobada' && docIndex > 0) })), requirements: request.requirements.map((req) => ({ ...req, checked: status === 'aprobada' })), history: status === 'pendiente' ? request.history : [{ id: `history-${index}`, date: date.toISOString(), description: `Estado inicial: ${status.replace('_', ' ')}` }, ...request.history] }
  })
}

export function loadRequests(storage: Pick<Storage, 'getItem'>): { requests: Solicitud[]; warning: string } {
  try {
    const saved = storage.getItem(STORAGE_KEY)
    if (saved === null) return { requests: seedRequests(), warning: '' }
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed) || !parsed.every(isRequest)) throw new Error('Invalid data')
    return { requests: parsed, warning: '' }
  } catch {
    return { requests: seedRequests(), warning: 'No se pudieron leer los datos locales. Se muestran datos de ejemplo; revisa el almacenamiento del navegador.' }
  }
}

export function saveRequests(storage: Pick<Storage, 'setItem'>, requests: Solicitud[]): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(requests)); return true } catch { return false }
}
