import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { seedAffiliates } from '../src/features/affiliates/storage.ts'
import { seedDrivers } from '../src/features/drivers/storage.ts'
import { fleet } from '../src/features/vehicles/model.ts'
import { seedVehicles } from '../src/features/vehicles/storage.ts'
import { changeRentalStatus, createRental, intervalsOverlap, payRental, rentalBalance, validateRental } from '../src/features/rentals/model.ts'
import { loadRentals, RENTAL_STORAGE_KEY, saveRentals } from '../src/features/rentals/storage.ts'
import type { RentalValues } from '../src/features/rentals/types.ts'
const values: RentalValues = { vehicleId: 'KAL-001', client: 'Cliente Prueba', phone: '987654321', destination: 'Huancayo', start: '2027-01-10', end: '2027-01-12', total: '300.00' }
test('solo permite vehículos propios sin conductor y evita alquileres solapados', () => {
  const vehicles = fleet(seedVehicles(), seedAffiliates()), drivers = seedDrivers()
  assert.deepEqual(validateRental(values, [], vehicles, drivers), [])
  const existing = createRental(values)
  assert.ok(validateRental({ ...values, start: '2027-01-12', end: '2027-01-15' }, [existing], vehicles, drivers).some(e => e.includes('durante esas fechas')))
  assert.deepEqual(validateRental({ ...values, start: '2027-01-13', end: '2027-01-15' }, [existing], vehicles, drivers), [])
  assert.ok(validateRental({ ...values, vehicleId: 'afiliado:AFI-001' }, [], vehicles, drivers).some(e => e.includes('vehículo propio')))
  assert.equal(intervalsOverlap('2027-01-01', '2027-01-03', '2027-01-03', '2027-01-04'), true)
})
test('controla transiciones, abonos parciales y cancelación con pagos', () => {
  const initial = createRental(values), paid = payRental(initial, 10000, 'efectivo', '')
  assert.equal(rentalBalance(paid), 20000)
  assert.throws(() => payRental(paid, 20001, 'efectivo', ''), /saldo/)
  assert.throws(() => changeRentalStatus(paid, 'cancelado'), /pagos registrados/)
  const started = changeRentalStatus(paid, 'en_curso'), returned = changeRentalStatus(started, 'finalizado')
  assert.equal(returned.status, 'finalizado'); assert.throws(() => changeRentalStatus(returned, 'en_curso'))
})
test('guarda y recupera alquileres y detecta datos dañados', () => {
  const map = new Map<string, string>(), storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v) } }
  const rental = createRental(values); assert.equal(saveRentals(storage, [rental]), true); assert.deepEqual(loadRentals(storage).rentals, [rental]); map.set(RENTAL_STORAGE_KEY, '{mal'); assert.ok(loadRentals(storage).warning); assert.equal(map.get(RENTAL_STORAGE_KEY), '{mal')
})
