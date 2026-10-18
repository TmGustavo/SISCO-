import { applyAction } from '../solicitudes/model.ts'
import { STORAGE_KEY as REQUESTS_KEY } from '../solicitudes/storage.ts'
import type { Solicitud } from '../solicitudes/types.ts'
import { driverToForm, saveDriver, validateDriver } from './model.ts'
import { DRIVER_STORAGE_KEY } from './storage.ts'
import type { Driver } from './types.ts'

export function prepareDriverApproval(driverId: string, drivers: Driver[], requests: Solicitud[], plates: string[]) {
  const driver = drivers.find(d => d.id === driverId)
  const request = requests.find(r => r.id === driver?.requestId && r.identity === driver.identity && r.type === 'conductores')
  if (!driver || !request) throw new Error('La solicitud vinculada no está disponible o no coincide con el DNI.')
  if (request.status === 'rechazada') throw new Error('La solicitud está rechazada. Revisa su estado antes de continuar.')
  const values = { ...driverToForm(driver), status: 'activo' as const }
  if (Object.keys(validateDriver(values, drivers, plates, requests, driver.id)).length) throw new Error('Revisa los datos de la ficha y las asignaciones antes de aprobar.')
  const changed = saveDriver(values, driver)
  return { driver: changed, drivers: drivers.map(d => d.id === driver.id ? changed : d), requests: requests.map(r => r.id === request.id && r.status !== 'aprobada' ? applyAction(r, 'aprobar') : r) }
}
export function storeDriverApproval(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, drivers: Driver[], requests: Solicitud[]): string {
  let old: string | null
  try { old = storage.getItem(DRIVER_STORAGE_KEY); storage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(drivers)) } catch { return 'No se pudo guardar la ficha del conductor.' }
  try { storage.setItem(REQUESTS_KEY, JSON.stringify(requests)); return '' } catch {
    try { if (old === null) storage.removeItem(DRIVER_STORAGE_KEY); else storage.setItem(DRIVER_STORAGE_KEY, old) } catch { return 'No se pudo recuperar la ficha anterior. Revisa ambos módulos.' }
    return 'No se pudo guardar la solicitud; la ficha volvió a su estado anterior.'
  }
}
