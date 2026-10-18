import { validDate } from '../affiliates/model.ts'
import type { Driver } from '../drivers/types.ts'
import type { VehicleView } from '../vehicles/types.ts'
import type { Rental, RentalStatus, RentalValues } from './types.ts'
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const statusLabels: Record<RentalStatus, string> = { reservado: 'Reservado', en_curso: 'En curso', finalizado: 'Finalizado', cancelado: 'Cancelado' }
export const rentalPaid = (rental: Rental) => rental.payments.reduce((sum, p) => sum + p.amountCents, 0)
export const rentalBalance = (rental: Rental) => Math.max(0, rental.totalCents - rentalPaid(rental))
export const activeRental = (rental: Rental) => rental.status === 'reservado' || rental.status === 'en_curso'
export const intervalsOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart <= bEnd && bStart <= aEnd
export function validateRental(v: RentalValues, rentals: Rental[], vehicles: VehicleView[], drivers: Driver[], id?: string): string[] {
  const errors: string[] = []; const vehicle = vehicles.find(item => item.id === v.vehicleId)
  if (!vehicle || vehicle.origin !== 'propio' || vehicle.status !== 'operacion') errors.push('Selecciona un vehículo propio en operación.')
  else if (drivers.some(d => d.vehiclePlate === vehicle.info.plate)) errors.push('Desasigna el conductor antes de alquilar este vehículo.')
  if (v.client.trim().length < 3) errors.push('Ingresa el nombre del cliente.')
  if (!/^\d{9}$/.test(v.phone.replace(/\s/g, ''))) errors.push('Ingresa un teléfono de 9 dígitos.')
  if (v.destination.trim().length < 3) errors.push('Ingresa el destino o uso.')
  if (!validDate(v.start) || !validDate(v.end) || v.end < v.start) errors.push('Ingresa fechas válidas; la devolución no puede preceder al inicio.')
  else if (rentals.some(r => r.id !== id && r.vehicleId === v.vehicleId && activeRental(r) && intervalsOverlap(v.start, v.end, r.start, r.end))) errors.push('El vehículo ya tiene un alquiler reservado o en curso durante esas fechas.')
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(v.total) || Number(v.total) <= 0) errors.push('Ingresa un importe válido mayor a cero.')
  return errors
}
export function createRental(v: RentalValues, now = new Date()): Rental { return { id: uid(), vehicleId: v.vehicleId, client: v.client.trim(), phone: v.phone.trim(), destination: v.destination.trim(), start: v.start, end: v.end, totalCents: Math.round(Number(v.total) * 100), status: 'reservado', payments: [], history: [{ id: uid(), date: now.toISOString(), description: 'Alquiler registrado.' }] } }
export function changeRentalStatus(r: Rental, next: RentalStatus, now = new Date()): Rental {
  if (!(r.status === 'reservado' && (next === 'en_curso' || next === 'cancelado') || r.status === 'en_curso' && next === 'finalizado')) throw new Error('La transición de estado no está permitida.')
  if (next === 'cancelado' && rentalPaid(r) > 0) throw new Error('El alquiler tiene pagos registrados; concílialos antes de cancelar.')
  return { ...r, status: next, history: [{ id: uid(), date: now.toISOString(), description: `Estado: ${statusLabels[next]}.` }, ...r.history] }
}
export function payRental(r: Rental, amountCents: number, method: string, reference: string, now = new Date()): Rental {
  if (r.status === 'cancelado') throw new Error('No se pueden registrar pagos en un alquiler cancelado.')
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > rentalBalance(r)) throw new Error('El pago debe ser mayor a cero y no superar el saldo pendiente.')
  if (!method.trim()) throw new Error('Selecciona un método de pago.')
  const payment = { id: uid(), amountCents, paidAt: now.toISOString(), method: method.trim(), reference: reference.trim() }
  return { ...r, payments: [...r.payments, payment], history: [{ id: uid(), date: now.toISOString(), description: `Pago registrado: S/ ${(amountCents / 100).toFixed(2)}.` }, ...r.history] }
}
export function isRental(input: unknown): input is Rental {
  if (!input || typeof input !== 'object') return false
  const r = input as Rental
  return ['id', 'vehicleId', 'client', 'phone', 'destination'].every(k => typeof (r as unknown as Record<string, unknown>)[k] === 'string') && validDate(r.start) && validDate(r.end) && r.end >= r.start && Number.isSafeInteger(r.totalCents) && r.totalCents > 0 && ['reservado', 'en_curso', 'finalizado', 'cancelado'].includes(r.status) && Array.isArray(r.payments) && r.payments.every(p => p && typeof p.id === 'string' && Number.isSafeInteger(p.amountCents) && p.amountCents > 0 && typeof p.paidAt === 'string' && !Number.isNaN(Date.parse(p.paidAt)) && typeof p.method === 'string' && typeof p.reference === 'string') && rentalPaid(r) <= r.totalCents && Array.isArray(r.history) && r.history.every(h => h && typeof h.id === 'string' && typeof h.date === 'string' && !Number.isNaN(Date.parse(h.date)) && typeof h.description === 'string')
}
