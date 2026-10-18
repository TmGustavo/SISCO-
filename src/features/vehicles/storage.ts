import { isVehicleRecord } from './model.ts'
import type { VehicleRecord } from './types.ts'
export const VEHICLE_STORAGE_KEY = 'kaluz.vehiculos.v1'
export function seedVehicles(): VehicleRecord[] {
  return [
    { id: 'KAL-001', origin: 'propio', affiliateId: '', ownInfo: { plate: 'KAL-001', brand: 'Toyota', model: 'Yaris', year: '2022', color: 'Blanco' }, status: 'operacion', capacity: 4, maintenance: [], history: [] },
    { id: 'KAL-002', origin: 'propio', affiliateId: '', ownInfo: { plate: 'KAL-002', brand: 'Hyundai', model: 'Accent', year: '2021', color: 'Plata' }, status: 'mantenimiento', capacity: 4, maintenance: [], history: [] },
  ]
}
export function loadVehicles(storage: Pick<Storage, 'getItem'>): { records: VehicleRecord[]; warning: string } {
  try { const raw = storage.getItem(VEHICLE_STORAGE_KEY); if (raw === null) return { records: seedVehicles(), warning: '' }; const parsed: unknown = JSON.parse(raw); if (!Array.isArray(parsed) || !parsed.every(isVehicleRecord)) throw new Error(); return { records: parsed, warning: '' } }
  catch { return { records: seedVehicles(), warning: 'No se pudieron leer los vehículos guardados. No se sobrescribirán los datos existentes.' } }
}
export function saveVehicles(storage: Pick<Storage, 'setItem'>, records: VehicleRecord[]): boolean { try { storage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(records)); return true } catch { return false } }
