import type { Solicitud } from '../solicitudes/types.ts'
import { localDate, validDate } from '../affiliates/model.ts'
import type { Driver, DriverErrors, DriverFormValues, DriverStatus } from './types.ts'

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const statusLabels: Record<DriverStatus, string> = { activo: 'Activo', en_proceso: 'En proceso', observado: 'Con observación', inactivo: 'Inactivo' }
export const availabilityLabels = { disponible: 'Disponible', ocupado: 'Ocupado', fuera_linea: 'Fuera de línea' } as const
export function emptyDriver(): DriverFormValues { return { name: '', identity: '', phone: '', email: '', address: '', licenseNumber: '', licenseCategory: '', licenseIssuedAt: '', licenseExpiresAt: '', experienceYears: '', status: 'en_proceso', availability: 'fuera_linea', vehiclePlate: '', requestId: '' } }
export function driverToForm(driver: Driver): DriverFormValues { return { name: driver.name, identity: driver.identity, phone: driver.phone, email: driver.email, address: driver.address, licenseNumber: driver.licenseNumber, licenseCategory: driver.licenseCategory, licenseIssuedAt: driver.licenseIssuedAt, licenseExpiresAt: driver.licenseExpiresAt, experienceYears: String(driver.experienceYears), status: driver.status, availability: driver.availability, vehiclePlate: driver.vehiclePlate, requestId: driver.requestId } }
export function validateDriver(value: DriverFormValues, drivers: Driver[], plates: string[], requests: Solicitud[], id?: string): DriverErrors {
  const errors: DriverErrors = {}
  if (value.name.trim().length < 3) errors.name = 'Ingresa el nombre completo.'
  if (!/^\d{8}$/.test(value.identity)) errors.identity = 'El DNI debe tener 8 dígitos.'
  else if (drivers.some(d => d.id !== id && d.identity === value.identity)) errors.identity = 'Este DNI ya está registrado.'
  if (!/^\d{9}$/.test(value.phone.replace(/\s/g, ''))) errors.phone = 'Ingresa un teléfono de 9 dígitos.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) errors.email = 'Ingresa un correo válido.'
  if (value.address.trim().length < 4) errors.address = 'Ingresa una dirección.'
  if (value.licenseNumber.trim().length < 4) errors.licenseNumber = 'Ingresa un número de licencia.'
  else if (drivers.some(d => d.id !== id && d.licenseNumber.toUpperCase() === value.licenseNumber.trim().toUpperCase())) errors.licenseNumber = 'Esta licencia ya está registrada.'
  if (!value.licenseCategory.trim()) errors.licenseCategory = 'Ingresa la categoría.'
  if (!validDate(value.licenseIssuedAt) || value.licenseIssuedAt > localDate()) errors.licenseIssuedAt = 'Ingresa una fecha de emisión válida.'
  if (!validDate(value.licenseExpiresAt) || value.licenseExpiresAt < value.licenseIssuedAt) errors.licenseExpiresAt = 'La fecha debe ser válida y posterior a la emisión.'
  if (!/^\d{1,2}$/.test(value.experienceYears) || Number(value.experienceYears) > 80) errors.experienceYears = 'Ingresa años de experiencia entre 0 y 80.'
  if (value.vehiclePlate && !plates.includes(value.vehiclePlate)) errors.vehiclePlate = 'Selecciona un vehículo disponible en el padrón.'
  else if (value.vehiclePlate && drivers.some(d => d.id !== id && d.vehiclePlate === value.vehiclePlate)) errors.vehiclePlate = 'El vehículo ya está asignado a otro conductor.'
  if (value.requestId) {
    const request = requests.find(r => r.id === value.requestId && r.type === 'conductores')
    if (!request || request.identity !== value.identity) errors.requestId = 'La solicitud debe existir y coincidir con el DNI.'
    else if (drivers.some(d => d.id !== id && d.requestId === value.requestId)) errors.requestId = 'La solicitud ya está vinculada a otro conductor.'
  }
  return errors
}
export function saveDriver(value: DriverFormValues, previous?: Driver, now = new Date()): Driver {
  return { ...value, name: value.name.trim(), phone: value.phone.trim(), email: value.email.trim(), address: value.address.trim(), licenseNumber: value.licenseNumber.trim().toUpperCase(), licenseCategory: value.licenseCategory.trim().toUpperCase(), experienceYears: Number(value.experienceYears), id: previous?.id ?? uid(), history: [{ id: uid(), date: now.toISOString(), description: previous ? 'Ficha actualizada.' : 'Conductor registrado.' }, ...(previous?.history ?? [])] }
}
export function isDriver(input: unknown): input is Driver {
  if (!input || typeof input !== 'object') return false
  const d = input as Driver
  return ['id', 'name', 'identity', 'phone', 'email', 'address', 'licenseNumber', 'licenseCategory', 'licenseIssuedAt', 'licenseExpiresAt', 'vehiclePlate', 'requestId'].every(k => typeof (d as unknown as Record<string, unknown>)[k] === 'string') && validDate(d.licenseIssuedAt) && validDate(d.licenseExpiresAt) && Number.isInteger(d.experienceYears) && d.experienceYears >= 0 && d.experienceYears <= 80 && ['activo', 'en_proceso', 'observado', 'inactivo'].includes(d.status) && ['disponible', 'ocupado', 'fuera_linea'].includes(d.availability) && Array.isArray(d.history) && d.history.every(h => h && typeof h.id === 'string' && typeof h.description === 'string' && typeof h.date === 'string' && !Number.isNaN(Date.parse(h.date)))
}
