import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { seedAffiliates } from '../src/features/affiliates/storage.ts'
import { seedDrivers } from '../src/features/drivers/storage.ts'
import { addMaintenance, fleet, isVehicleRecord, saveVehicle, validateVehicle } from '../src/features/vehicles/model.ts'
import { loadVehicles, saveVehicles, seedVehicles, VEHICLE_STORAGE_KEY } from '../src/features/vehicles/storage.ts'
import type { VehicleFormValues } from '../src/features/vehicles/types.ts'

const values: VehicleFormValues = { plate: 'XYZ-999', brand: 'Kia', model: 'Soluto', year: '2020', color: 'Blanco', origin: 'propio', affiliateId: '', status: 'operacion', capacity: '4' }
test('la flota deriva los vehículos afiliados de la ficha y suma los propios', () => {
  const affiliates = seedAffiliates(), records = seedVehicles(), views = fleet(records, affiliates)
  assert.equal(views.length, affiliates.length + records.length)
  assert.equal(views.find(v => v.affiliateId === affiliates[0].id)?.info.plate, affiliates[0].vehicle.plate)
  const changed = affiliates.map((a, i) => i === 0 ? { ...a, vehicle: { ...a.vehicle, model: 'Nuevo modelo' } } : a)
  assert.equal(fleet(records, changed).find(v => v.affiliateId === affiliates[0].id)?.info.model, 'Nuevo modelo')
})
test('valida placas duplicadas y bloquea cambios con conductor asignado', () => {
  const views = fleet(seedVehicles(), seedAffiliates()), drivers = seedDrivers()
  assert.deepEqual(validateVehicle(values, views, drivers), {})
  assert.ok(validateVehicle({ ...values, plate: 'WAR-732' }, views, drivers).plate)
  const assigned = views.find(v => v.info.plate === 'WAR-732')!
  assert.match(validateVehicle({ ...values, origin: 'afiliado', affiliateId: assigned.affiliateId }, views, drivers, assigned.id).plate!, /Desasigna/)
  assert.ok(validateVehicle({ ...values, capacity: '0', year: '1800' }, views, drivers).capacity)
})
test('registra mantenimiento y preserva historial y persistencia', () => {
  const record = saveVehicle(values)
  const view = fleet([record], [])[0]
  const changed = addMaintenance(view, '2025-01-15', 'Cambio de filtros')
  assert.equal(changed.maintenance.length, 1)
  assert.equal(changed.history.length, 2)
  assert.equal(isVehicleRecord(changed), true)
  assert.throws(() => addMaintenance(view, '2025-02-30', 'x'))
  const map = new Map<string, string>()
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value) } }
  assert.equal(saveVehicles(storage, [changed]), true)
  assert.deepEqual(loadVehicles(storage).records, [changed])
  map.set(VEHICLE_STORAGE_KEY, '{mal'); assert.ok(loadVehicles(storage).warning); assert.equal(map.get(VEHICLE_STORAGE_KEY), '{mal')
})
