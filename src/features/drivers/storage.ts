import { emptyDriver, isDriver, saveDriver } from './model.ts'
import type { Driver, DriverFormValues } from './types.ts'

export const DRIVER_STORAGE_KEY = 'kaluz.conductores.v1'
export function seedDrivers(): Driver[] {
  const rows: Array<Partial<DriverFormValues>> = [
    { name: 'José Luis Pérez', identity: '42786190', phone: '986245781', email: 'jose.perez@ejemplo.com', licenseNumber: 'Q42786190', requestId: 'SOL-1002', status: 'en_proceso' },
    { name: 'Miguel Ángel Vega', identity: '41563208', phone: '972407113', email: 'miguel.vega@ejemplo.com', licenseNumber: 'Q41563208', requestId: 'SOL-1006', status: 'en_proceso' },
    { name: 'Carlos Mendoza Quispe', identity: '45217896', phone: '964532121', email: 'carlos.mendoza@ejemplo.com', licenseNumber: 'Q45217896', status: 'activo', availability: 'disponible', vehiclePlate: 'WAR-732' },
  ]
  return rows.map((row, i) => ({ ...saveDriver({ ...emptyDriver(), address: 'Av. Ejemplo 123, Huancayo', licenseCategory: 'A-IIb', licenseIssuedAt: '2023-01-01', licenseExpiresAt: '2030-01-01', experienceYears: '5', ...row }), id: `CON-${String(i + 1).padStart(3, '0')}` }))
}
export function loadDrivers(storage: Pick<Storage, 'getItem'>): { drivers: Driver[]; warning: string } {
  try { const raw = storage.getItem(DRIVER_STORAGE_KEY); if (raw === null) return { drivers: seedDrivers(), warning: '' }; const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed) || !parsed.every(isDriver)) throw new Error(); return { drivers: parsed, warning: '' } }
  catch { return { drivers: seedDrivers(), warning: 'No se pudieron leer los conductores guardados. Se protege el contenido almacenado hasta que sea revisado.' } }
}
export function saveDrivers(storage: Pick<Storage, 'setItem'>, drivers: Driver[]): boolean { try { storage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(drivers)); return true } catch { return false } }
