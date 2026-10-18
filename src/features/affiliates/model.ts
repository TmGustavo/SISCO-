import type { Solicitud } from '../solicitudes/types.ts'
import type { Affiliate, AffiliateFee, AffiliateFormValues, AffiliateStatus, FormErrors } from './types.ts'

export const statusLabels: Record<AffiliateStatus, string> = { activo: 'Activo', pendiente: 'Pendiente', suspendido: 'Suspendido' }
export const typeLabels = { propietario: 'Propietario', alquilado: 'Alquilado' } as const
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const money = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`
export const feePaid = (fee: AffiliateFee) => fee.payments?.length ? fee.payments.reduce((sum, payment) => sum + payment.amountCents, 0) : fee.paidAt ? fee.amountCents : 0
export const feeBalance = (fee: AffiliateFee) => Math.max(0, fee.amountCents - feePaid(fee))
export const debt = (affiliate: Affiliate, today = localDate()) => affiliate.fees.reduce((sum, fee) => sum + (fee.dueDate <= today ? feeBalance(fee) : 0), 0)
export const formatDate = (value: string) => value ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value)) : '—'
export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function emptyForm(): AffiliateFormValues {
  return { name: '', identity: '', email: '', phone: '', address: '', joinedAt: localDate(), type: 'propietario', status: 'pendiente', requestId: '', plate: '', brand: '', model: '', year: '', color: '', monthlyFee: '' }
}
export function toForm(a: Affiliate): AffiliateFormValues {
  return { name: a.name, identity: a.identity, email: a.email, phone: a.phone, address: a.address, joinedAt: a.joinedAt, type: a.type, status: a.status, requestId: a.requestId, ...a.vehicle, monthlyFee: (a.monthlyFeeCents / 100).toFixed(2) }
}
export function validateForm(v: AffiliateFormValues, affiliates: Affiliate[], requests: Solicitud[], id?: string): FormErrors {
  const errors: FormErrors = {}
  if (v.name.trim().length < 3) errors.name = 'Ingresa el nombre completo.'
  if (!/^\d{8}$/.test(v.identity)) errors.identity = 'El DNI debe tener 8 dígitos.'
  else if (affiliates.some(a => a.id !== id && a.identity === v.identity)) errors.identity = 'Este DNI ya está registrado.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Ingresa un correo válido.'
  if (!/^\d{9}$/.test(v.phone.replace(/\s/g, ''))) errors.phone = 'Ingresa un teléfono de 9 dígitos.'
  if (v.address.trim().length < 4) errors.address = 'Ingresa una dirección.'
  if (!validDate(v.joinedAt) || v.joinedAt > localDate()) errors.joinedAt = 'Ingresa una fecha válida que no sea futura.'
  if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(v.plate.trim().toUpperCase())) errors.plate = 'Usa el formato ABC-123.'
  else if (affiliates.some(a => a.id !== id && a.vehicle.plate === v.plate.trim().toUpperCase())) errors.plate = 'Esta placa ya está registrada.'
  if (!v.brand.trim()) errors.brand = 'Ingresa la marca.'
  if (!v.model.trim()) errors.model = 'Ingresa el modelo.'
  if (!/^\d{4}$/.test(v.year) || Number(v.year) < 1950 || Number(v.year) > new Date().getFullYear() + 1) errors.year = 'Ingresa un año válido.'
  if (!v.color.trim()) errors.color = 'Ingresa el color.'
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(v.monthlyFee) || Number(v.monthlyFee) <= 0) errors.monthlyFee = 'Ingresa un importe válido mayor a cero.'
  if (v.requestId) {
    const request = requests.find(r => r.id === v.requestId && r.type === 'afiliacion')
    if (!request || request.identity !== v.identity) errors.requestId = 'La solicitud debe existir y tener el mismo DNI.'
    else if (affiliates.some(a => a.id !== id && a.requestId === v.requestId)) errors.requestId = 'La solicitud ya está vinculada a otro afiliado.'
  }
  return errors
}
const history = (description: string, date = new Date()) => ({ id: uid(), date: date.toISOString(), description })
export function saveAffiliate(v: AffiliateFormValues, previous?: Affiliate, now = new Date()): Affiliate {
  const base = { name: v.name.trim(), identity: v.identity, email: v.email.trim(), phone: v.phone.trim(), address: v.address.trim(), joinedAt: v.joinedAt, type: v.type, status: v.status, requestId: v.requestId, vehicle: { plate: v.plate.trim().toUpperCase(), brand: v.brand.trim(), model: v.model.trim(), year: v.year, color: v.color.trim() }, monthlyFeeCents: Math.round(Number(v.monthlyFee) * 100) }
  return { ...base, id: previous?.id ?? uid(), fees: previous?.fees ?? [], history: [history(previous ? `Ficha actualizada. Estado: ${statusLabels[v.status]}.` : 'Afiliado registrado.', now), ...(previous?.history ?? [])] }
}
export function changeStatus(a: Affiliate, status: AffiliateStatus, now = new Date()): Affiliate {
  return { ...a, status, history: [history(`Estado cambiado a ${statusLabels[status]}.`, now), ...a.history] }
}
export function addFee(a: Affiliate, period: string, dueDate: string, amountCents: number, now = new Date()): Affiliate {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !validDate(dueDate) || !Number.isSafeInteger(amountCents) || amountCents <= 0 || a.fees.some(f => f.period === period)) throw new Error('La cuota debe tener un periodo único, vencimiento válido e importe mayor a cero.')
  const fee: AffiliateFee = { id: uid(), period, dueDate, amountCents, paidAt: null }
  return { ...a, fees: [...a.fees, fee], history: [history(`Cuota ${period} registrada por ${money(amountCents)}.`, now), ...a.history] }
}
export function payFee(a: Affiliate, id: string, now = new Date()): Affiliate {
  const fee = a.fees.find(f => f.id === id)
  if (!fee || feeBalance(fee) <= 0) throw new Error('La cuota no existe o ya está pagada.')
  return payFeePartial(a, id, feeBalance(fee), 'No especificado', '', now)
}
export function payFeePartial(a: Affiliate, id: string, amountCents: number, method: string, reference: string, now = new Date()): Affiliate {
  const fee = a.fees.find(f => f.id === id)
  if (!fee || feeBalance(fee) <= 0) throw new Error('La cuota no existe o ya está pagada.')
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > feeBalance(fee)) throw new Error('El pago debe ser mayor a cero y no superar el saldo pendiente.')
  if (!method.trim()) throw new Error('Selecciona un método de pago.')
  const payment = { id: uid(), amountCents, paidAt: now.toISOString(), method: method.trim(), reference: reference.trim() }
  const paidAt = amountCents === feeBalance(fee) ? payment.paidAt : null
  return { ...a, fees: a.fees.map(f => f.id === id ? { ...f, paidAt, payments: [...(f.payments ?? []), payment] } : f), history: [history(`Pago de cuota ${fee.period}: ${money(amountCents)}.`, now), ...a.history] }
}
export function isAffiliate(value: unknown): value is Affiliate {
  if (!value || typeof value !== 'object') return false
  const a = value as Affiliate
  return ['id', 'name', 'identity', 'email', 'phone', 'address', 'joinedAt', 'requestId'].every(k => typeof (a as unknown as Record<string, unknown>)[k] === 'string') && validDate(a.joinedAt) && ['activo', 'pendiente', 'suspendido'].includes(a.status) && ['propietario', 'alquilado'].includes(a.type) && !!a.vehicle && ['plate', 'brand', 'model', 'year', 'color'].every(k => typeof (a.vehicle as unknown as Record<string, unknown>)[k] === 'string') && Number.isSafeInteger(a.monthlyFeeCents) && a.monthlyFeeCents > 0 && Array.isArray(a.fees) && a.fees.every(f => typeof f.id === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(f.period) && validDate(f.dueDate) && Number.isSafeInteger(f.amountCents) && f.amountCents > 0 && (f.paidAt === null || (typeof f.paidAt === 'string' && !Number.isNaN(Date.parse(f.paidAt)))) && (f.payments === undefined || (Array.isArray(f.payments) && f.payments.every(p => p && typeof p.id === 'string' && Number.isSafeInteger(p.amountCents) && p.amountCents > 0 && typeof p.paidAt === 'string' && !Number.isNaN(Date.parse(p.paidAt)) && typeof p.method === 'string' && typeof p.reference === 'string') && f.payments.reduce((sum, p) => sum + p.amountCents, 0) <= f.amountCents && (f.payments.length === 0 || (f.paidAt !== null) === (f.payments.reduce((sum, p) => sum + p.amountCents, 0) === f.amountCents))))) && Array.isArray(a.history) && a.history.every(h => typeof h.id === 'string' && typeof h.description === 'string' && typeof h.date === 'string' && !Number.isNaN(Date.parse(h.date)))
}
