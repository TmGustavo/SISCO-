import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { addFee, changeStatus, debt, emptyForm, feeBalance, feePaid, isAffiliate, payFee, payFeePartial, saveAffiliate, toForm, validateForm } from '../src/features/affiliates/model.ts'
import { loadAffiliates, saveAffiliates, seedAffiliates, STORAGE_KEY } from '../src/features/affiliates/storage.ts'
import { seedRequests } from '../src/features/solicitudes/storage.ts'
import { createRequest } from '../src/features/solicitudes/model.ts'
import { prepareApproval, storeApproval } from '../src/features/affiliates/approval.ts'

const values = { ...emptyForm(), name: 'Julia Prueba', identity: '12345678', email: 'julia@ejemplo.com', phone: '987654321', address: 'Av. Principal 123', joinedAt: '2023-01-01', plate: 'AAA-123', brand: 'Toyota', model: 'Yaris', year: '2020', color: 'Rojo', monthlyFee: '120.00' }

test('valida datos, duplicados y relación con solicitudes', () => {
  const requests = seedRequests()
  const existing = seedAffiliates()
  assert.deepEqual(validateForm(values, existing, requests), {})
  const errors = validateForm({ ...values, name: '', identity: existing[0].identity, plate: existing[0].vehicle.plate, email: 'mal', phone: '123', joinedAt: '2023-02-30', monthlyFee: '0' }, existing, requests)
  for (const key of ['name', 'identity', 'plate', 'email', 'phone', 'joinedAt', 'monthlyFee']) assert.ok(errors[key as keyof typeof errors])
  assert.ok(validateForm({ ...values, requestId: 'SOL-1001' }, existing, requests).requestId)
  assert.ok(validateForm({ ...values, requestId: 'SOL-1002' }, existing, requests).requestId)
  assert.ok(validateForm({ ...toForm(existing[0]), requestId: 'SOL-1001' }, existing, requests, existing[0].id).requestId === undefined)
})

test('edita y cambia estados conservando historial e información', () => {
  const a = saveAffiliate(values)
  const edited = saveAffiliate({ ...toForm(a), address: 'Otra dirección 123', status: 'activo' }, a)
  const suspended = changeStatus(edited, 'suspendido')
  assert.equal(a.status, 'pendiente')
  assert.equal(suspended.status, 'suspendido')
  assert.equal(suspended.address, 'Otra dirección 123')
  assert.equal(suspended.history.length, 3)
  assert.equal(isAffiliate(suspended), true)
})

test('cuotas, deuda vencida y pagos usan centavos y rechazan duplicados', () => {
  const a = saveAffiliate(values)
  const due = addFee(a, '2023-01', '2023-01-10', 12000)
  const future = addFee(due, '2023-02', '2023-02-10', 12550)
  assert.equal(debt(future, '2023-01-20'), 12000)
  assert.equal(debt(future, '2023-02-10'), 24550)
  assert.throws(() => addFee(future, '2023-01', '2023-01-10', 12000))
  assert.throws(() => addFee(future, '2023-03', '2023-02-30', 12000))
  assert.throws(() => addFee(future, '2023-03', '2023-03-10', 0))
  const paid = payFee(future, future.fees[0].id)
  assert.equal(debt(paid, '2023-02-10'), 12550)
  assert.throws(() => payFee(paid, paid.fees[0].id))
  assert.match(paid.history[0].description, /Pago/)
})

test('persiste y recupera cambios, detecta corrupción y fallo de almacenamiento', () => {
  const map = new Map<string, string>()
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value) } }
  const changed = changeStatus(addFee(saveAffiliate(values), '2023-01', '2023-01-10', 12000), 'activo')
  assert.equal(saveAffiliates(storage, [changed]), true)
  assert.deepEqual(loadAffiliates(storage).affiliates, [changed])
  map.set(STORAGE_KEY, '{inválido')
  assert.notEqual(loadAffiliates(storage).warning, '')
  assert.equal(map.get(STORAGE_KEY), '{inválido')
  assert.equal(saveAffiliates({ setItem: () => { throw new Error('sin espacio') } }, [changed]), false)
})

test('aprobar una solicitud activa la ficha existente y evita duplicados', () => {
  const affiliates = seedAffiliates()
  const requests = seedRequests()
  const result = prepareApproval('SOL-1001', affiliates, requests)
  assert.equal(result.affiliates.length, affiliates.length)
  assert.equal(result.affiliate.id, affiliates[0].id)
  assert.equal(result.affiliate.status, 'activo')
  assert.equal(result.requests.find(r => r.id === 'SOL-1001')?.status, 'aprobada')
  assert.equal(affiliates[0].status, 'pendiente')
  assert.throws(() => prepareApproval('SOL-1001', affiliates, requests, values), /ya está registrado/)
  assert.throws(() => prepareApproval('SOL-1002', affiliates, requests), /solicitud de afiliación/)
  assert.throws(() => prepareApproval('SOL-1001', [{ ...affiliates[0], requestId: 'OTRA' }], requests), /otra solicitud/)
})

test('aprobar un solicitante nuevo valida la ficha y crea una única relación', () => {
  const request = createRequest({ type: 'afiliacion', name: values.name, identity: values.identity, email: values.email, phone: values.phone, reference: values.plate, serviceDate: '', description: '' })
  const requests = [request]
  const result = prepareApproval(request.id, [], requests, { ...values, requestId: request.id })
  assert.equal(result.affiliate.requestId, request.id)
  assert.equal(result.affiliate.status, 'activo')
  assert.equal(result.requests[0].status, 'aprobada')
  assert.equal(prepareApproval(request.id, result.affiliates, result.requests).affiliates.length, 1)
  assert.throws(() => prepareApproval(request.id, [], [{ ...request, status: 'rechazada' }], values), /rechazada/)
  assert.throws(() => prepareApproval(request.id, [], requests, { ...values, identity: '87654321' }), /Revisa los datos/)
})

test('la aprobación revierte la ficha si falla al guardar la solicitud', () => {
  const map = new Map<string, string>([[STORAGE_KEY, 'antes']])
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { if (key === 'kaluz.solicitudes.v1') throw new Error('lleno'); map.set(key, value) }, removeItem: (key: string) => { map.delete(key) } }
  assert.match(storeApproval(storage, seedAffiliates(), seedRequests()), /estado anterior/)
  assert.equal(map.get(STORAGE_KEY), 'antes')
})

test('abonos parciales actualizan saldo e historial y conservan pagos anteriores', () => {
  const original = addFee(saveAffiliate(values), '2023-01', '2023-01-10', 12000)
  const partial = payFeePartial(original, original.fees[0].id, 3500, 'efectivo', 'REC-01')
  assert.equal(feePaid(partial.fees[0]), 3500); assert.equal(feeBalance(partial.fees[0]), 8500); assert.equal(debt(partial, '2023-02-01'), 8500)
  assert.throws(() => payFeePartial(partial, partial.fees[0].id, 8501, 'efectivo', ''), /saldo/)
  const final = payFee(partial, partial.fees[0].id)
  assert.equal(feeBalance(final.fees[0]), 0); assert.equal(final.fees[0].payments?.length, 2); assert.equal(debt(final, '2023-02-01'), 0)
  const legacy = { ...original.fees[0], paidAt: '2023-01-15T12:00:00Z' }
  assert.equal(feePaid(legacy), 12000); assert.equal(feeBalance(legacy), 0); assert.equal(isAffiliate({ ...original, fees: [legacy] }), true)
})
