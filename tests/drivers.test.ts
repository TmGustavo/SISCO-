import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { demoDriverDraft } from '../src/features/ai/driverDraft.ts'
import { seedRequests } from '../src/features/solicitudes/storage.ts'
import { seedAffiliates } from '../src/features/affiliates/storage.ts'
import { prepareDriverApproval, storeDriverApproval } from '../src/features/drivers/approval.ts'
import { driverToForm, emptyDriver, saveDriver, validateDriver } from '../src/features/drivers/model.ts'
import { DRIVER_STORAGE_KEY, loadDrivers, saveDrivers, seedDrivers } from '../src/features/drivers/storage.ts'

const values = { ...emptyDriver(), name: 'Prueba Conductor', identity: '12345678', phone: '987654321', email: 'prueba@ejemplo.com', address: 'Av. Ejemplo 123', licenseNumber: 'Q12345678', licenseCategory: 'A-IIb', licenseIssuedAt: '2023-01-01', licenseExpiresAt: '2030-01-01', experienceYears: '4' }

test('valida conductor, solicitud y asignaciones sin duplicados', () => {
  const drivers = seedDrivers(), requests = seedRequests(), plates = seedAffiliates().map(a => a.vehicle.plate)
  assert.deepEqual(validateDriver(values, drivers, plates, requests), {})
  const invalid = validateDriver({ ...values, identity: drivers[0].identity, licenseNumber: drivers[0].licenseNumber, vehiclePlate: 'WAR-732', licenseExpiresAt: '2020-02-30', requestId: 'SOL-1002' }, drivers, plates, requests)
  for (const key of ['identity', 'licenseNumber', 'vehiclePlate', 'licenseExpiresAt', 'requestId']) assert.ok(invalid[key as keyof typeof invalid])
  assert.ok(validateDriver({ ...values, vehiclePlate: 'NO-EXISTE' }, drivers, plates, requests).vehiclePlate)
  assert.deepEqual(validateDriver(driverToForm(drivers[0]), drivers, plates, requests, drivers[0].id), {})
})

test('borrador simulado solo extrae etiquetas y exige posterior guardado', async () => {
  const result = await demoDriverDraft.createDraft('Nombre: Ana Prueba\nDNI: 12345678; Teléfono: 987654321\nCategoría: A-IIb')
  assert.equal(result.source, 'simulada')
  assert.equal(result.fields.name, 'Ana Prueba')
  assert.equal(result.fields.identity, '12345678')
  assert.equal(result.fields.phone, '987654321')
  assert.ok(result.notes[0].includes('Revisa'))
  assert.deepEqual((await demoDriverDraft.createDraft('Texto sin etiquetas')).fields, {})
})

test('aprueba postulación vinculada y registra historial sin mutar el original', () => {
  const drivers = seedDrivers(), requests = seedRequests(), plates = seedAffiliates().map(a => a.vehicle.plate)
  const result = prepareDriverApproval(drivers[0].id, drivers, requests, plates)
  assert.equal(result.driver.status, 'activo')
  assert.equal(result.requests.find(r => r.id === 'SOL-1002')?.status, 'aprobada')
  assert.equal(drivers[0].status, 'en_proceso')
  assert.equal(result.driver.history.length, 2)
  assert.throws(() => prepareDriverApproval(drivers[0].id, drivers, requests.map(r => r.id === 'SOL-1002' ? { ...r, status: 'rechazada' } : r), plates), /rechazada/)
})

test('persiste cambios y revierte la ficha cuando falla guardar la solicitud', () => {
  const map = new Map<string, string>()
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value) }, removeItem: (key: string) => { map.delete(key) } }
  const d = saveDriver(values)
  assert.equal(saveDrivers(storage, [d]), true)
  assert.deepEqual(loadDrivers(storage).drivers, [d])
  const old = map.get(DRIVER_STORAGE_KEY)
  const failing = { ...storage, setItem: (key: string, value: string) => { if (key === 'kaluz.solicitudes.v1') throw new Error('lleno'); map.set(key, value) } }
  assert.match(storeDriverApproval(failing, seedDrivers(), seedRequests()), /estado anterior/)
  assert.equal(map.get(DRIVER_STORAGE_KEY), old)
  map.set(DRIVER_STORAGE_KEY, '{mal')
  assert.ok(loadDrivers(storage).warning)
  assert.equal(map.get(DRIVER_STORAGE_KEY), '{mal')
})
