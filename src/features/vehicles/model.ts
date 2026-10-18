import type { Affiliate } from '../affiliates/types.ts'
import type { Driver } from '../drivers/types.ts'
import { validDate } from '../affiliates/model.ts'
import type { Maintenance, VehicleFormValues, VehicleRecord, VehicleStatus, VehicleView } from './types.ts'

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const statusLabels: Record<VehicleStatus, string> = { operacion: 'En operación', mantenimiento: 'En mantenimiento', por_aprobar: 'Por aprobar', inactivo: 'Inactivo' }
export function fleet(records: VehicleRecord[], affiliates: Affiliate[]): VehicleView[] {
  const affiliated = affiliates.map(a => {
    const record = records.find(r => r.origin === 'afiliado' && r.affiliateId === a.id)
    return { ...(record ?? { id: `afiliado:${a.id}`, origin: 'afiliado' as const, affiliateId: a.id, ownInfo: null, status: a.status === 'activo' ? 'operacion' as const : 'por_aprobar' as const, capacity: 4, maintenance: [], history: [] }), info: a.vehicle, owner: a.name }
  })
  return [...affiliated, ...records.filter(r => r.origin === 'propio' && r.ownInfo).map(r => ({ ...r, info: r.ownInfo!, owner: 'Kaluz' }))]
}
export function validateVehicle(v: VehicleFormValues, views: VehicleView[], drivers: Driver[], id?: string): Partial<Record<keyof VehicleFormValues, string>> {
  const errors: Partial<Record<keyof VehicleFormValues, string>> = {}
  if (v.origin === 'afiliado' && !v.affiliateId) errors.affiliateId = 'Selecciona un afiliado.'
  if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(v.plate.toUpperCase())) errors.plate = 'Usa el formato ABC-123.'
  else if (views.some(view => view.id !== id && view.info.plate === v.plate.toUpperCase())) errors.plate = 'Esta placa ya está registrada.'
  if (!v.brand.trim()) errors.brand = 'Ingresa la marca.'
  if (!v.model.trim()) errors.model = 'Ingresa el modelo.'
  if (!/^\d{4}$/.test(v.year) || Number(v.year) < 1950 || Number(v.year) > new Date().getFullYear() + 1) errors.year = 'Ingresa un año válido.'
  if (!v.color.trim()) errors.color = 'Ingresa el color.'
  if (!/^\d{1,2}$/.test(v.capacity) || Number(v.capacity) < 1 || Number(v.capacity) > 60) errors.capacity = 'Ingresa una capacidad entre 1 y 60.'
  const previous = views.find(view => view.id === id)
  if (previous && previous.info.plate !== v.plate.toUpperCase() && drivers.some(d => d.vehiclePlate === previous.info.plate)) errors.plate = 'Desasigna el conductor antes de cambiar la placa.'
  return errors
}
export function saveVehicle(v: VehicleFormValues, previous?: VehicleView): VehicleRecord {
  const now = new Date().toISOString()
  return { id: previous?.id ?? uid(), origin: v.origin, affiliateId: v.origin === 'afiliado' ? v.affiliateId : '', ownInfo: v.origin === 'propio' ? { plate: v.plate.toUpperCase(), brand: v.brand.trim(), model: v.model.trim(), year: v.year, color: v.color.trim() } : null, status: v.status, capacity: Number(v.capacity), maintenance: previous?.maintenance ?? [], history: [{ id: uid(), date: now, description: previous ? 'Vehículo actualizado.' : 'Vehículo registrado.' }, ...(previous?.history ?? [])] }
}
export function addMaintenance(view: VehicleView, date: string, description: string): VehicleRecord {
  if (!validDate(date) || description.trim().length < 3) throw new Error('Ingresa una fecha válida y una descripción de al menos tres caracteres.')
  const item: Maintenance = { id: uid(), date, description: description.trim() }
  return { id: view.id, origin: view.origin, affiliateId: view.affiliateId, ownInfo: view.ownInfo, status: view.status, capacity: view.capacity, maintenance: [item, ...view.maintenance], history: [{ id: uid(), date: new Date().toISOString(), description: `Mantenimiento registrado: ${item.description}` }, ...view.history] }
}
export function isVehicleRecord(input: unknown): input is VehicleRecord {
  if (!input || typeof input !== 'object') return false
  const v = input as VehicleRecord
  if (typeof v.id !== 'string' || typeof v.affiliateId !== 'string' || !['afiliado', 'propio'].includes(v.origin) || !['operacion', 'mantenimiento', 'por_aprobar', 'inactivo'].includes(v.status) || !Number.isInteger(v.capacity) || v.capacity < 1 || v.capacity > 60) return false
  if (v.origin === 'afiliado' ? !v.affiliateId || v.ownInfo !== null : !v.ownInfo || !['plate', 'brand', 'model', 'year', 'color'].every(k => typeof (v.ownInfo as unknown as Record<string, unknown>)[k] === 'string')) return false
  const validEntry = (item: Maintenance) => item && typeof item.id === 'string' && typeof item.date === 'string' && !Number.isNaN(Date.parse(item.date)) && typeof item.description === 'string'
  return Array.isArray(v.maintenance) && v.maintenance.every(validEntry) && Array.isArray(v.history) && v.history.every(validEntry)
}
